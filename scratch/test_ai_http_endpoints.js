/**
 * Live HTTP verification test for MusicFlow V2 Phase 1 AI Endpoints
 */

async function runLiveHttpTests() {
  console.log("\n========================================================");
  console.log("MUSICFLOW V2 LIVE HTTP ENDPOINT VERIFICATION");
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

  // 1. AI Search Endpoint
  console.log("--- Testing /api/ai/search ---");
  try {
    const res = await fetch("http://localhost:3000/api/ai/search?q=sad%20Arijit%20songs");
    assert(res.status === 200, "AI Search responds with 200 OK");
    const data = await res.json();
    assert(data.intent && data.intent.artist.includes("Arijit"), "Intent extracted artist 'Arijit Singh'", data.intent);
    assert(data.intent && data.intent.mood === "sad", "Intent extracted mood 'sad'", data.intent);
    assert(data.results && data.results.length > 0, "Catalog returned real tracks for intent", `Count: ${data.results?.length}`);
    assert(data.results[0].videoId && !data.results[0].videoId.startsWith("fake"), "Tracks contain verified catalog videoIds", data.results[0]);
  } catch (err) {
    assert(false, "AI Search failed", err);
  }

  // 2. AI Recommendations Endpoint
  console.log("\n--- Testing /api/ai/recommendations ---");
  try {
    const recPayload = {
      likedSongs: [
        { videoId: "JFcgOboQZ08", title: "Tum Hi Ho", artist: "Arijit Singh" },
      ],
      recentSongs: [
        { videoId: "JFcgOboQZ08", title: "Tum Hi Ho", artist: "Arijit Singh" },
      ],
      history: [
        {
          id: "h1",
          track: { videoId: "JFcgOboQZ08", title: "Tum Hi Ho", artist: "Arijit Singh" },
          timestamp: Date.now(),
          playbackDuration: 210,
          completionPercentage: 90,
        },
      ],
      followedArtists: [{ artistId: "art1", name: "Arijit Singh" }],
      skips: ["bad_id_1"],
      limit: 6,
    };

    const res = await fetch("http://localhost:3000/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recPayload),
    });

    assert(res.status === 200, "AI Recommendations responds with 200 OK");
    const data = await res.json();
    assert(data.recommendations && data.recommendations.length > 0, "Returned scored recommendations", `Count: ${data.recommendations?.length}`);
    assert(data.tasteProfile && data.tasteProfile.topArtists[0].name === "Arijit Singh", "Returned tasteProfile with top artist", data.tasteProfile?.topArtists);
    const hasReason = data.recommendations.some((r) => Boolean(r.recommendationReason));
    assert(hasReason, "Recommendations include explainability badge", data.recommendations[0]?.recommendationReason);
  } catch (err) {
    assert(false, "AI Recommendations failed", err);
  }

  // 3. AI Smart Queue Endpoint
  console.log("\n--- Testing /api/ai/smart-queue ---");
  try {
    const queuePayload = {
      currentTrack: {
        videoId: "JFcgOboQZ08",
        title: "Tum Hi Ho",
        artist: "Arijit Singh",
      },
      queue: [
        { videoId: "JFcgOboQZ08", title: "Tum Hi Ho", artist: "Arijit Singh" },
      ],
      recentVideoIds: [],
      skips: [],
      limit: 5,
    };

    const res = await fetch("http://localhost:3000/api/ai/smart-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queuePayload),
    });

    assert(res.status === 200, "AI Smart Queue responds with 200 OK");
    const data = await res.json();
    assert(data.nextTracks && data.nextTracks.length > 0, "Smart Queue returned ranked continuation tracks", `Count: ${data.nextTracks?.length}`);
    assert(typeof data.coherenceScore === "number" && data.coherenceScore > 50, `Coherence score computed: ${data.coherenceScore}`);
    assert(!data.nextTracks.some((t) => t.videoId === "JFcgOboQZ08"), "Current playing track is not duplicated in nextTracks");
  } catch (err) {
    assert(false, "AI Smart Queue failed", err);
  }

  console.log("\n========================================================");
  console.log(`LIVE HTTP ENDPOINT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

runLiveHttpTests().catch((err) => {
  console.error("HTTP test error:", err);
  process.exit(1);
});
