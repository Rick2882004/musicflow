import { NextResponse } from "next/server";
import { generatePlaylistFromPrompt } from "@/lib/ai/playlist/playlist-generator";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, durationMinutes } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A valid prompt is required", playlist: null },
        { status: 400 }
      );
    }

    const playlist = await generatePlaylistFromPrompt(
      prompt.trim(),
      durationMinutes ? Number(durationMinutes) : undefined
    );

    return NextResponse.json({
      status: "success",
      playlist,
    });
  } catch (error) {
    console.error("AI Playlist Generator API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate playlist",
        playlist: null,
      },
      { status: 500 }
    );
  }
}
