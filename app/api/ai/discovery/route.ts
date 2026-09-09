import { NextRequest, NextResponse } from "next/server";
import { getDiscoveryFeed } from "@/lib/ai/discovery/discovery-engine";
import { DiscoveryFeedParams } from "@/lib/ai/discovery/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      page = "home",
      signals,
      userTaste,
      currentTrack,
      recentTracks,
      pageEntity,
      searchIntent,
      context,
      limit = 20,
      userId,
    } = body;

    let normalizedPage = page as DiscoveryFeedParams["currentPage"];
    if ((normalizedPage as string) === "explore") normalizedPage = "browse";
    if ((normalizedPage as string) === "genre") normalizedPage = "genres";
    if ((normalizedPage as string) === "mood") normalizedPage = "moods";

    let entity = pageEntity;
    if (!entity) {
      if (body.artist) {
        entity = { type: "artist", name: body.artist };
      } else if (body.albumId || body.albumTitle) {
        entity = { type: "album", id: body.albumId, name: body.albumTitle, artist: body.artist };
      } else if (body.seedTracks) {
        entity = { type: "playlist", tracks: body.seedTracks };
      } else if (body.genre) {
        entity = { type: "genre", name: body.genre };
      }
    }

    const params: DiscoveryFeedParams = {
      currentPage: normalizedPage,
      signals,
      userTaste,
      currentTrack,
      recentTracks,
      pageEntity: entity,
      searchIntent,
      context: context || (body.genre || body.mood ? { genre: body.genre, mood: body.mood } : undefined),
      limit,
      userId,
    };

    const feed = await getDiscoveryFeed(params);

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Discovery API POST error:", error);
    return NextResponse.json(
      {
        sections: [],
        tasteProfile: {
          topArtists: [],
          topGenres: [],
          topLanguages: [],
          preferredMoods: [],
          preferredEras: [],
          skippedTrackIds: [],
          completedTrackIds: [],
          replayTrackIds: [],
          totalInteractions: 0,
        },
        source: "heuristic_fallback",
        error: "Discovery feed generation failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let pageParam = searchParams.get("page") || "home";
    if (pageParam === "explore") pageParam = "browse";
    if (pageParam === "genre") pageParam = "genres";
    if (pageParam === "mood") pageParam = "moods";
    const page = pageParam as DiscoveryFeedParams["currentPage"];

    const entityName = searchParams.get("entityName") || searchParams.get("artist") || undefined;
    let entityType = (searchParams.get("entityType") || undefined) as
      | "artist"
      | "album"
      | "playlist"
      | "genre"
      | "mood"
      | undefined;
    if (!entityType && searchParams.get("artist")) entityType = "artist";

    const mood = searchParams.get("mood") || undefined;
    const genre = searchParams.get("genre") || undefined;

    const params: DiscoveryFeedParams = {
      currentPage: page,
      pageEntity: entityName ? { name: entityName, type: entityType } : undefined,
      context: { mood, genre },
    };

    const feed = await getDiscoveryFeed(params);

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Discovery API GET error:", error);
    return NextResponse.json(
      {
        sections: [],
        source: "heuristic_fallback",
        error: "Discovery feed generation failed",
      },
      { status: 500 }
    );
  }
}
