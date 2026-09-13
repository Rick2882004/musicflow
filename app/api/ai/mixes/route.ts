import { NextResponse } from "next/server";
import { getAllSmartMixes, generateSmartMix, SmartMixId } from "@/lib/ai/mixes/smart-mixes-service";
import { buildUserTasteProfile } from "@/lib/ai/profile/taste-profile-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      mixId,
      likedSongs = [],
      recentSongs = [],
      history = [],
      skips = [],
      profile,
      forceRefresh = false,
    } = body;

    const activeProfile =
      profile ||
      buildUserTasteProfile({
        likedSongs,
        recentSongs,
        history,
        skips,
      });

    if (mixId) {
      const mix = await generateSmartMix(
        mixId as SmartMixId,
        activeProfile,
        likedSongs,
        history,
        skips,
        forceRefresh
      );
      return NextResponse.json({ status: "success", mix });
    }

    const mixes = await getAllSmartMixes(
      activeProfile,
      likedSongs,
      history,
      skips,
      forceRefresh
    );

    return NextResponse.json({ status: "success", mixes });
  } catch (error) {
    console.error("Smart Mixes API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load mixes",
        mixes: [],
      },
      { status: 500 }
    );
  }
}
