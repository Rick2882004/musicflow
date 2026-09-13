import { NextResponse } from "next/server";
import { computeAIRadioQueue } from "@/lib/ai/radio/radio-engine";
import { buildUserTasteProfile } from "@/lib/ai/profile/taste-profile-service";
import { Track } from "@/types/music";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      seedTrack,
      currentTrack,
      queue = [],
      recentVideoIds = [],
      seenSessionTrackIds = [],
      skips = [],
      consecutiveSkips = 0,
      tracksAppendedCount = 0,
      profile,
      likedSongs = [],
      recentSongs = [],
      history = [],
      radioSessionId,
      limit = 6,
    } = body;

    const activeTrack = currentTrack || seedTrack;
    if (!activeTrack || !activeTrack.videoId) {
      return NextResponse.json(
        {
          status: "error",
          message: "A valid currentTrack or seedTrack is required for AI Radio",
          nextTracks: [],
          radioSessionId,
        },
        { status: 400 }
      );
    }

    // Build or use provided taste profile with lightweight windows
    const activeProfile = profile || buildUserTasteProfile({
      likedSongs: (likedSongs || []).slice(0, 50),
      recentSongs: (recentSongs || []).slice(0, 20),
      history: (history || []).slice(0, 30),
      skips: (skips || []).slice(0, 20),
    });

    const result = await computeAIRadioQueue({
      seedTrack: (seedTrack || activeTrack) as Track,
      currentTrack: activeTrack as Track,
      queue: queue as Track[],
      recentVideoIds: (recentVideoIds || []).slice(0, 20) as string[],
      seenSessionTrackIds: (seenSessionTrackIds || []).slice(-50) as string[],
      skips: (skips || []).slice(0, 20) as string[],
      consecutiveSkips: Number(consecutiveSkips) || 0,
      tracksAppendedCount: Number(tracksAppendedCount) || 0,
      tasteProfile: activeProfile,
      limit: Math.min(Number(limit) || 6, 10),
    });

    return NextResponse.json({
      status: "success",
      radioSessionId,
      nextTracks: result.nextTracks,
      coherenceScore: result.coherenceScore,
      noveltyRatio: result.noveltyRatio,
    });
  } catch (error) {
    console.error("AI Radio API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to compute AI Radio continuation",
        nextTracks: [],
      },
      { status: 500 }
    );
  }
}
