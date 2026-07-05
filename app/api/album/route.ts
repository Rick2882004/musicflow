import { NextRequest, NextResponse } from "next/server";
import { getAlbumDetails } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing album ID" }, { status: 400 });
  }

  try {
    const details = await getAlbumDetails(id);
    return NextResponse.json(details);
  } catch (error) {
    console.error("Album API error:", error);
    return NextResponse.json({ error: "Failed to fetch album details" }, { status: 500 });
  }
}
