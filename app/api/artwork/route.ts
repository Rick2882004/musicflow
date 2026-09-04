import { NextRequest, NextResponse } from "next/server";
import { resolveITunesTrack, resolveITunesAlbum } from "@/lib/itunes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "song";
  const title = searchParams.get("title") || searchParams.get("q") || searchParams.get("name") || "";
  const artist = searchParams.get("artist") || "";
  const album = searchParams.get("album") || undefined;

  if (!title) {
    return NextResponse.json(
      { matched: false, error: "Missing required query parameter: title or name" },
      { status: 400 }
    );
  }

  try {
    if (type === "album") {
      const albumResult = await resolveITunesAlbum(title, artist);
      if (albumResult && albumResult.matched) {
        return NextResponse.json(albumResult, {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      }
      return NextResponse.json({ matched: false, title, artist }, { status: 200 });
    }

    // Default: Song / Track resolution
    const trackResult = await resolveITunesTrack(title, artist, album);
    if (trackResult && trackResult.matched) {
      return NextResponse.json(trackResult, {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }

    return NextResponse.json({ matched: false, title, artist }, { status: 200 });
  } catch (error) {
    console.error("Artwork API error:", error);
    return NextResponse.json({ matched: false, error: "Resolution error" }, { status: 500 });
  }
}
