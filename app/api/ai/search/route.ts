import { NextRequest, NextResponse } from "next/server";
import { executeAISearch } from "@/lib/ai/search/ai-search-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json(
      {
        intent: { rawQuery: "", intent: "music_discovery", searchKeywords: [] },
        results: [],
        artists: [],
        albums: [],
        explanation: "",
        source: "fallback",
      },
      { status: 200 }
    );
  }

  try {
    const data = await executeAISearch(q);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("AI Search API GET error:", error);
    return NextResponse.json(
      { error: "AI search processing error", results: [], artists: [], albums: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const data = await executeAISearch(query, context);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Search API POST error:", error);
    return NextResponse.json(
      { error: "AI search processing error", results: [], artists: [], albums: [] },
      { status: 500 }
    );
  }
}
