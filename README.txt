Replace exactly these two files in your GitHub repository:

app/api/spotify/login/route.ts
app/api/spotify/callback/route.ts

Then commit to main. Vercel should redeploy automatically.

This V2 keeps Spotify's OAuth state protection, but makes the state much shorter
and strictly URL-safe to avoid the verification problem seen with the previous patch.

After Vercel is Ready:
1. Open https://finer-sounds-spotify.vercel.app/
2. Click Connect Spotify.
3. Approve access.
4. You should see “Spotify connected.” and a refresh token.
5. Do NOT share the token.
6. Add it in Vercel as SPOTIFY_REFRESH_TOKEN and redeploy.
