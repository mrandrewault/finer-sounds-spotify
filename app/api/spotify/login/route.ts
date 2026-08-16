import { NextResponse } from "next/server";
import crypto from "crypto";

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signState(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: "Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and APP_URL first." },
      { status: 500 }
    );
  }

  const statePayload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString("hex"),
    issuedAt: Date.now()
  });

  const encodedPayload = b64url(statePayload);
  const signature = signState(encodedPayload, clientSecret);
  const state = `${encodedPayload}.${signature}`;

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
