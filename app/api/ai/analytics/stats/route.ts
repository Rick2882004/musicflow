import { NextResponse } from "next/server";
import { calculateAdvancedListeningStats, StatsTimeRange } from "@/lib/analytics/listening-stats-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { history, likedSongs, sessions, range, skips } = body;

    const stats = calculateAdvancedListeningStats(
      history || [],
      likedSongs || [],
      sessions || [],
      (range as StatsTimeRange) || "all_time",
      skips || []
    );

    return NextResponse.json({
      status: "success",
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to calculate listening stats",
      },
      { status: 500 }
    );
  }
}
