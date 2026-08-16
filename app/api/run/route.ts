import { NextRequest, NextResponse } from "next/server";
import { getNewArrivalProductUrls, inspectProduct } from "../../../lib/finerSounds";
import {
  addItemsToPlaylist,
  findPlaylistByName,
  getAccessToken,
  getAlbumTrackUris,
  getPlaylistTrackUris
} from "../../../lib/spotify";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = await getAccessToken();
    const playlist = await findPlaylistByName("Finer Sounds", accessToken);

    if (!playlist) {
      return NextResponse.json(
        {
          error:
            'Could not find a Spotify playlist named "Finer Sounds" in the connected Spotify account.'
        },
        { status: 404 }
      );
    }

    const existing = await getPlaylistTrackUris(playlist.id, accessToken);
    const productUrls = await getNewArrivalProductUrls();

    const productsWithSpotify = [];
    const candidateUris: string[] = [];

    for (const url of productUrls) {
      const product = await inspectProduct(url);

      if (!product.spotifyAlbumIds.length && !product.spotifyTrackUris.length) {
        continue;
      }

      productsWithSpotify.push({
        title: product.title,
        url: product.url,
        albumIds: product.spotifyAlbumIds
      });

      candidateUris.push(...product.spotifyTrackUris);

      for (const albumId of product.spotifyAlbumIds) {
        candidateUris.push(...(await getAlbumTrackUris(albumId, accessToken)));
      }
    }

    const uniqueCandidateUris = [...new Set(candidateUris)];
    const newUris = uniqueCandidateUris.filter((uri) => !existing.has(uri));

    if (newUris.length) {
      await addItemsToPlaylist(playlist.id, newUris, accessToken);
    }

    return NextResponse.json({
      ok: true,
      playlist: {
        name: playlist.name,
        id: playlist.id,
        owner: playlist.ownerDisplayName
      },
      finerSoundsProductsScanned: productUrls.length,
      productsWithSpotify: productsWithSpotify.length,
      spotifyItemsFound: uniqueCandidateUris.length,
      alreadyInPlaylist: uniqueCandidateUris.length - newUris.length,
      added: newUris.length,
      releases: productsWithSpotify
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
