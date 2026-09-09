import { NextResponse } from "next/server";
import { generatePersonalizedRecommendations } from "@/lib/ai/recommendations/ai-recommendation-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      likedSongs = [],
      recentSongs = [],
      history = [],
      skips = [],
      followedArtists = [],
      playlists = [],
      limit = 20,
    } = body;

    const result = await generatePersonalizedRecommendations(
      {
        likedSongs,
        recentSongs,
        history,
        skips,
        followedArtists,
        playlists,
      },
      Number(limit) || 20
    );

    return NextResponse.json({
      status: "success",
      recommendations: result.recommendations,
      tasteProfile: result.tasteProfile,
    });
  } catch (error) {
    console.error("AI Recommendations API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate recommendations",
        recommendations: [],
      },
      { status: 500 }
    );
  }
}
