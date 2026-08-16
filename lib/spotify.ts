const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

export async function getAccessToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error(
      "Missing Spotify environment variables. If Spotify has not been connected yet, open the app and click Connect Spotify."
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const body = await res.text();

    if (res.status === 400 && body.includes("invalid_grant")) {
      throw new Error(
        "Spotify authorization has expired or been revoked. Open the Finer Sounds → Spotify app, click Connect Spotify, then replace SPOTIFY_REFRESH_TOKEN in Vercel with the new token and redeploy."
      );
    }

    throw new Error(
      `Spotify token refresh failed (${res.status}). Reconnect Spotify from the app if this continues. ${body}`
    );
  }

  const data = await res.json();
  return data.access_token as string;
}

async function spotifyFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Spotify API ${path} failed: ${res.status} ${await res.text()}`);
  }

  return res.status === 204 ? null : res.json();
}

export async function findPlaylistByName(name: string, accessToken: string) {
  let path = `/me/playlists?limit=50`;

  while (path) {
    const data = await spotifyFetch(path, accessToken);

    for (const playlist of data.items || []) {
      if (
        playlist?.name &&
        playlist?.id &&
        playlist.name.trim().toLowerCase() === name.trim().toLowerCase()
      ) {
        return {
          id: playlist.id as string,
          name: playlist.name as string,
          ownerDisplayName: playlist.owner?.display_name || null
        };
      }
    }

    path = data.next
      ? new URL(data.next).pathname + new URL(data.next).search
      : "";
  }

  return null;
}

export async function getAlbumTrackUris(albumId: string, accessToken: string) {
  const uris: string[] = [];
  let path = `/albums/${albumId}/tracks?limit=50`;

  while (path) {
    const data = await spotifyFetch(path, accessToken);

    for (const item of data.items || []) {
      if (item?.uri) uris.push(item.uri);
    }

    path = data.next
      ? new URL(data.next).pathname + new URL(data.next).search
      : "";
  }

  return uris;
}

export async function getPlaylistTrackUris(playlistId: string, accessToken: string) {
  const uris = new Set<string>();
  let path = `/playlists/${playlistId}/items?limit=100`;

  while (path) {
    const data = await spotifyFetch(path, accessToken);

    for (const item of data.items || []) {
      const uri = item?.item?.uri || item?.track?.uri;
      if (uri) uris.add(uri);
    }

    path = data.next
      ? new URL(data.next).pathname + new URL(data.next).search
      : "";
  }

  return uris;
}

export async function addItemsToPlaylist(
  playlistId: string,
  uris: string[],
  accessToken: string
) {
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);

    await spotifyFetch(`/playlists/${playlistId}/items`, accessToken, {
      method: "POST",
      body: JSON.stringify({ uris: batch })
    });
  }
}
