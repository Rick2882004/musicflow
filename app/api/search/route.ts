import { NextRequest, NextResponse } from "next/server";
import { searchSongs, searchArtists, searchAlbums } from "@/lib/ytmusic";

function deduplicateArtists<T extends { artistId?: string; browseId?: string; name: string; thumbnail?: string }>(artists: T[]): T[] {
  const seenIds = new Set<string>();
  const seenFallbacks = new Set<string>();
  const result: T[] = [];

  for (const a of artists) {
    const id = a.browseId || a.artistId;
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.push(a);
    } else {
      const fallbackKey = `${a.name.trim().toLowerCase()}::${a.thumbnail || ""}`;
      if (seenFallbacks.has(fallbackKey)) continue;
      seenFallbacks.add(fallbackKey);
      result.push(a);
    }
  }
  return result;
}

function deduplicateAlbums<T extends { albumId?: string; browseId?: string; name: string; artist?: string }>(albums: T[]): T[] {
  const seenIds = new Set<string>();
  const seenFallbacks = new Set<string>();
  const result: T[] = [];

  for (const a of albums) {
    const id = a.albumId || a.browseId;
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.push(a);
    } else {
      const fallbackKey = `${a.name.trim().toLowerCase()}::${(a.artist || "").trim().toLowerCase()}`;
      if (seenFallbacks.has(fallbackKey)) continue;
      seenFallbacks.add(fallbackKey);
      result.push(a);
    }
  }
  return result;
}

function deduplicateSongs<T extends { videoId: string }>(songs: T[]): T[] {
  const seenIds = new Set<string>();
  const result: T[] = [];

  for (const s of songs) {
    if (s.videoId) {
      if (seenIds.has(s.videoId)) continue;
      seenIds.add(s.videoId);
      result.push(s);
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type");

  if (!query) {
    return NextResponse.json({
      results: [],
      songs: [],
      artists: [],
      albums: [],
    });
  }

  try {
    if (type === "artists") {
      const rawArtists = await searchArtists(query);
      const artists = deduplicateArtists(rawArtists);
      return NextResponse.json({ results: artists, artists });
    }

    if (type === "albums") {
      const rawAlbums = await searchAlbums(query);
      const albums = deduplicateAlbums(rawAlbums);
      return NextResponse.json({ results: albums, albums });
    }

    if (type === "songs") {
      const rawSongs = await searchSongs(query);
      const songs = deduplicateSongs(rawSongs);
      return NextResponse.json({ results: songs, songs });
    }

    // Default: comprehensive search (songs, artists, albums)
    const [songsRes, artistsRes, albumsRes] = await Promise.allSettled([
      searchSongs(query),
      searchArtists(query),
      searchAlbums(query),
    ]);

    const rawSongs = songsRes.status === "fulfilled" ? songsRes.value : [];
    const rawArtists = artistsRes.status === "fulfilled" ? artistsRes.value : [];
    const rawAlbums = albumsRes.status === "fulfilled" ? albumsRes.value : [];

    const songs = deduplicateSongs(rawSongs);
    const artists = deduplicateArtists(rawArtists);
    const albums = deduplicateAlbums(rawAlbums);

    return NextResponse.json({
      results: songs, // Backward compatibility
      songs,
      artists,
      albums,
    });
  } catch (error) {
    console.error("Search API Error:", error);

    return NextResponse.json(
      {
        error: "Search failed",
        results: [],
        songs: [],
        artists: [],
        albums: [],
      },
      {
        status: 500,
      }
    );
  }
}