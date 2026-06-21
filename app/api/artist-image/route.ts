import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LASTFM_API_KEY!;

export async function GET(
  request: NextRequest
) {
  const artist =
    request.nextUrl.searchParams.get(
      "artist"
    );

  if (!artist) {
    return NextResponse.json({
      image: null,
    });
  }

  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
        artist
      )}&api_key=${API_KEY}&format=json`
    );

    const data =
      await response.json();

    const image =
      data?.artist?.image?.[
        data.artist.image.length - 1
      ]?.["#text"] || null;

    return NextResponse.json({
      image,
    });
  } catch {
    return NextResponse.json({
      image: null,
    });
  }
}