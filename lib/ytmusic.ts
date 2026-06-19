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

  console.log("FIRST RESULT:");
console.log(results[0]);

return results.map((song: any) => ({
  title: song.name,
  artist: song.artist?.name,
  videoId: song.videoId,
  thumbnail:
    song.thumbnails?.[0]?.url ||
    song.thumbnail?.[0]?.url ||
    null,
}));
}