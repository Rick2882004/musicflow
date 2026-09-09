import { NextResponse } from "next/server";
import { computeAISmartQueue } from "@/lib/ai/queue/ai-smart-queue-service";
import { buildUserTasteProfile } from "@/lib/ai/profile/taste-profile-service";
import { Track } from "@/types/music";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      currentTrack,
      queue = [],
      recentVideoIds = [],
      profile,
      skips = [],
      likedSongs = [],
      recentSongs = [],
      history = [],
    } = body;

    if (!currentTrack || !currentTrack.videoId) {
      return NextResponse.json(
        { error: "currentTrack is required", nextTracks: [] },
        { status: 400 }
      );
    }

    // Build or use provided taste profile
    const activeProfile = profile || buildUserTasteProfile({
      likedSongs,
      recentSongs,
      history,
      skips,
    });

    const result = await computeAISmartQueue(
      currentTrack as Track,
      queue as Track[],
      recentVideoIds as string[],
      activeProfile,
      skips as string[]
    );

    return NextResponse.json({
      status: "success",
      nextTracks: result.nextTracks,
      coherenceScore: result.coherenceScore,
    });
  } catch (error) {
    console.error("AI Smart Queue API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to compute smart queue",
        nextTracks: [],
      },
      { status: 500 }
    );
  }
}
