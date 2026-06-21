import { getArtistInfo } from "./lastfm";
import { getArtistPhoto } from "./wiki";

export async function getArtistData(
  artistName: string
) {
  const [lastfm, wiki] =
    await Promise.all([
      getArtistInfo(
        artistName
      ),
      getArtistPhoto(
        artistName
      ),
    ]);

  return {
    name:
      lastfm?.name ||
      artistName,

    image:
      wiki?.image ||
      null,

    description:
      wiki?.description ||
      "",

    listeners:
      lastfm?.stats
        ?.listeners ||
      "0",

    playcount:
      lastfm?.stats
        ?.playcount ||
      "0",

    bio:
      lastfm?.bio
        ?.summary ||
      "",

    similar:
      lastfm?.similar
        ?.artist ||
      [],
  };
}