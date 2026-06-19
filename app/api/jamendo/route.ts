import { NextResponse } from "next/server";
import { fetchJamendoTracks } from "@/lib/jamendo";

export async function GET() {
  try {
    const tracks = await fetchJamendoTracks(10);

    return NextResponse.json(tracks);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}