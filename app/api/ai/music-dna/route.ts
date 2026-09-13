import { NextResponse } from "next/server";
import { computeMusicDNA } from "@/lib/music-dna/music-dna-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { likedSongs, history, recentSongs, skips, followedArtists } = body;

    const dna = computeMusicDNA({
      likedSongs: likedSongs || [],
      history: history || [],
      recentSongs: recentSongs || [],
      skips: skips || [],
      followedArtists: followedArtists || [],
    });

    return NextResponse.json({
      status: "success",
      dna,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to compute Music DNA",
      },
      { status: 500 }
    );
  }
}
