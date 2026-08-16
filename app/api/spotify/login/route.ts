import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) {
    return NextResponse.json({ error: "Set SPOTIFY_CLIENT_ID and APP_URL first." }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const scope = [
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public"
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: `${appUrl}/api/spotify/callback`,
    state,
    show_dialog: "true"
  });

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: appUrl.startsWith("https://"),
    sameSite: "lax",
    maxAge: 600,
    path: "/"
  });
  return response;
}
