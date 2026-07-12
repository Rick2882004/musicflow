import { NextResponse } from "next/server";
import { computeHybridRecommendations } from "@/lib/recommendations-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateTracks, likedSongs, recentSongs, skipList, completionList } = body;

    const recommendations = computeHybridRecommendations(
      candidateTracks || [],
      likedSongs || [],
      recentSongs || [],
      skipList || [],
      completionList || []
    );

    return NextResponse.json({
      status: "success",
      results: recommendations.slice(0, 10),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to calculate recommendations",
      },
      { status: 400 }
    );
  }
}
