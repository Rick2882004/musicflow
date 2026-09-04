import { NextRequest, NextResponse } from "next/server";
import { getCanonicalAlbumDetails } from "@/lib/canonical-music";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing album ID" }, { status: 400 });
  }

  try {
    const details = await getCanonicalAlbumDetails(id);
    if (!details) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error) {
    console.error("Album API error:", error);
    return NextResponse.json({ error: "Failed to fetch album details" }, { status: 500 });
  }
}
