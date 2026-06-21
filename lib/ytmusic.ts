import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();

let initialized = false;

export async function initializeYTMusic() {
  if (!initialized) {
    await ytmusic.initialize();
    initialized = true;
    console.log("YTMusic initialized");
  }
}

export async function searchSongs(query: string) {
  await initializeYTMusic();

  const results = await ytmusic.searchSongs(query);

  return results.map((song: any) => ({
    videoId: song.videoId,
    title: song.name || song.title || "Unknown",
    artist:
      song.artist?.name ||
      song.artist ||
      "Unknown Artist",
    duration:
      song.duration ||
      song.duration_seconds ||
      0,
    thumbnail:
      song.thumbnails?.[
        song.thumbnails.length - 1
      ]?.url ||
      "",
  }));
}