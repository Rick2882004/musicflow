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
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Search request timed out")), 10000);
    });
    const results = await Promise.race([
      searchSongs(query),
      timeoutPromise,
    ]);

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