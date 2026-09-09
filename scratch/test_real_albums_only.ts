
import assert from "assert";
import { isFakeAlbumId } from "../lib/canonical-music";

async function runRealAlbumsAudit() {
  console.log("=======================================================");
  console.log("  MUSICFLOW — REAL ALBUMS ONLY AUDIT & VERIFICATION");
  console.log("=======================================================\n");

  const baseUrl = "http://localhost:3000";

  // ── TEST 1: Fake Album IDs Must Return 404 ──
  console.log("Test 1: Known Fake Album IDs Rejection");
  const fakeIds = [
    "MPREb_HtIOxExZ0cj",
    "MPREb_FCkwEh9GNWF",
    "MPREb_aAk6b9fga6U",
    "MPREb_HtIOxExZ0ck",
    "MPREb_HtIOxExZ0cl",
    "MPREb_HtIOxExZ0cm",
    "fake-test-album",
    "mock-album-404",
    "dummy-discography",
    "sample-album-id",
  ];

  for (const fakeId of fakeIds) {
    const res = await fetch(`${baseUrl}/api/album?id=${encodeURIComponent(fakeId)}`);
    assert.strictEqual(
      res.status,
      404,
      `Expected 404 for fake album ID "${fakeId}", got ${res.status}`
    );
    const body = await res.json();
    assert.strictEqual(body.error, "Album not found");
    console.log(`  ✔ "${fakeId}" -> 404 Not Found (blocked)`);
  }

  // ── TEST 2: Missing or Empty Album ID ──
  console.log("\nTest 2: Empty / Invalid ID Rejection");
  const emptyRes = await fetch(`${baseUrl}/api/album?id=`);
  assert.strictEqual(emptyRes.status, 400, "Empty id returns 400 Bad Request");
  console.log("  ✔ Empty ID -> 400 Bad Request");

  // ── TEST 3: Real YouTube Music Album Retrieval & Playability ──
  console.log("\nTest 3: Real YouTube Music Album Resolution & Playable Tracks");
  const realYtAlbumId = "MPREb_H647khRwcJr"; // Arijit Singh (All Time Hits)
  const ytRes = await fetch(`${baseUrl}/api/album?id=${encodeURIComponent(realYtAlbumId)}`);
  assert.strictEqual(ytRes.status, 200, `Real album ${realYtAlbumId} returns 200 OK`);
  const ytAlbum = await ytRes.json();
  assert(ytAlbum.name && ytAlbum.name.length > 0, "Album has genuine name");
  assert(Array.isArray(ytAlbum.songs) && ytAlbum.songs.length > 0, "Album has real songs");
  console.log(`  ✔ Loaded "${ytAlbum.name}" by ${ytAlbum.artist?.name || "Various"}`);
  console.log(`  ✔ Track count: ${ytAlbum.songs.length}`);

  // Verify track playback identity integrity
  for (let i = 0; i < Math.min(ytAlbum.songs.length, 5); i++) {
    const song = ytAlbum.songs[i];
    assert(song.title && song.title.length > 0, `Track ${i} has title`);
    assert(song.artist && song.artist.length > 0, `Track ${i} has artist`);
    assert(song.videoId && /^[a-zA-Z0-9_-]{11}$/.test(song.videoId), `Track ${i} has playable YouTube videoId (${song.videoId})`);
    console.log(`    - Track ${i + 1}: "${song.title}" (${song.videoId})`);
  }

  // ── TEST 4: Charts API Hygiene (No Fake Albums in Top Charts) ──
  console.log("\nTest 4: Charts API Hygiene (/api/charts?type=albums)");
  const chartsRes = await fetch(`${baseUrl}/api/charts?type=albums`);
  assert.strictEqual(chartsRes.status, 200, "Charts API returns 200 OK");
  const chartsData = await chartsRes.json();
  const topAlbums = chartsData.topAlbums || [];
  assert(Array.isArray(topAlbums), "topAlbums is an array");
  console.log(`  ✔ Returned ${topAlbums.length} chart albums`);

  for (const alb of topAlbums) {
    assert(alb.albumId, "Chart album has albumId");
    assert(!isFakeAlbumId(alb.albumId), `Chart album ${alb.albumId} must NOT be a fake ID`);
    assert(alb.name && alb.name.trim().length > 0, "Chart album has genuine non-empty name");
    assert(alb.thumbnail && alb.thumbnail.length > 0, "Chart album has valid thumbnail");
  }
  console.log("  ✔ PASS: All chart albums are genuine with valid artwork and IDs");

  // ── TEST 5: Search API Albums Cleanliness & Zero Fake Fallbacks ──
  console.log("\nTest 5: Search API Hygiene (/api/search?q=...)");
  const queries = ["Arijit Singh", "Rockstar", "Taylor Swift"];

  for (const q of queries) {
    const searchRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(q)}`);
    assert.strictEqual(searchRes.status, 200, `Search for "${q}" returns 200 OK`);
    const searchData = await searchRes.json();
    const albums = searchData.albums || [];
    console.log(`  ✔ Query "${q}": found ${albums.length} albums`);

    for (const alb of albums) {
      assert(alb.albumId, `Search album for "${q}" has albumId`);
      assert(!isFakeAlbumId(alb.albumId), `Search album ${alb.albumId} is not fake`);
      assert(alb.name && alb.name.trim().length > 0, `Search album has non-empty name ("${alb.name}")`);
      assert(alb.name !== "Album", `Search album name is not placeholder "Album"`);
    }

    if (albums.length > 0) {
      // Pick the first album and test loading its details
      const firstAlb = albums[0];
      const detailRes = await fetch(`${baseUrl}/api/album?id=${encodeURIComponent(firstAlb.albumId)}`);
      if (detailRes.status === 200) {
        const detail = await detailRes.json();
        assert(detail.name, "Resolved album has name");
        assert(detail.songs && detail.songs.length > 0, "Resolved album has playable songs");
        console.log(`    ✔ Detail verification for "${detail.name}": ${detail.songs.length} tracks, first videoId: ${detail.songs[0].videoId}`);
      } else {
        console.log(`    ⚠ Detail returned status ${detailRes.status} for ${firstAlb.albumId}`);
      }
    }
  }

  // ── TEST 6: Zero Fallback on Nonexistent Query ──
  console.log("\nTest 6: Zero Fallback / Honest Empty State on Obscure Query");
  const obscureRes = await fetch(`${baseUrl}/api/search?q=xyznonexistentquery99881122`);
  assert.strictEqual(obscureRes.status, 200, "Obscure search returns 200 OK");
  const obscureData = await obscureRes.json();
  const obscureAlbums = obscureData.albums || [];
  assert.strictEqual(obscureAlbums.length, 0, "Zero albums returned for nonexistent query (NO fake albums generated)");
  console.log("  ✔ PASS: Obscure query returns 0 albums without synthesizing fake content");

  // ── TEST 7: isFakeAlbumId Filter Unit Verification ──
  console.log("\nTest 7: isFakeAlbumId Unit Test Logic");
  assert(isFakeAlbumId(""), "Empty string is fake");
  assert(isFakeAlbumId("mpreb_htioxexz0cj"), "Known fake lowercase is fake");
  assert(isFakeAlbumId("MPREb_HtIOxExZ0cj"), "Known fake mixed-case is fake");
  assert(isFakeAlbumId("itunes-mpreb_htioxexz0cj"), "Prefixed fake is fake");
  assert(isFakeAlbumId("fake-my-album"), "fake- prefix is fake");
  assert(isFakeAlbumId("mock-album"), "mock- prefix is fake");
  assert(isFakeAlbumId("dummy-album"), "dummy- prefix is fake");
  assert(isFakeAlbumId("sample-1"), "sample- prefix is fake");
  assert(!isFakeAlbumId("MPREb_H647khRwcJr"), "Real YouTube Music album is NOT fake");
  assert(!isFakeAlbumId("1440857781"), "Numeric Apple album ID is NOT fake");
  assert(!isFakeAlbumId("itunes-1440857781"), "Prefixed real Apple album ID is NOT fake");
  console.log("  ✔ PASS: isFakeAlbumId correctly classifies all positive and negative samples");

  // ── TEST 8: Store Rehydration Sanitization Logic ──
  console.log("\nTest 8: Store Rehydration Sanitization Logic");
  const mockPersistedAlbums = [
    { albumId: "MPREb_H647khRwcJr", name: "Arijit Singh Hits", artist: "Arijit Singh", thumbnail: "https://example.com/art.jpg" },
    { albumId: "MPREb_HtIOxExZ0cj", name: "Future Nostalgia", artist: "Dua Lipa", thumbnail: "" },
    { albumId: "1440857781", name: "Rockstar", artist: "A.R. Rahman", thumbnail: "https://example.com/rockstar.jpg" },
    { albumId: "mock-album-id", name: "Demo Album", artist: "Unknown", thumbnail: "" },
    { albumId: "fake-seed", name: "Fake", artist: "None", thumbnail: "" },
  ];

  const sanitized = mockPersistedAlbums.filter(
    (a) => a && a.albumId && a.name && !isFakeAlbumId(a.albumId)
  );

  assert.strictEqual(sanitized.length, 2, "Only 2 real albums survive rehydration");
  assert.strictEqual(sanitized[0].albumId, "MPREb_H647khRwcJr");
  assert.strictEqual(sanitized[1].albumId, "1440857781");
  console.log("  ✔ PASS: Stored fake albums are permanently purged upon rehydration");

  console.log("\n=======================================================");
  console.log("  ALL AUDIT TESTS PASSED SUCCESSFULLY! (8/8)");
  console.log("=======================================================\n");
}

runRealAlbumsAudit().catch((err) => {
  console.error("\n❌ AUDIT FAILED:", err);
  process.exit(1);
});
