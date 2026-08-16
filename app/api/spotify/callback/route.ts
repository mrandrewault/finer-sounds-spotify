import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = req.cookies.get("spotify_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.json({ error: "Spotify authorization state mismatch." }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json({ error: "Missing Spotify app environment variables." }, { status: 500 });
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
    return NextResponse.json({ error: await tokenRes.text() }, { status: 500 });
  }

  const tokens = await tokenRes.json();
  const refresh = tokens.refresh_token;

  return new NextResponse(
    `<!doctype html>
    <html><body style="font-family:system-ui;max-width:760px;margin:60px auto;padding:24px">
      <h1>Spotify connected.</h1>
      <p>Copy this refresh token into the Vercel environment variable <code>SPOTIFY_REFRESH_TOKEN</code>.</p>
      <textarea style="width:100%;height:160px">${refresh || "No refresh token returned. Re-run authorization with show_dialog=true."}</textarea>
      <p>Keep this token private. After saving it in Vercel, redeploy the project.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
