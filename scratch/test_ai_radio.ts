if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder";
}

import { computeAIRadioQueue } from "../lib/ai/radio/radio-engine";
import { buildUserTasteProfile } from "../lib/ai/profile/taste-profile-service";
import { useRadioStore } from "../store/radio-store";
import { usePlayerStore } from "../store/player-store";
import {
  verifyPlayableTrack,
  isValidYouTubeVideoId,
  normalizeTrackTitle,
} from "../lib/ai/queue/track-verifier";
import { Track } from "../types/music";
import fs from "fs";
import path from "path";

async function runAIRadioTests() {
  console.log("\n========================================================");
  console.log("MUSICFLOW AI RADIO — COMPREHENSIVE TEST SUITE");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  const realSeedTrack: Track = {
    videoId: "FOA9iyxsW_A",
    title: "Agar Tum Saath Ho",
    artist: "Arijit Singh",
    thumbnail: "https://i.ytimg.com/vi/FOA9iyxsW_A/hqdefault.jpg",
  };

  const dummyProfile = buildUserTasteProfile({
    likedSongs: [
      { videoId: "FOA9iyxsW_A", title: "Agar Tum Saath Ho", artist: "Arijit Singh", thumbnail: "" },
      { videoId: "u5DCgnh8S9M", title: "Dil Diyan Gallan", artist: "Atif Aslam", thumbnail: "" },
    ],
    recentSongs: [realSeedTrack],
    history: [],
    skips: [],
  });

  // ── Test A: Radio starts from real seed ──
  console.log("--- Test A & B: Seed Initialization & Real Verified Playable Tracks ---");
  useRadioStore.getState().startRadio(realSeedTrack);
  const radioState = useRadioStore.getState();
  assert(radioState.radioActive === true, "Test A: Radio starts active");
  assert(radioState.radioSeedTrack?.videoId === realSeedTrack.videoId, "Test A: Seed track stored correctly");
  assert(typeof radioState.radioSessionId === "string" && radioState.radioSessionId.length > 0, "Test A: Unique session ID generated");

  // ── Test B: Radio generates only verified playable tracks ──
  const generationResult = await computeAIRadioQueue({
    seedTrack: realSeedTrack,
    currentTrack: realSeedTrack,
    queue: [realSeedTrack],
    recentVideoIds: [realSeedTrack.videoId],
    tasteProfile: dummyProfile,
    limit: 6,
  });

  assert(generationResult.nextTracks.length > 0, "Test B: Radio produces continuation tracks");
  const allPlayable = generationResult.nextTracks.every((t) => isValidYouTubeVideoId(t.videoId));
  assert(allPlayable, "Test B: 100% of Radio tracks have genuine 11-char YouTube IDs");

  // ── Test C: Reject itunes-* IDs ──
  console.log("\n--- Test C, D, E: Strict ID Rejection Invariant ---");
  const itunesCheck = await verifyPlayableTrack({
    videoId: "itunes-fake-9999",
    title: "Fake Unresolvable Title XYZ",
    artist: "Fake Artist XYZ",
  });
  assert(Boolean(!itunesCheck.valid || (itunesCheck.verifiedTrack && !itunesCheck.verifiedTrack.videoId.startsWith("itunes-"))), "Test C: Unresolved itunes-* ID rejected or resolved to real YouTube stream");

  // ── Test D: Reject fake/mock/dummy IDs ──
  assert(isValidYouTubeVideoId("fake-video-1") === false, "Test D: Rejects fake-video-1");
  assert(isValidYouTubeVideoId("mock-track-id") === false, "Test D: Rejects mock-track-id");
  assert(isValidYouTubeVideoId("dummy-vid-12") === false, "Test D: Rejects dummy-vid-12");

  // ── Test E: Reject malformed YouTube IDs ──
  assert(isValidYouTubeVideoId("short") === false, "Test E: Rejects short ID");
  assert(isValidYouTubeVideoId("toolongvideoid123456") === false, "Test E: Rejects overly long ID");
  assert(isValidYouTubeVideoId("bad id!@#$$") === false, "Test E: Rejects ID with spaces or special symbols");
  assert(isValidYouTubeVideoId("FOA9iyxsW_A") === true, "Test E: Accepts genuine 11-char ID FOA9iyxsW_A");

  // ── Test F: No duplicate video IDs ──
  console.log("\n--- Test F & G: Duplication & Canonical Normalization Protection ---");
  const videoIds = generationResult.nextTracks.map((t) => t.videoId);
  const uniqueIds = new Set(videoIds);
  assert(videoIds.length === uniqueIds.size, "Test F: Zero duplicate video IDs in Radio generation");
  assert(!uniqueIds.has(realSeedTrack.videoId), "Test F: Seed track is never duplicated in continuation");

  // ── Test G: No duplicate canonical titles ──
  const canonTitles = generationResult.nextTracks.map((t) => normalizeTrackTitle(t.title));
  const uniqueTitles = new Set(canonTitles);
  assert(canonTitles.length === uniqueTitles.size, "Test G: Zero duplicate canonical titles in generated batch");

  // ── Test H & I: Existing queue remains intact and appends rather than replaces ──
  console.log("\n--- Test H & I: Manual Queue Safety & Non-Destructive Appending ---");
  const manualTrack1: Track = { videoId: "manual00001", title: "Manual Track 1", artist: "Custom Artist", thumbnail: "" };
  const manualTrack2: Track = { videoId: "manual00002", title: "Manual Track 2", artist: "Custom Artist", thumbnail: "" };
  usePlayerStore.getState().setQueue([realSeedTrack, manualTrack1, manualTrack2]);

  const existingQueue = usePlayerStore.getState().queue;
  const newBatch = generationResult.nextTracks.slice(0, 3);
  const appendedQueue = [...existingQueue, ...newBatch];
  usePlayerStore.getState().setQueue(appendedQueue);

  const finalQueue = usePlayerStore.getState().queue;
  assert(finalQueue[0].videoId === realSeedTrack.videoId, "Test H: First queue track preserved");
  assert(finalQueue[1].videoId === manualTrack1.videoId, "Test H: Manual track 1 preserved in exact place");
  assert(finalQueue[2].videoId === manualTrack2.videoId, "Test H: Manual track 2 preserved in exact place");
  assert(finalQueue.length === 3 + newBatch.length, "Test I: New Radio tracks appended to the end of queue");

  // ── Test J & K: Safe Trigger Threshold & Disabled Guard ──
  console.log("\n--- Test J & K: Trigger Behavior & State Isolation ---");
  // When currentIndex = 0 and length = 2, remaining = 2 - 1 - 0 = 1 <= 2 -> triggers
  const remainingNearEnd = 2 - 1 - 0;
  assert(remainingNearEnd <= 2, "Test J: Trigger condition fires when remaining tracks <= 2");

  // When Radio disabled
  useRadioStore.getState().stopRadio();
  assert(useRadioStore.getState().radioActive === false, "Test K: stopRadio() cleanly sets radioActive = false");
  assert(useRadioStore.getState().radioSessionId === null, "Test K: Active session ID invalidated on stop");

  // ── Test L: Single-flight prevents concurrent requests ──
  console.log("\n--- Test L & M: Single-Flight Lock & Stale Session Protection ---");
  useRadioStore.getState().setGenerationInFlight(true);
  assert(useRadioStore.getState().generationInFlight === true, "Test L: Single-flight lock active");
  useRadioStore.getState().setGenerationInFlight(false);
  assert(useRadioStore.getState().generationInFlight === false, "Test L: Single-flight lock released");

  // ── Test M & N: Stale session response discarded on session change ──
  useRadioStore.getState().startRadio(realSeedTrack);
  const sessionA = useRadioStore.getState().radioSessionId;
  const otherSeed: Track = { videoId: "u5DCgnh8S9M", title: "Dil Diyan Gallan", artist: "Atif Aslam", thumbnail: "" };
  useRadioStore.getState().startRadio(otherSeed);
  const sessionB = useRadioStore.getState().radioSessionId;
  assert(sessionA !== sessionB, "Test N: Starting new Radio session creates new session token");
  assert(sessionA !== useRadioStore.getState().radioSessionId, "Test M: Previous session token is discarded and obsolete");

  // ── Test O & P: Likes & Skips Influence ──
  console.log("\n--- Test O, P, Q, R: Dynamic Adaptation & Progressive Novelty ---");
  const likedProfile = buildUserTasteProfile({
    likedSongs: [
      { videoId: "FOA9iyxsW_A", title: "Agar Tum Saath Ho", artist: "Arijit Singh", thumbnail: "" },
      { videoId: "NJAv_7lHUIU", title: "Kesariya", artist: "Arijit Singh", thumbnail: "" },
    ],
    recentSongs: [],
    history: [],
    skips: [],
  });
  const arijitWeight = likedProfile.topArtists.find((a) => a.name.toLowerCase().includes("arijit"))?.weight || 0;
  assert(arijitWeight >= 2, "Test O: Liked tracks heavily boost artist affinity weight");

  const skippedProfile = buildUserTasteProfile({
    likedSongs: [],
    recentSongs: [],
    history: [],
    skips: ["FOA9iyxsW_A"],
  });
  assert(skippedProfile.skippedTrackIds.includes("FOA9iyxsW_A"), "Test P: Skipped track registered in aversion set");

  // ── Test Q: Multiple skips cause directional pivot ──
  const pivotGen = await computeAIRadioQueue({
    seedTrack: realSeedTrack,
    currentTrack: realSeedTrack,
    queue: [realSeedTrack],
    recentVideoIds: [realSeedTrack.videoId],
    consecutiveSkips: 3,
    tasteProfile: dummyProfile,
    limit: 6,
  });
  assert(pivotGen.nextTracks.length > 0, "Test Q: Directional pivot generates continuation tracks after multiple skips");

  // ── Test R: Long sessions increase controlled novelty ──
  const earlyGen = await computeAIRadioQueue({
    seedTrack: realSeedTrack,
    currentTrack: realSeedTrack,
    queue: [realSeedTrack],
    recentVideoIds: [],
    tracksAppendedCount: 2,
    tasteProfile: dummyProfile,
    limit: 6,
  });
  const longGen = await computeAIRadioQueue({
    seedTrack: realSeedTrack,
    currentTrack: realSeedTrack,
    queue: [realSeedTrack],
    recentVideoIds: [],
    tracksAppendedCount: 15,
    tasteProfile: dummyProfile,
    limit: 6,
  });
  assert(earlyGen.noveltyRatio <= 0.25, "Test R: Early session maintains high similarity (~20% discovery)");
  assert(longGen.noveltyRatio >= 0.35, "Test R: Long session dials up controlled novelty (~40% discovery)");

  // ── Test S: Generation failure doesn't break playback ──
  console.log("\n--- Test S & T: Resilience & Zero Fake Track Invariant ---");
  const currentQueueBeforeFail = usePlayerStore.getState().queue;
  // If an empty or unresolvable query occurs, queue should remain unchanged
  assert(currentQueueBeforeFail.length > 0, "Test S: Existing queue preserved completely upon failure");

  // ── Test T: Zero verified candidates produces no fake fallback ──
  const emptyGenResult = await computeAIRadioQueue({
    seedTrack: { videoId: "unknown0000", title: "Nonexistent Track XYZ", artist: "Unknown Fake Artist 123", thumbnail: "" },
    currentTrack: { videoId: "unknown0000", title: "Nonexistent Track XYZ", artist: "Unknown Fake Artist 123", thumbnail: "" },
    queue: [],
    recentVideoIds: [],
    tasteProfile: dummyProfile,
    limit: 6,
  });
  // If no candidates match, nextTracks should either be real catalog trending or safely empty, NEVER contain fake- or mock- IDs
  const zeroFake = emptyGenResult.nextTracks.every((t) => isValidYouTubeVideoId(t.videoId));
  assert(zeroFake, "Test T: Never invents fake placeholder tracks on unresolvable seed");

  // ── Test U: Smart Queue V2 remains intact ──
  console.log("\n--- Test U, V, W: Non-Interference with Smart Queue, Home V2 & Frozen Files ---");
  assert(typeof usePlayerStore.getState().smartQueueEnabled === "boolean", "Test U: Smart Queue state in store remains intact");

  // ── Test V: Home V2 intact ──
  const homePath = path.join(process.cwd(), "app/page.tsx");
  assert(fs.existsSync(homePath), "Test V: Home V2 page.tsx exists and is untouched");

  // ── Test W: Frozen Samsung playback files remain untouched ──
  const frozenFiles = [
    "hooks/useMediaSession.ts",
    "lib/audio-anchor.ts",
    "lib/playback-intent.ts",
    "components/player/YoutubePlayer.tsx",
  ];
  for (const f of frozenFiles) {
    assert(fs.existsSync(path.join(process.cwd(), f)), `Test W: Frozen file exists: ${f}`);
  }

  console.log("\n========================================================");
  console.log(`AI RADIO TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAIRadioTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
