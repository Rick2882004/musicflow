const API_KEY = process.env.LASTFM_API_KEY;

export async function getArtistInfo(
  artist: string
) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
    artist
  )}&api_key=${API_KEY}&format=json`;

  const res = await fetch(url);

  const data = await res.json();

  return data.artist;
}