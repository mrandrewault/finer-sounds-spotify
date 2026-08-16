# Auto-find “Finer Sounds” playlist patch

This patch removes the need for `SPOTIFY_PLAYLIST_ID`.

The app now asks Spotify for the connected account's playlists, finds the one
named exactly `Finer Sounds`, and uses the playlist ID returned by Spotify.

## Replace these files in GitHub

- `lib/spotify.ts`
- `app/api/run/route.ts`

Upload them into the existing repository, replacing the originals, and commit
to `main`.

Vercel should automatically redeploy.

## After Vercel is Ready

Open:

`https://finer-sounds-spotify.vercel.app/api/run`

The JSON response should now include:

- `playlist.name`
- `playlist.id`
- `finerSoundsProductsScanned`
- `productsWithSpotify`
- `spotifyItemsFound`
- `alreadyInPlaylist`
- `added`

If `added` is greater than 0, those songs should appear in your Spotify
playlist immediately.

## Vercel cleanup

After this patch is working, you can delete the old `SPOTIFY_PLAYLIST_ID`
environment variable. It is no longer used.
