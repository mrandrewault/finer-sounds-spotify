import * as cheerio from "cheerio";

const BASE = "https://finersounds.com";
const COLLECTION = `${BASE}/collections/new-arrivals-music`;

export type FinerProduct = {
  url: string;
  title: string;
  spotifyAlbumIds: string[];
  spotifyTrackUris: string[];
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export async function getNewArrivalProductUrls() {
  const urls: string[] = [];
  let page = 1;

  while (page <= 10) {
    const res = await fetch(`${COLLECTION}?page=${page}`, {
      headers: { "User-Agent": "FinerSoundsSpotify/0.1 personal playlist helper" },
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`Finer Sounds collection failed: ${res.status}`);
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
    urls.push(...pageUrls);

    // Shopify pagination usually exposes a "next" link; if none, we're done.
    const hasNext = $('a[href*="page=' + (page + 1) + '"]').length > 0;
    if (!hasNext) break;
    page++;
  }

  return unique(urls);
}

export async function inspectProduct(url: string): Promise<FinerProduct> {
  const res = await fetch(url, {
    headers: { "User-Agent": "FinerSoundsSpotify/0.1 personal playlist helper" },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Finer Sounds product failed: ${res.status} ${url}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $("h1").first().text().trim() || $("title").text().trim() || url;

  const candidates = [
    ...$('iframe[src*="open.spotify.com"]').map((_, el) => $(el).attr("src")).get(),
    ...$('a[href*="open.spotify.com"]').map((_, el) => $(el).attr("href")).get()
  ].filter(Boolean) as string[];

  const albumIds: string[] = [];
  const trackUris: string[] = [];

  for (const raw of candidates) {
    let decoded = raw.replaceAll("&amp;", "&");
    const album = decoded.match(/open\.spotify\.com\/(?:embed\/)?album\/([A-Za-z0-9]+)/);
    const track = decoded.match(/open\.spotify\.com\/(?:embed\/)?track\/([A-Za-z0-9]+)/);
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
