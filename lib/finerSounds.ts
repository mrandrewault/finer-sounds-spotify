import * as cheerio from "cheerio";

const BASE = "https://finersounds.com";
const COLLECTION = `${BASE}/collections/new-arrivals-music`;

// We only need the newest batch each Saturday, not the entire historical
// New Arrivals collection. 60 gives us plenty of cushion for a busy week.
const MAX_PRODUCTS_TO_SCAN = 60;

// Be polite to Finer Sounds and avoid hammering Shopify.
const PRODUCT_DELAY_MS = 550;
const MAX_RETRIES = 4;

export type FinerProduct = {
  url: string;
  title: string;
  spotifyAlbumIds: string[];
  spotifyTrackUris: string[];
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFinerSounds(url: string) {
  let lastStatus = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FinerSoundsSpotify/1.0; personal playlist helper)",
        Accept: "text/html,application/xhtml+xml"
      },
      cache: "no-store"
    });

    lastStatus = res.status;

    if (res.ok) {
      return res;
    }

    if (res.status !== 429) {
      throw new Error(`Finer Sounds request failed: ${res.status} ${url}`);
    }

    // Honor Retry-After if Finer Sounds sends it; otherwise exponential backoff.
    const retryAfter = res.headers.get("retry-after");
    let waitMs = retryAfter ? Number(retryAfter) * 1000 : 2000 * Math.pow(2, attempt);

    if (!Number.isFinite(waitMs) || waitMs <= 0) {
      waitMs = 2000 * Math.pow(2, attempt);
    }

    // Cap any one wait at 30 seconds.
    waitMs = Math.min(waitMs, 30000);

    if (attempt < MAX_RETRIES) {
      await sleep(waitMs);
    }
  }

  throw new Error(
    `Finer Sounds is temporarily rate-limiting the scraper (${lastStatus}). Try again in 10–20 minutes; the Saturday automation will also retry automatically.`
  );
}

export async function getNewArrivalProductUrls() {
  const urls: string[] = [];
  let page = 1;

  // Shopify supports created-descending sorting. We intentionally stop once
  // we've collected the newest 60 products.
  while (urls.length < MAX_PRODUCTS_TO_SCAN && page <= 5) {
    const url = `${COLLECTION}?sort_by=created-descending&page=${page}`;
    const res = await fetchFinerSounds(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const pageUrls = unique(
      $('a[href*="/products/"]')
        .map((_, el) => $(el).attr("href"))
        .get()
        .filter(Boolean)
        .map((href) => new URL(href!, BASE).toString())
    );

    if (!pageUrls.length) break;

    for (const productUrl of pageUrls) {
      if (!urls.includes(productUrl)) {
        urls.push(productUrl);
      }
      if (urls.length >= MAX_PRODUCTS_TO_SCAN) break;
    }

    const hasNext =
      $(`a[href*="page=${page + 1}"]`).length > 0 ||
      $('a[rel="next"]').length > 0;

    if (!hasNext) break;
    page++;
  }

  return urls.slice(0, MAX_PRODUCTS_TO_SCAN);
}

export async function inspectProduct(url: string): Promise<FinerProduct> {
  // Throttle every product-page request.
  await sleep(PRODUCT_DELAY_MS);

  const res = await fetchFinerSounds(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() || $("title").text().trim() || url;

  const candidates = [
    ...$('iframe[src*="open.spotify.com"]')
      .map((_, el) => $(el).attr("src"))
      .get(),
    ...$('a[href*="open.spotify.com"]')
      .map((_, el) => $(el).attr("href"))
      .get()
  ].filter(Boolean) as string[];

  const albumIds: string[] = [];
  const trackUris: string[] = [];

  for (const raw of candidates) {
    const decoded = raw.replaceAll("&amp;", "&");

    const album = decoded.match(
      /open\.spotify\.com\/(?:embed\/)?album\/([A-Za-z0-9]+)/
    );
    const track = decoded.match(
      /open\.spotify\.com\/(?:embed\/)?track\/([A-Za-z0-9]+)/
    );

    if (album) albumIds.push(album[1]);
    if (track) trackUris.push(`spotify:track:${track[1]}`);
  }

  return {
    url,
    title,
    spotifyAlbumIds: unique(albumIds),
    spotifyTrackUris: unique(trackUris)
  };
}
