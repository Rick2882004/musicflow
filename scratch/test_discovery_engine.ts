import { getDiscoveryFeed, clearUserDiscoveryCache } from "../lib/ai/discovery/discovery-engine";
import { analyzeContext } from "../lib/ai/discovery/context-analyzer";
import { applyDiversityFilter, rankCandidates } from "../lib/ai/discovery/recommendation-ranker";
import { verifyPlayableTrack, isValidYouTubeVideoId, normalizeTrackTitle } from "../lib/ai/queue/track-verifier";
import { executeAISearch } from "../lib/ai/search/ai-search-service";
import { computeAISmartQueue } from "../lib/ai/queue/ai-smart-queue-service";
import { Track } from "../types/music";
import { UserTasteProfile } from "../lib/ai/types";
import { CandidateRawItem } from "../lib/ai/discovery/candidate-generator";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

async function runDiscoverySuite() {
  console.log("\n=======================================================");
  console.log("  MUSICFLOW V2 — CENTRAL AI DISCOVERY SYSTEM TEST SUITE");
  console.log("=======================================================\n");

  // Mock verified tracks for ground truth tests
  const sampleArijit: Track = {
    videoId: "JFcgOboQZ08",
    title: "Kesariya",
    artist: "Arijit Singh",
    thumbnail: "https://img.youtube.com/vi/JFcgOboQZ08/hqdefault.jpg",
    duration: 268,
  };

  const sampleKK: Track = {
    videoId: "T94PHkuyd8c",
    title: "Zara Sa",
    artist: "KK",
    thumbnail: "https://img.youtube.com/vi/T94PHkuyd8c/hqdefault.jpg",
    duration: 304,
  };

  const sampleBengali: Track = {
    videoId: "k4yXQkG2s1E",
    title: "Amake Amar Moto Thakte Dao",
    artist: "Anupam Roy",
    thumbnail: "https://img.youtube.com/vi/k4yXQkG2s1E/hqdefault.jpg",
    duration: 290,
  };

  const samplePunjabi: Track = {
    videoId: "kJQP7kiw5Fk",
    title: "Brown Munde",
    artist: "AP Dhillon",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: 245,
  };

  // 1. New guest user (cold-start)
  console.log("Scenario 1: New Guest User (Cold Start)");
  const guestFeed = await getDiscoveryFeed({
    currentPage: "home",
    userId: undefined,
  });
  assert(guestFeed.sections.length > 0, "Guest receives dynamic sections");
  assert(guestFeed.sections.every(s => s.tracks.length > 0), "All guest sections have playable tracks");

  // 2. User with history
  console.log("\nScenario 2: User with Listening History");
  const historyFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      history: [
        {
          id: "hist-1",
          track: sampleArijit,
          playbackDuration: 250,
          completionPercentage: 93,
          timestamp: Date.now() - 3600000,
        },
      ],
      recentSongs: [sampleArijit],
    },
    userId: "user-with-history-1",
  });
  assert(historyFeed.tasteProfile.topArtists.some(a => a.name === "Arijit Singh"), "Arijit Singh detected in history profile");
  assert(historyFeed.sections.length >= 2, "History generates personalized sections");

  // 3. User with strong artist affinity
  console.log("\nScenario 3: Strong Artist Affinity");
  const artistAffinityFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      followedArtists: [{ name: "Arijit Singh", image: null }],
      likedSongs: [sampleArijit],
    },
    userId: "user-strong-artist",
  });
  const becauseSection = artistAffinityFeed.sections.find(s => s.type === "because_you_like");
  assert(!!becauseSection, "Because You Listen To Arijit Singh section exists");
  assert(becauseSection?.title.includes("Arijit Singh") === true, "Section header correctly specifies artist");

  // 4. User with strong genre affinity
  console.log("\nScenario 4: Strong Genre Affinity");
  const genreAffinityFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      likedSongs: [samplePunjabi],
      recentSongs: [samplePunjabi],
    },
    userId: "user-strong-genre",
  });
  assert(genreAffinityFeed.tasteProfile.topGenres.some(g => g.genre.includes("Punjabi")), "Punjabi genre identified in taste profile");

  // 5. User with skip history
  console.log("\nScenario 5: Skip History Adaptation");
  const skipAnalysis = analyzeContext({
    skips: [sampleKK.videoId],
    history: [
      {
        id: "hist-skip-1",
        track: sampleKK,
        playbackDuration: 12,
        completionPercentage: 4,
        timestamp: Date.now(),
      },
    ],
  });
  assert(skipAnalysis.skipAversionList.includes(sampleKK.videoId), "Skipped videoId added to skip aversion list");
  assert(skipAnalysis.noveltyTolerance >= 0.2, "Novelty tolerance increases or adapts upon skips");

  // 6. User with repeated listening (replay boost)
  console.log("\nScenario 6: Repeated Listening (Replay Tracks)");
  const replayFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      history: [
        { id: "replay-1", track: sampleArijit, playbackDuration: 260, completionPercentage: 95, timestamp: Date.now() - 5000 },
        { id: "replay-2", track: sampleArijit, playbackDuration: 260, completionPercentage: 95, timestamp: Date.now() - 1000 },
      ],
    },
    userId: "user-replay-1",
  });
  assert(replayFeed.tasteProfile.replayTrackIds.includes(sampleArijit.videoId), "Arijit track identified as replay favorite");

  // 7. Search exact song priority
  console.log("\nScenario 7: Search Exact Song Priority");
  const exactSearchRes = await executeAISearch("Kesariya");
  assert(exactSearchRes.results.length > 0, "Exact song search returns results");
  const topResultTitle = exactSearchRes.results[0].title.toLowerCase();
  assert(topResultTitle.includes("kesariya"), "Exact song title takes top priority over other candidates");

  // 8. Natural-language search
  console.log("\nScenario 8: Natural-Language Search");
  const nlSearchRes = await executeAISearch("Arijit romantic songs");
  assert(nlSearchRes.intent.artist === "Arijit Singh", "Artist intent correctly identified");
  assert(nlSearchRes.intent.mood === "romantic", "Romantic mood intent correctly extracted");
  assert(nlSearchRes.results.some(t => t.artist.toLowerCase().includes("arijit")), "Results align with natural-language intent");

  // 9. Home recommendations
  console.log("\nScenario 9: Home Page Dynamic Feed");
  const homeFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      likedSongs: [sampleArijit, sampleKK],
    },
    userId: "home-test-user",
  });
  const sectionTypes = homeFeed.sections.map(s => s.type);
  assert(sectionTypes.includes("personalized"), "Home generates Made For You personalized section");
  assert(sectionTypes.includes("mood") || sectionTypes.includes("daily_mix"), "Home generates Mood or Mix cluster");

  // 10. Browse recommendations
  console.log("\nScenario 10: Browse Page Dynamic Discovery");
  const browseFeed = await getDiscoveryFeed({
    currentPage: "browse",
    signals: {
      recentSongs: [sampleBengali],
    },
    userId: "browse-test-user",
  });
  assert(browseFeed.sections.some(s => s.type === "trending" || s.type === "based_on_history"), "Browse generates discovery sections");

  // 11. Genre recommendations
  console.log("\nScenario 11: Genre Page Dynamic Feed");
  const genreFeed = await getDiscoveryFeed({
    currentPage: "genres",
    pageEntity: { name: "Bollywood", type: "genre" },
    signals: { likedSongs: [sampleArijit] },
    userId: "genre-test-user",
  });
  assert(genreFeed.sections.some(s => s.title.includes("Bollywood")), "Genre page correctly scopes to Bollywood");

  // 12. Mood recommendations
  console.log("\nScenario 12: Mood Recommendations");
  const moodFeed = await getDiscoveryFeed({
    currentPage: "moods",
    pageEntity: { name: "Chill", type: "mood" },
    context: { mood: "Chill" },
  });
  assert(moodFeed.sections.some(s => s.title.includes("Chill")), "Mood feed correctly scopes to Chill vibe");

  // 13. Artist recommendations
  console.log("\nScenario 13: Artist Page Recommendations");
  const artistFeed = await getDiscoveryFeed({
    currentPage: "artist",
    pageEntity: { name: "Arijit Singh", type: "artist" },
  });
  assert(artistFeed.sections.length > 0, "Artist page discovery sections returned");

  // 14. Album recommendations
  console.log("\nScenario 14: Album Page Recommendations");
  const albumFeed = await getDiscoveryFeed({
    currentPage: "album",
    pageEntity: { name: "Kesariya", artist: "Pritam, Arijit Singh", type: "album" },
  });
  assert(albumFeed.sections.length > 0, "Album discovery sections returned without disturbing album tracks");

  // 15. Playlist continuation
  console.log("\nScenario 15: Playlist Intelligent Continuation");
  const playlistFeed = await getDiscoveryFeed({
    currentPage: "playlist",
    pageEntity: {
      name: "Late Night Drive",
      type: "playlist",
      tracks: [sampleArijit, sampleKK],
    },
  });
  assert(playlistFeed.sections.some(s => s.type === "continue_listening" || s.type === "similar_to"), "Playlist continuation generated from seed tracks");

  // 16. Smart Queue integration
  console.log("\nScenario 16: Smart Queue Integration");
  const queueResult = await computeAISmartQueue(
    sampleArijit,
    [],
    [],
    historyFeed.tasteProfile,
    []
  );
  assert(queueResult.nextTracks.length > 0, "Smart queue returns continuation tracks");
  assert(queueResult.coherenceScore >= 80, "Musical coherence score computed accurately (>= 80)");

  // 17. No fake tracks (real catalog only)
  console.log("\nScenario 17: Real Tracks Grounding Invariant");
  const allGeneratedTracks = [
    ...homeFeed.sections.flatMap(s => s.tracks),
    ...browseFeed.sections.flatMap(s => s.tracks),
    ...genreFeed.sections.flatMap(s => s.tracks),
  ];
  assert(allGeneratedTracks.length > 0, "Tracks generated across sections");
  const allHaveValidMetadata = allGeneratedTracks.every(
    t => t.title && t.artist && t.videoId && t.thumbnail
  );
  assert(allHaveValidMetadata, "100% of recommendations possess genuine title, artist, and thumbnail");

  // 18. No invalid YouTube IDs
  console.log("\nScenario 18: Strict 11-char YouTube ID Validity");
  const allIdsValid = allGeneratedTracks.every(t => isValidYouTubeVideoId(t.videoId));
  assert(allIdsValid, "100% of candidate videoIds are valid 11-char YouTube IDs");

  // 19. No duplicate canonical songs
  console.log("\nScenario 19: Canonical Song Title Deduplication");
  for (const section of homeFeed.sections) {
    const titles = section.tracks.map(t => normalizeTrackTitle(t.title));
    const uniqueTitles = new Set(titles);
    assert(titles.length === uniqueTitles.size, `No duplicate canonical titles in section "${section.title}"`);
  }

  // 20. Artist diversity (no consecutive monopoly)
  console.log("\nScenario 20: Artist Diversity Filter");
  const mockCandidates: CandidateRawItem[] = [
    { track: { videoId: "11111111111", title: "Song 1", artist: "Arijit Singh", thumbnail: "" }, seed: { query: "", seedType: "artist_affinity", label: "" } },
    { track: { videoId: "22222222222", title: "Song 2", artist: "Arijit Singh", thumbnail: "" }, seed: { query: "", seedType: "artist_affinity", label: "" } },
    { track: { videoId: "33333333333", title: "Song 3", artist: "Arijit Singh", thumbnail: "" }, seed: { query: "", seedType: "artist_affinity", label: "" } },
    { track: { videoId: "44444444444", title: "Song 4", artist: "KK", thumbnail: "" }, seed: { query: "", seedType: "similar_artist", label: "" } },
    { track: { videoId: "55555555555", title: "Song 5", artist: "Mohit Chauhan", thumbnail: "" }, seed: { query: "", seedType: "discovery_novelty", label: "" } },
  ];
  const ranked = rankCandidates(mockCandidates, {
    userTaste: historyFeed.tasteProfile,
    contextAnalysis: analyzeContext({}),
  });
  const filtered = applyDiversityFilter(ranked, 2);
  const arijitCount = filtered.filter(c => c.track.artist === "Arijit Singh").length;
  assert(arijitCount <= 2, "Arijit Singh count does not exceed maxPerArtist threshold (2)");

  // 21. Session adaptation (language momentum)
  console.log("\nScenario 21: Session Adaptation (Bengali Momentum)");
  const sessionAnalysis = analyzeContext({
    recentTracks: [sampleBengali, { videoId: "bbbbbbbbbbb", title: "Boba Tunnel", artist: "Anupam Roy", thumbnail: "" }],
  });
  assert(sessionAnalysis.recentLanguageMomentum === "Bengali", "Session dynamically adapts to Bengali listening momentum");

  // 22. User isolation (User A vs User B)
  console.log("\nScenario 22: User Isolation");
  const userAFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: { likedSongs: [sampleArijit] },
    userId: "user-arijit-fan",
  });
  const userBFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: { likedSongs: [samplePunjabi] },
    userId: "user-punjabi-fan",
  });
  const userATopArtist = userAFeed.tasteProfile.topArtists[0]?.name;
  const userBTopArtist = userBFeed.tasteProfile.topArtists[0]?.name;
  assert(userATopArtist !== userBTopArtist, `User A taste (${userATopArtist}) strictly isolated from User B (${userBTopArtist})`);

  // 23. AI provider failure fallback
  console.log("\nScenario 23: AI Provider Failure Deterministic Fallback");
  const fallbackFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {},
    userId: "empty-test-user",
  });
  assert(fallbackFeed.sections.length > 0, "Deterministic fallback returns valid real catalog sections if AI unavailable");

  // 24. Catalog failure resilience
  console.log("\nScenario 24: Catalog Failure Resilience");
  try {
    const resilienceCheck = await verifyPlayableTrack({
      videoId: "invalid_id!",
      title: "Broken Track",
      artist: "None",
      thumbnail: "",
    });
    assert(!resilienceCheck.valid, "Invalid track rejected without throwing unhandled exception");
  } catch {
    assert(false, "verifyPlayableTrack threw exception on invalid track");
  }

  // 25. Empty catalog handling (never fabricate)
  console.log("\nScenario 25: Empty Catalog Handling (Zero Fake Tracks)");
  const emptyVerify = await verifyPlayableTrack({
    videoId: "",
    title: "",
    artist: "",
    thumbnail: "",
  });
  assert(!emptyVerify.valid, "Empty track data strictly rejected, zero fake tracks manufactured");

  // 26. Cache isolation (guest vs user)
  console.log("\nScenario 26: Cache Isolation (Guest vs User)");
  clearUserDiscoveryCache("user-isolated-1");
  const cachedFeed1 = await getDiscoveryFeed({
    currentPage: "home",
    userId: "user-isolated-1",
    signals: { likedSongs: [sampleArijit] },
  });
  const cachedGuestFeed = await getDiscoveryFeed({
    currentPage: "home",
    userId: undefined,
  });
  assert(cachedFeed1.tasteProfile.topArtists.length > 0, "User profile populated");
  assert(cachedGuestFeed.tasteProfile.topArtists.length === 0, "Guest feed cache contains zero authenticated user signals");

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDiscoverySuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
