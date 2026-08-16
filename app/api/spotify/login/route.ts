import { NextResponse } from "next/server";
import crypto from "crypto";

function sign(value: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex")
    .slice(0, 32);
}

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, or APP_URL." },
      { status: 500 }
    );
  }

  // Keep OAuth state deliberately short and URL-safe.
  // Format: timestamp.nonce.signature
  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(8).toString("hex");
  const unsignedState = `${timestamp}.${nonce}`;
  const state = `${unsignedState}.${sign(unsignedState, clientSecret)}`;

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

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
