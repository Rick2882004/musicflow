import { NextResponse } from "next/server";
import { getDJResponse } from "@/lib/ai-dj";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, favoriteArtist } = body;

    if (!prompt) {
      return NextResponse.json(
        { status: "error", message: "Prompt input is required" },
        { status: 400 }
      );
    }

    const djResponse = getDJResponse(prompt, favoriteArtist);

    return NextResponse.json({
      status: "success",
      results: djResponse,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate DJ response",
      },
      { status: 500 }
    );
  }
}
