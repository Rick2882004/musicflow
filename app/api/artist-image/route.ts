import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LASTFM_API_KEY;

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist");

  if (!artist) {
    return NextResponse.json({ image: null });
  }

  // 1. Try Deezer public API for official, high-resolution artist portraits
  try {
    const deezerRes = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}&limit=1`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    if (deezerRes.ok) {
      const deezerData = await deezerRes.json();
      const match = deezerData.data?.[0];
      if (match && (match.picture_big || match.picture_medium || match.picture)) {
        return NextResponse.json({
          image: match.picture_big || match.picture_medium || match.picture,
        });
      }
    }
  } catch {
    // continue to fallback
  }


  // 2. Fallback to Last.fm if API key is present
  if (API_KEY) {
    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
          artist
        )}&api_key=${API_KEY}&format=json`
      );
      const data = await response.json();
      const lastFmImg =
        data?.artist?.image?.[data.artist.image.length - 1]?.["#text"];
      if (lastFmImg) {
        return NextResponse.json({ image: lastFmImg });
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ image: null });
}