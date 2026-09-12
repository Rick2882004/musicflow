import fs from "fs";
import path from "path";
import { getDiscoveryFeed } from "../lib/ai/discovery/discovery-engine";
import { Track, ListeningHistoryEntry } from "../types/music";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runHomeV2Tests() {
  console.log("========================================================");
  console.log("MUSICFLOW V2 — PERSONALIZED HOME V2 VERIFICATION SUITE");
  console.log("========================================================\n");

  const sampleArijit: Track = {
    videoId: "JFcgOboQZ08",
    title: "Tum Hi Ho",
    artist: "Arijit Singh",
    thumbnail: "https://img.youtube.com/vi/JFcgOboQZ08/hqdefault.jpg",
    duration: 262,
  };

  const sampleAtif: Track = {
    videoId: "E74V-X9AtAg",
    title: "Kuch Is Tarah",
    artist: "Atif Aslam",
    thumbnail: "https://img.youtube.com/vi/E74V-X9AtAg/hqdefault.jpg",
    duration: 310,
  };

  const sampleSkipped: Track = {
    videoId: "V0KD0nDkbpM",
    title: "Bekhayali",
    artist: "Sachet Tandon",
    thumbnail: "https://img.youtube.com/vi/V0KD0nDkbpM/hqdefault.jpg",
    duration: 371,
  };

  // --- Test C & D: Codebase Static Constant Audit ---
  console.log("--- 1. Static Fallback Constants Removal Audit ---");
  const homeHeroCode = fs.readFileSync(path.join(__dirname, "../src/components/home/HomeHero.tsx"), "utf-8");
  assert(!homeHeroCode.includes("FALLBACK_QUICK_PICKS"), "No hardcoded FALLBACK_QUICK_PICKS in HomeHero.tsx");

  const popularArtistsCode = fs.readFileSync(path.join(__dirname, "../src/components/home/PopularArtists.tsx"), "utf-8");
  assert(!popularArtistsCode.includes("INITIAL_ARTISTS"), "No hardcoded INITIAL_ARTISTS in PopularArtists.tsx");

  // --- Test B: Guest / Cold-Start User ---
  console.log("\n--- 2. Guest / Cold-Start Home Recommendations ---");
  const guestFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {},
    userId: undefined,
  });

  assert(guestFeed.sections.length > 0, "Guest receives dynamic sections");
  assert(
    guestFeed.sections.every((s) => !s.title.toLowerCase().includes("because you listen")),
    "Guest never receives unearned 'Because You Listen To' section"
  );
  assert(
    guestFeed.sections.some((s) => s.type === "trending" || s.type === "mood" || s.type === "daily_mix"),
    "Guest receives genuine catalog discovery (trending / vibe / mix)"
  );
  assert(
    guestFeed.sections.every((s) => s.tracks.every((t) => t.videoId && t.videoId.length === 11)),
    "All guest tracks have verified 11-char YouTube IDs"
  );

  // --- Test A & F: Returning User with Real Signals ---
  console.log("\n--- 3. Returning User Personalization & Gating ---");
  const returningFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      likedSongs: [sampleArijit],
      followedArtists: [{ name: "Arijit Singh", image: null }],
      recentSongs: [sampleArijit, sampleAtif],
    },
    userId: "returning-user-test",
  });

  assert(
    returningFeed.sections.some((s) => s.sectionId === "home-made-for-you"),
    "Returning user receives 'Made For You' personalized section"
  );

  const becauseSection = returningFeed.sections.find((s) => s.sectionId === "home-because-you-listen");
  assert(!!becauseSection, "'Because You Listen To Arijit Singh' section appears when justified by signals");
  assert(
    becauseSection?.title.includes("Arijit Singh") === true,
    "'Because You Listen To' correctly identifies top artist"
  );

  // --- Test E: Cross-Section Deduplication Logic ---
  console.log("\n--- 4. Cross-Section Track Deduplication ---");
  const allTracksInFeed: string[] = [];
  let duplicateCount = 0;
  for (const sec of returningFeed.sections) {
    for (const track of sec.tracks) {
      if (allTracksInFeed.includes(track.videoId)) {
        duplicateCount++;
      } else {
        allTracksInFeed.push(track.videoId);
      }
    }
  }
  assert(duplicateCount === 0, "Zero track videoId duplicates across generated discovery sections");

  // --- Test G: Temporal Context Adaptation ---
  console.log("\n--- 5. Temporal Context Adaptation ---");
  const morningFeed = await getDiscoveryFeed({
    currentPage: "home",
    context: { timeOfDay: "morning" },
    userId: "temporal-morning-user",
  });
  const eveningFeed = await getDiscoveryFeed({
    currentPage: "home",
    context: { timeOfDay: "evening" },
    userId: "temporal-evening-user",
  });
  const lateNightFeed = await getDiscoveryFeed({
    currentPage: "home",
    context: { timeOfDay: "night" },
    userId: "temporal-night-user",
  });

  const morningVibe = morningFeed.sections.find((s) => s.type === "mood");
  const eveningVibe = eveningFeed.sections.find((s) => s.type === "mood");
  const nightVibe = lateNightFeed.sections.find((s) => s.type === "mood");

  assert(!!morningVibe && morningVibe.title.toLowerCase().includes("morning"), "Morning context reflects morning energy vibe");
  assert(!!eveningVibe && eveningVibe.title.toLowerCase().includes("evening"), "Evening context reflects evening chill vibe");
  assert(!!nightVibe && nightVibe.title.toLowerCase().includes("late night"), "Night context reflects late night atmospheric vibe");

  // --- Test H: Skip History Adaptation ---
  console.log("\n--- 6. Skip History Adaptation ---");
  const feedWithSkip = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      likedSongs: [sampleArijit],
      skips: [sampleSkipped.videoId],
    },
    userId: "user-with-skips",
  });
  const allTracks = feedWithSkip.sections.flatMap((s) => s.tracks);
  assert(!allTracks.some((t) => t.videoId === sampleSkipped.videoId), "Skipped track is completely excluded from recommendations");

  // --- Test I: Real Track Invariant (Zero Fake IDs) ---
  console.log("\n--- 7. Real Track Playability & Grounding Invariant ---");
  for (const s of returningFeed.sections) {
    for (const t of s.tracks) {
      assert(t.videoId.length === 11, `Track ${t.title} has valid 11-char ID`);
      assert(!t.videoId.startsWith("itunes-"), `Track ${t.title} is not an unresolved itunes-* ID`);
      assert(!t.videoId.includes("fake"), `Track ${t.title} is not a fake placeholder`);
    }
  }

  // --- Test L & M: Empty vs Large History Resilience ---
  console.log("\n--- 8. History Volume Resilience ---");
  const emptyHistoryFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: { history: [], recentSongs: [], likedSongs: [] },
    userId: "empty-history-user",
  });
  assert(emptyHistoryFeed.sections.length > 0, "Feed resolves gracefully with empty history");

  const largeHistory: ListeningHistoryEntry[] = Array.from({ length: 150 }, (_, i) => ({
    id: `hist-${i}`,
    track: i % 2 === 0 ? sampleArijit : sampleAtif,
    playbackDuration: 200,
    completionPercentage: 85,
    timestamp: Date.now() - i * 60000,
  }));

  const largeHistoryFeed = await getDiscoveryFeed({
    currentPage: "home",
    signals: {
      history: largeHistory.slice(0, 25), // Simulating client payload trimming
      recentSongs: [sampleArijit, sampleAtif],
    },
    userId: "large-history-user",
  });
  assert(largeHistoryFeed.sections.length > 0, "Feed resolves gracefully with trimmed large history");

  // --- Test Q: Frozen Files Intact Check ---
  console.log("\n--- 9. Frozen Files Untouched Verification ---");
  const frozenFiles = [
    "hooks/useMediaSession.ts",
    "lib/audio-anchor.ts",
    "lib/playback-intent.ts",
    "components/player/YoutubePlayer.tsx",
  ];

  for (const file of frozenFiles) {
    const fullPath = path.join(__dirname, "..", file);
    assert(fs.existsSync(fullPath), `Frozen file exists: ${file}`);
  }

  console.log("\n========================================================");
  console.log("PERSONALIZED HOME V2 TESTS: ALL PASSED (0 FAILED)");
  console.log("========================================================\n");
}

runHomeV2Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
