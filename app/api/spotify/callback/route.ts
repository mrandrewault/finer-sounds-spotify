import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const MAX_STATE_AGE_MS = 10 * 60 * 1000;

function sign(value: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex")
    .slice(0, 32);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function verifyState(state: string, secret: string) {
  const parts = state.split(".");
  if (parts.length !== 3) return false;

  const [timestamp36, nonce, providedSignature] = parts;
  if (!timestamp36 || !nonce || !providedSignature) return false;

  const unsignedState = `${timestamp36}.${nonce}`;
  const expectedSignature = sign(unsignedState, secret);

  if (!safeEqual(providedSignature, expectedSignature)) return false;

  const timestamp = parseInt(timestamp36, 36);
  if (!Number.isFinite(timestamp)) return false;

  const age = Date.now() - timestamp;
  return age >= 0 && age <= MAX_STATE_AGE_MS;
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
      { error: "Spotify connected, but no refresh token was returned. Please connect again." },
      { status: 500 }
    );
  }

  return new NextResponse(
    `<!doctype html>
    <html>
      <body style="font-family:system-ui,sans-serif;max-width:760px;margin:60px auto;padding:24px;line-height:1.5">
        <h1>Spotify connected.</h1>
        <p>Copy the refresh token below into Vercel as <code>SPOTIFY_REFRESH_TOKEN</code>.</p>
        <textarea readonly style="width:100%;height:160px;padding:12px;font-family:monospace">${refreshToken}</textarea>
        <p><strong>Keep this token private.</strong> Do not paste it into GitHub or send it in a screenshot.</p>
        <p>After saving it in Vercel, redeploy the project.</p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
