import { NextRequest, NextResponse } from "next/server";
import { getArtistDetails, searchArtists } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const id = request.nextUrl.searchParams.get("id");

  try {
    let artistId = id;

    if (!artistId && name) {
      // Search for artist by name to get their ID
      const artists = await searchArtists(name);
      if (artists && artists.length > 0) {
        artistId = artists[0].artistId;
      }
    }

    if (!artistId) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const details = await getArtistDetails(artistId);
    return NextResponse.json(details);
  } catch (error) {
    console.error("Artist API error:", error);
    return NextResponse.json({ error: "Failed to fetch artist details" }, { status: 500 });
  }
}
