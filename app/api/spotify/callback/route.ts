import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyState(state: string, secret: string) {
  const [encodedPayload, providedSignature] = state.split(".");
  if (!encodedPayload || !providedSignature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  if (!safeEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );

    if (!payload?.nonce || typeof payload?.issuedAt !== "number") return false;

    const age = Date.now() - payload.issuedAt;
    return age >= 0 && age <= STATE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const spotifyError = url.searchParams.get("error");

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: "Missing Spotify app environment variables." },
      { status: 500 }
    );
  }

  if (spotifyError) {
    return NextResponse.json(
      { error: `Spotify authorization failed: ${spotifyError}` },
      { status: 400 }
    );
  }

  if (!code || !state || !verifyState(state, clientSecret)) {
    return NextResponse.json(
      {
        error:
          "Spotify authorization state could not be verified. Return to the app and click Connect Spotify again."
      },
      { status: 400 }
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/spotify/callback`
    }),
    cache: "no-store"
  });

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: `Spotify token exchange failed: ${await tokenRes.text()}` },
      { status: 500 }
    );
  }

  const tokens = await tokenRes.json();
  const refreshToken = tokens.refresh_token;

  if (!refreshToken) {
    return NextResponse.json(
      {
        error:
          "Spotify connected, but no refresh token was returned. Return to the app and click Connect Spotify again."
      },
      { status: 500 }
    );
  }

  const approximateReconnectDate = new Date(
    Date.now() + 180 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return new NextResponse(
    `<!doctype html>
    <html>
      <body style="font-family:system-ui,sans-serif;max-width:760px;margin:60px auto;padding:24px;line-height:1.5">
        <h1>Spotify connected.</h1>
        <p>Copy the refresh token below into the Vercel environment variable <code>SPOTIFY_REFRESH_TOKEN</code>.</p>
        <textarea readonly style="width:100%;height:160px;padding:12px;font-family:monospace">${refreshToken}</textarea>
        <p><strong>Keep this token private.</strong> Do not paste it into GitHub or send it in a screenshot.</p>
        <p>Spotify currently gives Development Mode refresh tokens a 180-day lifetime. Plan to reconnect around <strong>${approximateReconnectDate}</strong>.</p>
        <p>If the automation later reports that Spotify authorization expired, return to the app, click <strong>Connect Spotify</strong> again, replace the refresh token in Vercel, and redeploy.</p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
