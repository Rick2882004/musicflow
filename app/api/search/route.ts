import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchSongs(query);

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Search failed",
      },
      {
        status: 500,
      }
    );
  }
}