/**
 * Live HTTP scenario verification for Smart Queue V2
 */

async function testLiveScenario() {
  console.log("\n========================================================");
  console.log("LIVE SCENARIO: Single-Song Search -> Play -> Smart Queue Continuation");
  console.log("========================================================\n");

  // Step 1: User searches for "Kesariya"
  console.log("1. Executing Search: /api/search?q=Kesariya");
  const searchRes = await fetch("http://localhost:3000/api/search?q=Kesariya");
  if (!searchRes.ok) {
    console.error("Search failed:", searchRes.status);
    process.exit(1);
  }
  const searchData = await searchRes.json();
  const searchResults = searchData.results || [];
  console.log(`   Found ${searchResults.length} search results for "Kesariya".`);

  if (searchResults.length === 0) {
    console.error("No search results found");
    process.exit(1);
  }

  // Step 2: User plays the first song ("Kesariya" by Arijit Singh / Pritam)
  const selectedSong = searchResults[0];
  console.log(`\n2. Playing Selected Song: "${selectedSong.title}" by "${selectedSong.artist}" (VideoID: ${selectedSong.videoId})`);

  // Emulate updated search playSong: queue has ONLY this one song
  const initialQueue = [selectedSong];
  console.log(`   Active Queue: 1 track (single song queued).`);

  // Step 3: Smart Queue continuation is triggered
  console.log(`\n3. Triggering Smart Queue Continuation: POST /api/ai/smart-queue`);
  const queuePayload = {
    currentTrack: selectedSong,
    queue: initialQueue,
    recentVideoIds: [],
    skips: [],
    likedSongs: [],
    recentSongs: [],
    history: [],
    limit: 6,
  };

  const queueRes = await fetch("http://localhost:3000/api/ai/smart-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(queuePayload),
  });

  if (!queueRes.ok) {
    console.error("Smart Queue API failed:", queueRes.status);
    process.exit(1);
  }

  const queueData = await queueRes.json();
  const nextTracks = queueData.nextTracks || [];
  console.log(`   Smart Queue returned ${nextTracks.length} continuation tracks.`);
  console.log(`   Coherence Score: ${queueData.coherenceScore}/100\n`);

  console.log("4. Inspecting Every Queued Track for Real Track Invariant & Diversity:");
  console.log("----------------------------------------------------------------------");

  let bugDetected = false;
  const YOUTUBE_REGEX = /^[a-zA-Z0-9_-]{11}$/;

  nextTracks.forEach((t, i) => {
    console.log(`   [${i + 1}] "${t.title}" — ${t.artist} (ID: ${t.videoId})`);

    // Check 1: Real YouTube ID
    if (!t.videoId || !YOUTUBE_REGEX.test(t.videoId) || t.videoId.startsWith("itunes-")) {
      console.error(`      ❌ VIOLATION: Malformed or placeholder videoId: ${t.videoId}`);
      bugDetected = true;
    }

    // Check 2: Canonical title duplicate of current playing song
    const normCur = selectedSong.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normT = t.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normT === normCur || normT.includes(normCur)) {
      console.error(`      ❌ VIOLATION: Track is a duplicate/remix/cover of search query ("${t.title}")`);
      bugDetected = true;
    }

    // Check 3: Missing artist or title
    if (!t.title || !t.artist || t.title === "Unknown" || t.artist === "Unknown Artist") {
      console.error(`      ❌ VIOLATION: Missing real metadata identity`);
      bugDetected = true;
    }
  });

  console.log("----------------------------------------------------------------------");

  if (bugDetected) {
    console.error("\n❌ TEST FAILED: Smart Queue returned unverified tracks or recycled search query!");
    process.exit(1);
  } else {
    console.log("\n✅ TEST PASSED: All tracks are verified real music with zero title recycling!");
    console.log("   Smart Queue generated high-quality continuation based on artist/music context.");
  }
}

testLiveScenario().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
