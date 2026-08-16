export default function Home() {
  return (
    <main>
      <h1>Finer Sounds → Spotify</h1>
      <p>
        Every Saturday this app checks the Finer Sounds New Arrivals collection,
        finds products with Spotify embeds, and adds their tracks to your selected Spotify playlist.
      </p>
      <h2>Setup</h2>
      <ol>
        <li>Create a Spotify Developer app.</li>
        <li>Add <code>{process.env.APP_URL || "http://localhost:3000"}/api/spotify/callback</code> as a Redirect URI.</li>
        <li>Set <code>SPOTIFY_CLIENT_ID</code>, <code>SPOTIFY_CLIENT_SECRET</code>, and <code>APP_URL</code>.</li>
        <li><a href="/api/spotify/login">Connect Spotify</a>.</li>
        <li>Copy the refresh token shown after authorization into <code>SPOTIFY_REFRESH_TOKEN</code>.</li>
        <li>Set <code>SPOTIFY_PLAYLIST_ID</code> to your existing “Finer Sounds” playlist ID.</li>
      </ol>
      <p>
        After setup, visit <code>/api/run</code> manually once to test. Vercel will then invoke it every Saturday.
      </p>
    </main>
  );
}
