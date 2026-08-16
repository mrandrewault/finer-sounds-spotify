# Finer Sounds → Spotify OAuth patch

This patch replaces the original cookie-based Spotify OAuth state check with a
short-lived cryptographically signed state value.

## Replace these files in GitHub

- `app/api/spotify/login/route.ts`
- `app/api/spotify/callback/route.ts`
- `lib/spotify.ts`
- `app/page.tsx`

Upload them into the existing repository, replacing the originals, and commit to
`main`. Vercel should automatically redeploy.

## After redeploy

1. Open `https://finer-sounds-spotify.vercel.app/`
2. Click **Connect Spotify**
3. Approve access
4. Copy the displayed refresh token
5. Add it in Vercel as `SPOTIFY_REFRESH_TOKEN`
6. Redeploy again

Do not put the refresh token or client secret in GitHub.

If Spotify later reports an expired/revoked refresh token, reconnect Spotify,
replace `SPOTIFY_REFRESH_TOKEN`, and redeploy.
