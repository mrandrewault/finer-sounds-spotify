FINER SOUNDS → SPOTIFY: RATE-LIMIT FIX

Replace exactly this file in GitHub:

lib/finerSounds.ts

What this changes:
- Sorts Finer Sounds New Arrivals newest-first.
- Scans only the newest 60 products instead of the entire collection.
- Waits 550ms between product-page requests.
- Retries HTTP 429 responses with exponential backoff.
- Honors Finer Sounds' Retry-After header when present.

Steps:
1. Upload lib/finerSounds.ts into the existing /lib folder in GitHub.
2. Replace the old file and commit to main.
3. Wait for Vercel to show the deployment as Ready.
4. Because you've just triggered several test runs, wait about 10–20 minutes before testing again.
5. Then open:
   https://finer-sounds-spotify.vercel.app/api/run

If the response contains "ok": true and "added": a number, check Spotify.

The normal Saturday automation should be much less likely to hit a rate limit
because it will run only once per week.
