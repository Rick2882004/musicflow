import { NextRequest, NextResponse } from "next/server";
import { getLyrics } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId parameter" }, { status: 400 });
  }

  try {
    const lyrics = await getLyrics(videoId);
    if (!lyrics) {
      return NextResponse.json({ lyrics: null });
    }
    return NextResponse.json({ lyrics });
  } catch (error) {
    console.error("Lyrics API error:", error);
    return NextResponse.json({ error: "Failed to fetch lyrics" }, { status: 500 });
  }
}
