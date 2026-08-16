export default function Home() {
  return (
    <main>
      <h1>Finer Sounds → Spotify</h1>
      <p>
        Every Saturday this app checks the Finer Sounds New Arrivals collection,
        finds products with Spotify embeds, and adds their tracks to your selected
        Spotify playlist.
      </p>

      <h2>Setup</h2>
      <ol>
        <li>Create a Spotify Developer app.</li>
        <li>
          Add <code>{process.env.APP_URL || "YOUR_APP_URL"}/api/spotify/callback</code>{" "}
          as its Redirect URI.
        </li>
        <li>
          Set <code>SPOTIFY_CLIENT_ID</code>, <code>SPOTIFY_CLIENT_SECRET</code>,
          and <code>APP_URL</code> in Vercel.
        </li>
        <li><a href="/api/spotify/login">Connect Spotify</a>.</li>
        <li>
          Copy the refresh token shown after authorization into{" "}
          <code>SPOTIFY_REFRESH_TOKEN</code> in Vercel.
        </li>
        <li>
          Set <code>SPOTIFY_PLAYLIST_ID</code> to your existing “Finer Sounds”
          playlist ID.
        </li>
      </ol>

      <p>
        Spotify Development Mode refresh tokens currently last 180 days. If the
        automation later reports that authorization expired, click{" "}
        <strong>Connect Spotify</strong> again, replace the refresh token in
        Vercel, and redeploy.
      </p>
    </main>
  );
}
