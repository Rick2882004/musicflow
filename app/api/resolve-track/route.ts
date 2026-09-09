import { NextRequest, NextResponse } from "next/server";
import { resolvePlayableYouTubeId } from "@/lib/canonical-music";
import { searchSongs } from "@/lib/ytmusic";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";
  const album = searchParams.get("album") || undefined;
  const durationStr = searchParams.get("duration");
  const duration = durationStr ? parseInt(durationStr, 10) : undefined;

  if (!title) {
    return NextResponse.json(
      { matched: false, error: "Missing required query parameter: title" },
      { status: 400 }
    );
  }

  try {
    // 1. Try canonical resolution with scoring and duration checking
    let videoId = await resolvePlayableYouTubeId(title, artist, duration, album);

    // 2. Direct search fallback if canonical resolution didn't find a high-confidence match
    if (!videoId) {
      const fallbackQuery = `${title} ${artist}`.trim();
      const candidates = await searchSongs(fallbackQuery);
      if (candidates && candidates.length > 0 && candidates[0]?.videoId) {
        videoId = candidates[0].videoId;
      }
    }

    if (videoId && !videoId.startsWith("itunes-")) {
      return NextResponse.json(
        { matched: true, videoId, title, artist },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        }
      );
    }

    return NextResponse.json(
      { matched: false, videoId: "", title, artist },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resolve track API error:", error);
    return NextResponse.json(
      { matched: false, videoId: "", error: "Failed to resolve track" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artist, album, duration } = body;

    if (!title) {
      return NextResponse.json(
        { matched: false, error: "Missing required field: title" },
        { status: 400 }
      );
    }

    let videoId = await resolvePlayableYouTubeId(
      title,
      artist || "",
      duration ? Number(duration) : undefined,
      album
    );

    if (!videoId) {
      const fallbackQuery = `${title} ${artist || ""}`.trim();
      const candidates = await searchSongs(fallbackQuery);
      if (candidates && candidates.length > 0 && candidates[0]?.videoId) {
        videoId = candidates[0].videoId;
      }
    }

    if (videoId && !videoId.startsWith("itunes-")) {
      return NextResponse.json({ matched: true, videoId, title, artist });
    }

    return NextResponse.json({ matched: false, videoId: "", title, artist });
  } catch (error) {
    console.error("Resolve track POST error:", error);
    return NextResponse.json(
      { matched: false, videoId: "", error: "Failed to resolve track" },
      { status: 500 }
    );
  }
}
