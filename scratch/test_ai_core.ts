/**
 * Verification test for MusicFlow V2 Phase 1: AI Music Core
 * Tests Search Intent Extraction, Taste Profiling, Recommendation Logic,
 * and Smart Queue Ranking & Coherence.
 */

import { LocalAIProvider } from "../lib/ai/providers/local";
import { buildUserTasteProfile } from "../lib/ai/profile/taste-profile-service";
import { Track, ListeningHistoryEntry, FollowedArtist } from "../types/music";
import { QueueRankingContext } from "../lib/ai/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail !== undefined) console.error("     Detail:", detail);
    failed++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("MUSICFLOW V2 PHASE 1 — AI CORE VERIFICATION");
  console.log("========================================================\n");

  const localAI = new LocalAIProvider();

  // ========================================================
  // 1. Natural Language Search Intent Parsing
  // ========================================================
  console.log("--- 1. Natural Language Search Intent Extraction ---");

  const query1 = await localAI.analyzeSearchIntent("sad Arijit songs");
  assert(
    Boolean(query1.artist?.toLowerCase().includes("arijit") && query1.mood === "sad"),
    "Query 'sad Arijit songs' extracted artist and mood",
    query1
  );

  const query2 = await localAI.analyzeSearchIntent("90s Bollywood romantic songs");
  assert(
    Boolean(query2.era === "90s" && query2.mood === "romantic" && query2.genre === "Bollywood"),
    "Query '90s Bollywood romantic songs' extracted era, mood, and genre",
    query2
  );

  const query3 = await localAI.analyzeSearchIntent("Bengali songs for late night driving");
  assert(
    Boolean(query3.language === "Bengali" && query3.activity === "late night drive"),
    "Query 'Bengali songs for late night driving' extracted language and activity",
    query3
  );

  const query4 = await localAI.analyzeSearchIntent("upbeat Punjabi workout music");
  assert(
    Boolean(query4.language === "Punjabi" && query4.activity === "workout" && (query4.mood === "upbeat" || query4.mood === "energetic")),
    "Query 'upbeat Punjabi workout music' extracted language, activity, and mood",
    query4
  );

  const query5 = await localAI.analyzeSearchIntent("Taylor Swift songs similar to Blank Space");
  assert(
    Boolean(query5.artist?.toLowerCase().includes("taylor swift") && query5.song?.toLowerCase().includes("blank space")),
    "Query 'Taylor Swift songs similar to Blank Space' extracted artist and song entity",
    query5
  );

  // ========================================================
  // 2. Taste Profile Aggregation
  // ========================================================
  console.log("\n--- 2. Taste Profile Aggregation ---");

  const mockLiked: Track[] = [
    { videoId: "v1", title: "Tum Hi Ho", artist: "Arijit Singh", thumbnail: "" },
    { videoId: "v2", title: "Channa Mereya", artist: "Arijit Singh", thumbnail: "" },
    { videoId: "v3", title: "Lover", artist: "Taylor Swift", thumbnail: "" },
  ];

  const mockFollowed: FollowedArtist[] = [
    { artistId: "art1", name: "Arijit Singh" },
    { artistId: "art2", name: "Diljit Dosanjh" },
  ];

  const mockHistory: ListeningHistoryEntry[] = [
    {
      id: "h1",
      track: { videoId: "v1", title: "Tum Hi Ho", artist: "Arijit Singh", thumbnail: "" },
      timestamp: Date.now() - 10000,
      playbackDuration: 240,
      completionPercentage: 95,
    },
    {
      id: "h2",
      track: { videoId: "v4", title: "No Skip Track", artist: "Diljit Dosanjh", thumbnail: "" },
      timestamp: Date.now() - 50000,
      playbackDuration: 180,
      completionPercentage: 88,
    },
  ];

  const mockSkips = ["v_bad_1", "v_bad_2"];

  const tasteProfile = buildUserTasteProfile({
    likedSongs: mockLiked,
    recentSongs: mockLiked,
    history: mockHistory,
    followedArtists: mockFollowed,
    skips: mockSkips,
  });

  assert(tasteProfile.topArtists[0].name === "Arijit Singh", "Arijit Singh is top artist by weight", tasteProfile.topArtists);
  assert(tasteProfile.topArtists.some((a) => a.name === "Diljit Dosanjh"), "Followed artist Diljit Dosanjh present in profile");
  assert(tasteProfile.skippedTrackIds.includes("v_bad_1"), "Skip list correctly mapped to skippedTrackIds");
  assert(tasteProfile.completedTrackIds.includes("v1"), "Completed track in history correctly mapped to completedTrackIds");

  // Cold Start Test
  const coldProfile = buildUserTasteProfile({
    likedSongs: [],
    recentSongs: [],
    history: [],
    followedArtists: [],
    skips: [],
  });
  const coldSeeds = await localAI.generateRecommendationKeywords(coldProfile, 4);
  assert(coldSeeds.length > 0, "Cold profile returns diverse fallback seed queries", coldSeeds);

  // ========================================================
  // 3. Recommendation Keyword Expansion & Explainability
  // ========================================================
  console.log("\n--- 3. Recommendation Keyword Expansion & Explainability ---");

  const recSeeds = await localAI.generateRecommendationKeywords(tasteProfile, 4);
  assert(recSeeds.length > 0, "Generated personalized recommendation seeds", recSeeds);
  assert(
    recSeeds.some((s) => s.reason.includes("Arijit Singh")),
    "Seed contains explainable reason linking to top artist affinity",
    recSeeds
  );

  // ========================================================
  // 4. Smart Queue Transition & Anti-Fatigue Throttling
  // ========================================================
  console.log("\n--- 4. Smart Queue Ranking & Anti-Fatigue Throttling ---");

  const currentTrack: Track = {
    videoId: "curr1",
    title: "Kesariya",
    artist: "Arijit Singh",
    thumbnail: "",
  };

  const queueCandidates: Track[] = [
    { videoId: "curr1", title: "Kesariya", artist: "Arijit Singh", thumbnail: "" }, // Exact duplicate -> must be stripped
    { videoId: "q1", title: "Tum Hi Ho", artist: "Arijit Singh", thumbnail: "" },
    { videoId: "q2", title: "Kabira", artist: "Arijit Singh", thumbnail: "" },
    { videoId: "q3", title: "Channa Mereya", artist: "Arijit Singh", thumbnail: "" },
    { videoId: "q4", title: "Raataan Lambiyan", artist: "Jubin Nautiyal", thumbnail: "" },
    { videoId: "q5", title: "Lover", artist: "Diljit Dosanjh", thumbnail: "" },
    { videoId: "v_bad_1", title: "Skipped Noise", artist: "Unknown", thumbnail: "" }, // On skip list
  ];

  const rankingContext: QueueRankingContext = {
    currentTrack,
    queue: [currentTrack],
    recentVideoIds: ["prev1", "prev2"],
    profile: tasteProfile,
    skips: ["v_bad_1"],
  };

  const rankedQueue = await localAI.rankQueueCandidates(queueCandidates, rankingContext);

  assert(
    !rankedQueue.some((t) => t.videoId === currentTrack.videoId),
    "Current playing track is never duplicated in ranked next tracks",
    rankedQueue.map((t) => t.title)
  );

  // Check anti-fatigue: artist should not appear > 2 consecutive times
  let consecutiveSameArtist = 0;
  let maxConsecutive = 0;
  let lastArtist = currentTrack.artist.toLowerCase();

  for (const track of rankedQueue) {
    if (track.artist.toLowerCase() === lastArtist) {
      consecutiveSameArtist++;
      if (consecutiveSameArtist > maxConsecutive) maxConsecutive = consecutiveSameArtist;
    } else {
      consecutiveSameArtist = 1;
      lastArtist = track.artist.toLowerCase();
    }
  }

  assert(
    maxConsecutive <= 2,
    `Anti-fatigue verified: max consecutive same artist in queue is ${maxConsecutive} (<= 2)`,
    rankedQueue.map((t) => `${t.title} (${t.artist})`)
  );

  // ========================================================
  // SUMMARY
  // ========================================================
  console.log("\n========================================================");
  console.log(`AI CORE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
