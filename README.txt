FINER SOUNDS → SPOTIFY: PAGINATION FIX

Replace exactly this file in GitHub:

lib/spotify.ts

Why:
Your Finer Sounds playlist has more than 100 songs. Spotify returned a normal
next-page URL containing /v1/, but the old code prefixed another /v1/. That
made page 2 request /v1/v1/playlists/... and fail.

This replacement normalizes all Spotify pagination URLs correctly.

Steps:
1. Upload lib/spotify.ts into the existing /lib folder in GitHub, replacing the old file.
2. Commit to main.
3. Wait for Vercel to show the deployment as Ready.
4. Open:
   https://finer-sounds-spotify.vercel.app/api/run
5. If successful, the JSON should contain "ok": true and an "added" count.
