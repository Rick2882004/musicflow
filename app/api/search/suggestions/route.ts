import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const suggestions = await getSuggestions(query);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
