import { NextResponse } from "next/server";
import { generateSurpriseDiscovery } from "@/lib/ai/explore/explore-service";
import { buildUserTasteProfile } from "@/lib/ai/profile/taste-profile-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      likedSongs = [],
      recentTracks = [],
      skips = [],
      profile,
      limit = 20,
    } = body;

    const activeProfile =
      profile ||
      buildUserTasteProfile({
        likedSongs,
        recentSongs: recentTracks,
        history: [],
        skips,
      });

    const result = await generateSurpriseDiscovery({
      profile: activeProfile,
      likedSongs,
      recentTracks,
      skips,
      limit: Number(limit) || 20,
    });

    return NextResponse.json({
      status: "success",
      tracks: result.tracks,
      affinityCount: result.affinityCount,
      noveltyCount: result.noveltyCount,
      vibeSummary: result.vibeSummary,
    });
  } catch (error) {
    console.error("Surprise Discovery API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate surprise discovery",
        tracks: [],
      },
      { status: 500 }
    );
  }
}
