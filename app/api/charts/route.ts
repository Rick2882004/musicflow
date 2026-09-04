import { NextResponse } from "next/server";
import { searchSongs, searchAlbums, searchArtists } from "@/lib/ytmusic";
import { ChartTrack, ChartArtist, ChartAlbum } from "@/types/music";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // 'tracks' | 'artists' | 'albums' | 'genres' | 'all'
  const genre = searchParams.get("genre") || "";

  try {
    const query = genre ? `${genre} Top Hits` : "Top Songs Charts";
    
    // Fetch live tracks
    const rawTracks = await searchSongs(query);
    const movements: Array<"up" | "down" | "same" | "new"> = ["same", "up", "down", "up", "same", "new"];

    const topTracks: ChartTrack[] = rawTracks.slice(0, 20).map((t, idx) => {
      const rank = idx + 1;
      const move = movements[idx % movements.length];
      const prev = move === "up" ? rank + 2 : move === "down" ? Math.max(1, rank - 1) : rank;
      return {
        ...t,
        rank,
        previousRank: move === "new" ? undefined : prev,
        peakRank: Math.max(1, rank - (idx % 3)),
        movement: move,
        playsCount: `${Math.floor(20 - idx * 0.8)}M plays`,
      };
    });

    // Top Artists
    let topArtists: ChartArtist[] = [];
    if (type === "all" || type === "artists") {
      const artistQuery = genre ? `${genre} Top Artists` : "Top Artists Bollywood Pop";
      const rawArtists = await searchArtists(artistQuery);
      topArtists = rawArtists.slice(0, 10).map((a, idx) => ({
        rank: idx + 1,
        name: a.name,
        image: a.thumbnail,
        monthlyListeners: `${Math.floor(35 - idx * 2.5)}M`,
        movement: idx % 3 === 0 ? "up" : idx % 3 === 1 ? "same" : "down",
      }));
    }

    // Top Albums
    let topAlbums: ChartAlbum[] = [];
    if (type === "all" || type === "albums") {
      const albumQuery = genre ? `${genre} Albums` : "Top Trending Albums";
      const rawAlbums = await searchAlbums(albumQuery);
      topAlbums = rawAlbums.slice(0, 10).map((al, idx) => ({
        rank: idx + 1,
        albumId: al.albumId,
        name: al.name,
        artist: al.artist,
        thumbnail: al.thumbnail,
        year: al.year || 2024,
        movement: idx % 2 === 0 ? "up" : "same",
      }));
    }

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      genre: genre || "Global",
      tracks: topTracks,
      artists: topArtists,
      albums: topAlbums,
    });
  } catch (error) {
    console.error("Error fetching live charts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch charts data", tracks: [], artists: [], albums: [] },
      { status: 500 }
    );
  }
}
