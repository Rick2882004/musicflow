import { NextResponse } from "next/server";
import { calculateListeningStats } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recentSongs, likedSongs } = body;

    const stats = calculateListeningStats(
      recentSongs || [],
      likedSongs || []
    );

    return NextResponse.json({
      status: "success",
      results: stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to calculate analytics",
      },
      { status: 400 }
    );
  }
}
