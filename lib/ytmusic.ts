import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();
let initialized = false;

export async function initializeYTMusic() {
  if (!initialized) {
    await ytmusic.initialize();
    initialized = true;
  }
}

export async function searchSongs(query: string) {
  await initializeYTMusic();
  const results = await ytmusic.searchSongs(query);

  return results.map((song: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    videoId: song.videoId,
    title: song.name || song.title || "Unknown",
    artist: song.artist?.name || song.artist || "Unknown Artist",
    duration: song.duration || song.duration_seconds || 0,
    album: song.album?.name || (typeof song.album === "string" ? song.album : "") || "",
    thumbnail:
      song.thumbnails?.[song.thumbnails.length - 1]?.url ||
      "",
  }));
}

export async function searchArtists(query: string) {
  await initializeYTMusic();
  const results = await ytmusic.searchArtists(query);
  return results.map((artist: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    artistId: artist.artistId || artist.browseId || "",
    browseId: artist.artistId || artist.browseId || "",
    name: artist.name,
    thumbnail:
      artist.thumbnails?.[artist.thumbnails.length - 1]?.url ||
      "",
  }));
}

export async function searchAlbums(query: string) {
  await initializeYTMusic();
  const results = await ytmusic.searchAlbums(query);
  return results.map((album: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    albumId: album.albumId || album.browseId || "",
    browseId: album.albumId || album.browseId || "",
    playlistId: album.playlistId || "",
    name: album.name,
    artist: album.artist?.name || album.artist || "Unknown Artist",
    year: album.year || null,
    thumbnail:
      album.thumbnails?.[album.thumbnails.length - 1]?.url ||
      "",
  }));
}

export async function getArtistDetails(artistId: string) {
  await initializeYTMusic();
  const artist = await ytmusic.getArtist(artistId) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  
  const rawSongs = (artist.songs || []).map((song: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    videoId: song.videoId,
    title: song.name || song.title || "Unknown",
    artist: artist.name,
    duration: song.duration || 0,
    thumbnail:
      song.thumbnails?.[song.thumbnails.length - 1]?.url ||
      "",
  }));
  const seenSongIds = new Set<string>();
  const songs = rawSongs.filter((s: { videoId: string }) => {
    if (!s.videoId || seenSongIds.has(s.videoId)) return false;
    seenSongIds.add(s.videoId);
    return true;
  });

  const rawAlbums = (artist.albums || []).map((album: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    albumId: album.albumId || album.browseId || "",
    playlistId: album.playlistId || "",
    name: album.name,
    year: album.year || null,
    thumbnail:
      album.thumbnails?.[album.thumbnails.length - 1]?.url ||
      "",
  }));
  const seenAlbumIds = new Set<string>();
  const albums = rawAlbums.filter((a: { albumId: string }) => {
    if (!a.albumId || seenAlbumIds.has(a.albumId)) return false;
    seenAlbumIds.add(a.albumId);
    return true;
  });

  const rawSingles = (artist.singles || []).map((single: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    albumId: single.albumId || single.browseId || "",
    playlistId: single.playlistId || "",
    name: single.name,
    year: single.year || null,
    thumbnail:
      single.thumbnails?.[single.thumbnails.length - 1]?.url ||
      "",
  }));
  const seenSingleIds = new Set<string>();
  const singles = rawSingles.filter((s: { albumId: string }) => {
    if (!s.albumId || seenSingleIds.has(s.albumId)) return false;
    seenSingleIds.add(s.albumId);
    return true;
  });

  const rawSimilar = (artist.similarArtists || []).map((sim: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    artistId: sim.artistId || sim.browseId || "",
    name: sim.name,
    thumbnails: sim.thumbnails || [],
  }));
  const seenSimIds = new Set<string>();
  const similarArtists = rawSimilar.filter((sim: { artistId: string }) => {
    if (!sim.artistId || seenSimIds.has(sim.artistId)) return false;
    seenSimIds.add(sim.artistId);
    return true;
  });

  return {
    artistId: artist.artistId || artist.browseId || artistId,
    name: artist.name,
    description: artist.description || "",
    thumbnails: artist.thumbnails || [],
    songs,
    albums,
    singles,
    similarArtists,
  };
}

export async function getAlbumDetails(albumId: string) {
  await initializeYTMusic();
  const album = await ytmusic.getAlbum(albumId) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  
  const rawSongs = (album.songs || []).map((song: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    videoId: song.videoId,
    title: song.name || song.title || "Unknown",
    artist: song.artist?.name || album.artist?.name || "Unknown Artist",
    duration: song.duration || 0,
    thumbnail:
      song.thumbnails?.[song.thumbnails.length - 1]?.url ||
      album.thumbnails?.[album.thumbnails.length - 1]?.url ||
      "",
  }));
  const seenSongIds = new Set<string>();
  const songs = rawSongs.filter((s: { videoId: string }) => {
    if (!s.videoId) return true;
    if (seenSongIds.has(s.videoId)) return false;
    seenSongIds.add(s.videoId);
    return true;
  });

  return {
    albumId: album.albumId || album.browseId || albumId,
    name: album.name,
    playlistId: album.playlistId || "",
    artist: {
      name: album.artist?.name || album.artist || "Unknown Artist",
      artistId: album.artist?.artistId || null,
    },
    year: album.year || null,
    thumbnails: album.thumbnails || [],
    songs,
  };
}

export async function getSuggestions(query: string) {
  await initializeYTMusic();
  const suggestions = await ytmusic.getSearchSuggestions(query);
  return suggestions;
}

export async function getLyrics(videoId: string) {
  await initializeYTMusic();
  try {
    const lyrics = await ytmusic.getLyrics(videoId);
    return lyrics;
  } catch (error) {
    console.error("Error fetching lyrics for video:", videoId, error);
    return null;
  }
}