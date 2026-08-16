# Finer Sounds → Spotify

A tiny personal Next.js app that checks Finer Sounds' New Arrivals collection, extracts Spotify album/track embeds, and adds the corresponding tracks to an existing Spotify playlist.

## Recommended hosting

- **GitHub**: source code
- **Vercel**: hosting + Saturday cron job
- **Spotify Developer Dashboard**: OAuth app

## What it does

Every Saturday at 15:00 UTC, Vercel calls `/api/run`.

The job:

1. Reads `https://finersounds.com/collections/new-arrivals-music`
2. Finds product pages.
3. Finds Spotify album or track embeds on those pages.
4. Fetches album tracks from Spotify.
5. Reads the existing target playlist.
6. Adds only tracks that are not already present.

No database is required for V1.

## Environment variables

Copy `.env.example` to `.env.local` for local development.

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_PLAYLIST_ID`
- `APP_URL`
- `CRON_SECRET`

## Spotify setup

1. Go to the Spotify Developer Dashboard and create an app.
2. Add this redirect URI:
   - local: `http://localhost:3000/api/spotify/callback`
   - production: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/spotify/callback`
3. Put the Client ID and Client Secret in your environment variables.
4. Open `/api/spotify/login`.
5. Approve access.
6. Copy the displayed refresh token to `SPOTIFY_REFRESH_TOKEN`.

Requested scopes:
- `playlist-read-private`
- `playlist-modify-private`
- `playlist-modify-public`

## Playlist ID

Open your existing “Finer Sounds” playlist in Spotify and use Share → Copy link to playlist.

A URL like:

`https://open.spotify.com/playlist/37i9dQZF1Example`

has playlist ID:

`37i9dQZF1Example`

Put that value in `SPOTIFY_PLAYLIST_ID`.

## Deploy on Vercel

1. Push this folder to a new GitHub repo.
2. Import that repo into Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy.
5. Set `APP_URL` to the deployed HTTPS URL.
6. Add that production callback URL to the Spotify app's redirect URIs.
7. Visit `/api/spotify/login` on the deployed app and save the resulting refresh token in Vercel.
8. Redeploy.

The included `vercel.json` runs the job every Saturday at 15:00 UTC.

## Manual testing

For security, if `CRON_SECRET` is configured, `/api/run` expects:

`Authorization: Bearer YOUR_CRON_SECRET`

Vercel Cron adds this automatically.

For initial manual browser testing, temporarily leave `CRON_SECRET` unset, deploy, visit `/api/run`, then set `CRON_SECRET` afterward and redeploy.

## Notes

- V1 checks the current New Arrivals collection rather than relying on Finer Sounds dates.
- Duplicate protection comes from comparing Spotify track URIs already in the target playlist.
- If Finer Sounds changes its Shopify markup, the scraper selectors may need a small update.
