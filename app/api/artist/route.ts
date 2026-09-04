import { NextRequest, NextResponse } from "next/server";
import { getCanonicalArtistDetails } from "@/lib/canonical-music";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const id = request.nextUrl.searchParams.get("id");

  if (!id && !name) {
    return NextResponse.json({ error: "Missing artist name or ID" }, { status: 400 });
  }

  try {
    const details = await getCanonicalArtistDetails({
      artistId: id || undefined,
      name: name || undefined,
    });

    if (!details) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error("Artist API error:", error);
    return NextResponse.json({ error: "Failed to fetch artist details" }, { status: 500 });
  }
}
