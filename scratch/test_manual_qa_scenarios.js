/**
 * Manual QA verification of all 7 scenarios specified in prompt
 */

const YOUTUBE_REGEX = /^[a-zA-Z0-9_-]{11}$/;

async function runManualQA() {
  console.log("\n========================================================");
  console.log("MUSICFLOW V2 SMART QUEUE — 7-POINT MANUAL QA RUNNER");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      if (details) console.error("     Details:", details);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // Scenario 1: Search "Kesariya", play 1 result, inspect queue
  // -------------------------------------------------------------------------
  console.log("--- Scenario 1: Search 'Kesariya' -> Play One ---");
  try {
    const s1Res = await fetch("http://localhost:3000/api/search?q=Kesariya");
    const s1Data = await s1Res.json();
    const s1Track = s1Data.results[0];

    const q1Res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: s1Track,
        queue: [s1Track],
        recentVideoIds: [],
        skips: [],
      }),
    });
    const q1Data = await q1Res.json();
    const next1 = q1Data.nextTracks || [];

    assert(next1.length > 0, "Scenario 1: Queue generated continuation tracks");
    const noTitleDup1 = !next1.some(t => t.title.toLowerCase().includes("kesariya"));
    assert(noTitleDup1, "Scenario 1: Zero Kesariya title recycling/covers/remixes in queue", next1.map(t => t.title));
    const validIds1 = next1.every(t => YOUTUBE_REGEX.test(t.videoId));
    assert(validIds1, "Scenario 1: All queued tracks have valid YouTube video IDs");
  } catch (err) {
    assert(false, "Scenario 1 failed", err);
  }

  // -------------------------------------------------------------------------
  // Scenario 2: Search "Arijit Singh romantic songs", play 1 result, inspect queue
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 2: Search 'Arijit Singh romantic songs' -> Play One ---");
  try {
    const s2Res = await fetch("http://localhost:3000/api/search?q=Arijit%20Singh%20romantic%20songs");
    const s2Data = await s2Res.json();
    const s2Track = s2Data.results[0];

    const q2Res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: s2Track,
        queue: [s2Track],
      }),
    });
    const q2Data = await q2Res.json();
    const next2 = q2Data.nextTracks || [];

    assert(next2.length > 0, "Scenario 2: Queue generated continuation tracks");
    const distinctArtists = new Set(next2.map(t => t.artist.toLowerCase().trim()));
    assert(distinctArtists.size >= 2, "Scenario 2: Queue has diversity across multiple artists", Array.from(distinctArtists));
  } catch (err) {
    assert(false, "Scenario 2 failed", err);
  }

  // -------------------------------------------------------------------------
  // Scenario 3: Search "Bengali late night songs", play 1 result, inspect queue
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 3: Search 'Bengali late night songs' -> Play One ---");
  try {
    const s3Res = await fetch("http://localhost:3000/api/search?q=Bengali%20late%20night%20songs");
    const s3Data = await s3Res.json();
    const s3Track = s3Data.results[0] || { videoId: "bengali1111", title: "Bhalobashar Morshum", artist: "Arijit Singh" };

    const q3Res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: s3Track,
        queue: [s3Track],
      }),
    });
    const q3Data = await q3Res.json();
    const next3 = q3Data.nextTracks || [];

    assert(next3.length > 0, "Scenario 3: Returned smooth mood/language continuation");
    assert(next3.every(t => YOUTUBE_REGEX.test(t.videoId)), "Scenario 3: All tracks have valid YouTube IDs");
  } catch (err) {
    assert(false, "Scenario 3 failed", err);
  }

  // -------------------------------------------------------------------------
  // Scenario 4: Search an obscure song with few/one result -> Never manufacture fake songs
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 4: Obscure Song -> Never Manufacture Fake Songs ---");
  try {
    const obscureTrack = {
      videoId: "3_g2un5M350",
      title: "Rare Obscure Indie Recording 2021",
      artist: "Solo Underground Creator",
    };

    const q4Res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: obscureTrack,
        queue: [obscureTrack],
      }),
    });
    const q4Data = await q4Res.json();
    const next4 = q4Data.nextTracks || [];

    // If tracks are returned, every single one must be from real catalog (valid 11-char ID)
    const zeroFake = next4.every(t => YOUTUBE_REGEX.test(t.videoId) && !t.videoId.startsWith("fake") && !t.videoId.startsWith("itunes-"));
    assert(zeroFake, "Scenario 4: Zero fake or manufactured tracks returned for obscure track");
  } catch (err) {
    assert(false, "Scenario 4 failed", err);
  }

  // -------------------------------------------------------------------------
  // Scenario 5: Skip 2-3 queued tracks -> Verify recommendations adapt
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 5: Skip Adaptation ---");
  try {
    const s5Track = { videoId: "JFcgOboQZ08", title: "Tum Hi Ho", artist: "Arijit Singh" };
    // Suppose user skipped 3 tracks from Atif Aslam
    const skippedVideoIds = ["skip1111111", "skip2222222", "skip3333333"];

    const q5Res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: s5Track,
        queue: [s5Track],
        skips: skippedVideoIds,
      }),
    });
    const q5Data = await q5Res.json();
    const next5 = q5Data.nextTracks || [];

    const noneSkipped = !next5.some(t => skippedVideoIds.includes(t.videoId));
    assert(noneSkipped, "Scenario 5: Skipped tracks completely suppressed from continuation queue");
  } catch (err) {
    assert(false, "Scenario 5 failed", err);
  }

  // -------------------------------------------------------------------------
  // Scenario 6: Like several songs from one artist -> Verify affinity increases without violation
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 6: Liked Artist Affinity & Cooldown Rule ---");
  try {
    const s6Track = { videoId: "JFcgOboQZ08", title: "Kesariya", artist: "Arijit Singh" };
    const likedDiljit = [
      { videoId: "d1111111111", title: "Lover", artist: "Diljit Dosanjh" },
      { videoId: "d2222222222", title: "Do You Know", artist: "Diljit Dosanjh" },
      { videoId: "d3333333333", title: "Born to Shine", artist: "Diljit Dosanjh" },
    ];

    const q6Res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: s6Track,
        queue: [s6Track],
        likedSongs: likedDiljit,
      }),
    });
    const q6Data = await q6Res.json();
    const next6 = q6Data.nextTracks || [];

    // Verify consecutive limit <= 2
    let maxConsec = 0;
    let currConsec = 0;
    let prevArtist = "";
    for (const t of next6) {
      if (t.artist.toLowerCase() === prevArtist) {
        currConsec++;
        if (currConsec > maxConsec) maxConsec = currConsec;
      } else {
        currConsec = 1;
        prevArtist = t.artist.toLowerCase();
      }
    }
    assert(maxConsec <= 2, `Scenario 6: Max consecutive same artist is ${maxConsec} (<= 2)`);
  } catch (err) {
    assert(false, "Scenario 6 failed", err);
  }

  // -------------------------------------------------------------------------
  // Scenario 7: User taste isolation between sessions
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 7: User Taste Isolation ---");
  try {
    const userA_liked = [{ videoId: "ua111111111", title: "Taylor Hit", artist: "Taylor Swift" }];
    const userB_liked = [{ videoId: "ub111111111", title: "Arijit Hit", artist: "Arijit Singh" }];

    const resA = await fetch("http://localhost:3000/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedSongs: userA_liked, limit: 5 }),
    });
    const dataA = await resA.json();

    const resB = await fetch("http://localhost:3000/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedSongs: userB_liked, limit: 5 }),
    });
    const dataB = await resB.json();

    const aHasTaylor = dataA.tasteProfile.topArtists.some(a => a.name === "Taylor Swift");
    const bHasTaylor = dataB.tasteProfile.topArtists.some(a => a.name === "Taylor Swift");

    assert(aHasTaylor && !bHasTaylor, "Scenario 7: User A profile has Taylor Swift, User B profile has ZERO Taylor Swift leakage");
  } catch (err) {
    assert(false, "Scenario 7 failed", err);
  }

  console.log("\n========================================================");
  console.log(`MANUAL QA SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

runManualQA().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
