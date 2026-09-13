import { NextResponse } from "next/server";
import {
  getMoreLikeThis,
  getContinueVibe,
  getDiscoveryMore,
} from "@/lib/ai/queue/ai-smart-queue-service";
import { buildUserTasteProfile } from "@/lib/ai/profile/taste-profile-service";
import { Track } from "@/types/music";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action,
      track,
      currentTrack,
      recentTracks = [],
      avoidArtists = [],
      profile,
      likedSongs = [],
      recentSongs = [],
      history = [],
      skips = [],
      limit = 5,
    } = body;

    const activeProfile =
      profile ||
      buildUserTasteProfile({
        likedSongs,
        recentSongs,
        history,
        skips,
      });

    if (action === "more-like-this") {
      const target = track || currentTrack;
      if (!target || !target.title) {
        return NextResponse.json(
          { error: "Target track is required for more-like-this", tracks: [] },
          { status: 400 }
        );
      }
      const tracks = await getMoreLikeThis(target as Track, limit, avoidArtists);
      return NextResponse.json({ status: "success", action, tracks });
    }

    if (action === "continue-vibe") {
      const target = currentTrack || track;
      if (!target || !target.title) {
        return NextResponse.json(
          { error: "currentTrack is required for continue-vibe", tracks: [] },
          { status: 400 }
        );
      }
      const tracks = await getContinueVibe(target as Track, recentTracks as Track[], avoidArtists);
      return NextResponse.json({ status: "success", action, tracks });
    }

    if (action === "discover-more") {
      const target = currentTrack || track || { videoId: "", title: "", artist: "" };
      const tracks = await getDiscoveryMore(target as Track, activeProfile, avoidArtists);
      return NextResponse.json({ status: "success", action, tracks });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}`, tracks: [] },
      { status: 400 }
    );
  } catch (error) {
    console.error("Queue action error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Queue action failed",
        tracks: [],
      },
      { status: 500 }
    );
  }
}
