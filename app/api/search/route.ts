import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({
      results: [],
    });
  }

  try {
    const results = await searchSongs(query);

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Search API Error:", error);

    return NextResponse.json(
      {
        error: "Search failed",
        results: [],
      },
      {
        status: 500,
      }
    );
  }
}