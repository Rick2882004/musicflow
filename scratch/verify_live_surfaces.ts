import assert from "assert";

async function runLiveVerification() {
  console.log("=======================================================");
  console.log("  MUSICFLOW V2 — LIVE SURFACE API VERIFICATION");
  console.log("=======================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Home Page Discovery API
  console.log("Surface 1: Home Page Dynamic Feed");
  const homeRes = await fetch(`${baseUrl}/api/ai/discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "home",
      userId: "test-live-user",
      signals: {
        likedSongs: [
          { videoId: "FOA9iyxsW_A", title: "Agar Tum Saath Ho", artist: "Arijit Singh", thumbnail: "https://i.ytimg.com/vi/FOA9iyxsW_A/hqdefault.jpg" },
        ],
      },
    }),
  });
  assert.strictEqual(homeRes.status, 200, "Home discovery endpoint returns 200 OK");
  const homeData = await homeRes.json();
  assert(homeData.sections && homeData.sections.length >= 3, `Home returns multiple discovery sections (${homeData.sections.length})`);
  console.log("  ✔ Sections returned:", homeData.sections.map((s: any) => s.title));
  for (const s of homeData.sections) {
    assert(s.tracks.length > 0, `Section "${s.title}" contains playable tracks`);
    assert(s.tracks.every((t: any) => t.recommendationReason || s.title), `Tracks have contextual attribution`);
  }
  console.log("  ✔ PASS: Home Page Dynamic Discovery operational");

  // 2. Explore / Browse Discovery API
  console.log("\nSurface 2: Explore / Browse Dynamic Discovery");
  const exploreRes = await fetch(`${baseUrl}/api/ai/discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "explore",
      userId: "test-live-user",
    }),
  });
  assert.strictEqual(exploreRes.status, 200, "Explore discovery endpoint returns 200 OK");
  const exploreData = await exploreRes.json();
  assert(exploreData.sections && exploreData.sections.length >= 2, "Explore returns multiple discovery sections");
  console.log("  ✔ Explore Sections:", exploreData.sections.map((s: any) => s.title));
  console.log("  ✔ PASS: Explore Dynamic Discovery operational");

  // 3. Genre Page Discovery API
  console.log("\nSurface 3: Genre Dynamic Personalization");
  const genreRes = await fetch(`${baseUrl}/api/ai/discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "genre",
      genre: "Bollywood",
      userId: "test-live-user",
    }),
  });
  assert.strictEqual(genreRes.status, 200, "Genre discovery endpoint returns 200 OK");
  const genreData = await genreRes.json();
  assert(genreData.sections.length >= 2, "Genre returns personalized sub-sections");
  console.log("  ✔ Bollywood Genre Sections:", genreData.sections.map((s: any) => s.title));
  console.log("  ✔ PASS: Genre Discovery operational");

  // 4. Artist Page Discovery API
  console.log("\nSurface 4: Artist Page Discovery Rails");
  const artistRes = await fetch(`${baseUrl}/api/ai/discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "artist",
      artist: "Arijit Singh",
      userId: "test-live-user",
    }),
  });
  assert.strictEqual(artistRes.status, 200, "Artist discovery endpoint returns 200 OK");
  const artistData = await artistRes.json();
  console.log("  ✔ Artist Sections:", artistData.sections.map((s: any) => s.title));
  assert(artistData.sections.length >= 2, "Artist returns similar artists & deep cuts");
  console.log("  ✔ PASS: Artist Page Discovery operational");

  // 5. Album Page Discovery API
  console.log("\nSurface 5: Album Page Discovery Rails");
  const albumRes = await fetch(`${baseUrl}/api/ai/discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "album",
      artist: "Pritam",
      albumTitle: "Brahmastra",
      userId: "test-live-user",
    }),
  });
  assert.strictEqual(albumRes.status, 200, "Album discovery endpoint returns 200 OK");
  const albumData = await albumRes.json();
  console.log("  ✔ Album Sections:", albumData.sections.map((s: any) => s.title));
  assert(albumData.sections.length >= 1, "Album returns More Like This Album section");
  console.log("  ✔ PASS: Album Page Discovery operational");

  // 6. Playlist Page Continuation API
  console.log("\nSurface 6: Playlist Continuation API");
  const playlistRes = await fetch(`${baseUrl}/api/ai/discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "playlist",
      seedTracks: [
        { videoId: "FOA9iyxsW_A", title: "Agar Tum Saath Ho", artist: "Arijit Singh", thumbnail: "https://i.ytimg.com/vi/FOA9iyxsW_A/hqdefault.jpg" },
      ],
      userId: "test-live-user",
    }),
  });
  assert.strictEqual(playlistRes.status, 200, "Playlist discovery endpoint returns 200 OK");
  const playlistData = await playlistRes.json();
  console.log("  ✔ Playlist Continuation Sections:", playlistData.sections.map((s: any) => s.title));
  assert(playlistData.sections.length >= 1, "Playlist returns Continue This Playlist suggestions");
  console.log("  ✔ PASS: Playlist Continuation operational");

  // 7. Search API (Exact Priority + Discovery)
  console.log("\nSurface 7: Search Exact Priority + Discovery");
  const searchRes = await fetch(`${baseUrl}/api/ai/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Kesariya",
    }),
  });
  assert.strictEqual(searchRes.status, 200, "AI Search endpoint returns 200 OK");
  const searchData = await searchRes.json();
  assert(searchData.results && searchData.results.length > 0, "Search returns real tracks");
  const topTrack = searchData.results[0];
  console.log(`  ✔ Top hit: "${topTrack.title}" by ${topTrack.artist}`);
  assert(topTrack.title.toLowerCase().includes("kesariya"), "Exact title match is prioritized at index 0");
  console.log("  ✔ PASS: Search Exact Priority operational");

  console.log("\n=======================================================");
  console.log("  ALL 7 LIVE SURFACES VERIFIED SUCCESSFULLY ON PORT 3000");
  console.log("=======================================================");
}

runLiveVerification().catch((err) => {
  console.error("Live Verification Failed:", err);
  process.exit(1);
});
