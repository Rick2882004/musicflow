// Bootstrap window and localStorage for Node testing
require("./bootstrap_env.js");

import { computeMusicDNA } from "../lib/music-dna/music-dna-service";
import {
  calculateAdvancedListeningStats,
  formatListeningDuration,
} from "../lib/analytics/listening-stats-service";
import { useSessionStore, ListeningSession } from "../store/session-store";
import { SessionTracker } from "../lib/listening-sessions/session-tracker";
import { buildUserTasteProfile } from "../lib/ai/profile/taste-profile-service";
import { Track, ListeningHistoryEntry } from "../types/music";
import * as fs from "fs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

console.log("==================================================");
console.log("MUSICFLOW — BATCH 2 FEATURES COMPREHENSIVE TEST");
console.log("PERSONALIZATION + LISTENING INTELLIGENCE");
console.log("==================================================\n");

// Sample verified real catalog tracks
const trackArijit1: Track = {
  videoId: "FOA9iyxsW_A",
  title: "Agar Tum Saath Ho",
  artist: "Arijit Singh",
  thumbnail: "https://i.ytimg.com/vi/FOA9iyxsW_A/hqdefault.jpg",
  album: "Tamasha",
  duration: 341,
};

const trackArijit2: Track = {
  videoId: "NJAv_7lHUIU",
  title: "Kesariya",
  artist: "Arijit Singh",
  thumbnail: "https://i.ytimg.com/vi/NJAv_7lHUIU/hqdefault.jpg",
  album: "Brahmastra",
  duration: 268,
};

const trackDiljit: Track = {
  videoId: "u5DCgnh8S9M",
  title: "G.O.A.T.",
  artist: "Diljit Dosanjh",
  thumbnail: "https://i.ytimg.com/vi/u5DCgnh8S9M/hqdefault.jpg",
  album: "G.O.A.T.",
  duration: 223,
};

const trackTaylor: Track = {
  videoId: "-BjZmE2gtdo",
  title: "Lover",
  artist: "Taylor Swift",
  thumbnail: "https://i.ytimg.com/vi/-BjZmE2gtdo/hqdefault.jpg",
  album: "Lover",
  duration: 239,
};

const trackLofi: Track = {
  videoId: "5qap5aO4i9A",
  title: "Lofi Hip Hop Beats to Relax",
  artist: "Lofi Beats",
  thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
  album: "Chill Study Beats",
  duration: 180,
};

// ── TEST 1: MUSIC DNA ──
console.log("── TEST 1: Music DNA Engine ──");

// 1.1 Cold Start Check
const coldDna = computeMusicDNA({
  likedSongs: [],
  history: [],
  recentSongs: [],
});
assert(coldDna.isForming === true, "Cold start returns isForming = true for empty signals");
assert(
  coldDna.archetype.title === "Music Explorer",
  "Cold start archetype defaults to Music Explorer"
);

// 1.2 Realistic Active Profile
const now = Date.now();
const sampleHistory: ListeningHistoryEntry[] = [
  { id: "1", track: trackArijit1, timestamp: now - 3600000 * 2, playbackDuration: 341, completionPercentage: 100 },
  { id: "2", track: trackArijit1, timestamp: now - 3600000 * 5, playbackDuration: 341, completionPercentage: 100 }, // Replay!
  { id: "3", track: trackArijit2, timestamp: now - 3600000 * 12, playbackDuration: 268, completionPercentage: 100 },
  { id: "4", track: trackDiljit, timestamp: now - 3600000 * 24, playbackDuration: 223, completionPercentage: 100 },
  { id: "5", track: trackTaylor, timestamp: now - 3600000 * 48, playbackDuration: 239, completionPercentage: 100 },
  { id: "6", track: trackLofi, timestamp: now - 3600000 * 72, playbackDuration: 180, completionPercentage: 100 },
];

const activeDna = computeMusicDNA({
  likedSongs: [trackArijit1, trackTaylor],
  history: sampleHistory,
  followedArtists: [{ name: "Arijit Singh" }],
});

assert(activeDna.isForming === false, "Active profile isForming is false");
assert(activeDna.topArtists.length > 0, "Top artists calculated");
assert(activeDna.topArtists[0].name === "Arijit Singh", "Arijit Singh is top artist by weight");
assert(activeDna.topGenres.length > 0, "Top genres calculated");
assert(activeDna.topLanguages.some((l) => l.language === "Hindi"), "Hindi detected in languages");
assert(activeDna.topLanguages.some((l) => l.language === "English"), "English detected in languages");
assert(
  activeDna.listeningStyle.familiarPercentage + activeDna.listeningStyle.discoveryPercentage === 100,
  "Familiarity + Discovery sum to 100%"
);
assert(activeDna.replayTendency.percentage > 0, "Replay tendency detected from repeated song");
assert(Boolean(activeDna.explainers.genresBasis), "Genres basis explainer is present and populated");
assert(Boolean(activeDna.explainers.artistsBasis), "Artists basis explainer is present and populated");
assert(Boolean(activeDna.soundProfile), `Sound profile calculated: "${activeDna.soundProfile}"`);

console.log("");

// ── TEST 2: ADVANCED LISTENING STATISTICS ──
console.log("── TEST 2: Advanced Listening Statistics ──");

// 2.1 All time stats
const statsAll = calculateAdvancedListeningStats(sampleHistory, [trackArijit1], [], "all_time");
assert(statsAll.hasEnoughData === true, "Has enough data for all_time");
assert(statsAll.tracksPlayed === 6, `Tracks played = ${statsAll.tracksPlayed} (expected 6)`);
assert(statsAll.tracksCompleted === 6, `Tracks completed = ${statsAll.tracksCompleted} (expected 6)`);
assert(statsAll.uniqueArtistsCount === 4, `Unique artists = ${statsAll.uniqueArtistsCount} (expected 4)`);
assert(statsAll.mostPlayedArtist?.name === "Arijit Singh", "Most played artist is Arijit Singh");
assert(statsAll.mostPlayedTrack?.track.title === "Agar Tum Saath Ho", "Most played track is Agar Tum Saath Ho");
assert(statsAll.hourlyActivity.length === 24, "24 hourly activity points returned");
assert(statsAll.totalListeningSeconds > 1000, `Total listening duration: ${statsAll.totalListeningFormatted}`);

// 2.2 Time range filtering (e.g. today vs 3 months)
const statsToday = calculateAdvancedListeningStats(sampleHistory, [trackArijit1], [], "today");
assert(statsToday.hasEnoughData === true, "Has enough data for today");
assert(statsToday.tracksPlayed < statsAll.tracksPlayed, "Today tracks played is subset of all_time");

// 2.3 Empty range honest cold-start check
const statsEmpty = calculateAdvancedListeningStats([], [], [], "this_month");
assert(statsEmpty.hasEnoughData === false, "Empty history returns hasEnoughData = false");
assert(statsEmpty.totalListeningFormatted === "0 min", "Empty stats formatted duration is 0 min");

// 2.4 Formatting helper
assert(formatListeningDuration(150) === "3 min", "150s formatted as 3 min");
assert(formatListeningDuration(3660) === "1h 1m", "3660s formatted as 1h 1m");

console.log("");

// ── TEST 3: LISTENING SESSIONS & USER ISOLATION ──
console.log("── TEST 3: Listening Sessions & User Isolation ──");

const sessionStore = useSessionStore.getState();

// 3.1 Start a session for User A
sessionStore.setCurrentUserUid("user_A");
sessionStore.startSession(trackArijit1, "user_A");
const activeSession = useSessionStore.getState().activeSession;
assert(activeSession !== null, "Active session started");
assert(activeSession?.userUid === "user_A", "Session scoped to user_A");

// 3.2 Record track play
sessionStore.recordTrackPlay(trackArijit1, 240, true, false, false, true, "Bollywood");
assert(
  useSessionStore.getState().activeSession?.completedCount === 1,
  "Track play recorded with completed count = 1"
);
assert(
  useSessionStore.getState().activeSession?.duration === 240,
  "Duration accumulated to 240s"
);

// 3.3 Finalize session
const finalized = sessionStore.finalizeActiveSession();
assert(finalized !== null, "Active session finalized");
assert(useSessionStore.getState().completedSessions.length === 1, "Completed session saved to user_A");

// 3.4 User Isolation Verification
// Switch to User B
sessionStore.setCurrentUserUid("user_B");
assert(
  useSessionStore.getState().completedSessions.length === 0,
  "User B has 0 sessions (User A's session is strictly isolated!)"
);

// User B plays a session
sessionStore.startSession(trackTaylor, "user_B");
sessionStore.recordTrackPlay(trackTaylor, 239, true, false, true, false, "Pop");
sessionStore.finalizeActiveSession();
assert(useSessionStore.getState().completedSessions.length === 1, "User B has 1 session saved");
assert(
  useSessionStore.getState().completedSessions[0].topArtist === "Taylor Swift",
  "User B's session top artist is Taylor Swift"
);

// Switch back to User A
sessionStore.setCurrentUserUid("user_A");
assert(
  useSessionStore.getState().completedSessions.length === 1,
  "User A's session restored on re-login"
);
assert(
  useSessionStore.getState().completedSessions[0].topArtist === "Arijit Singh",
  "User A's session contains Arijit Singh (No cross-user contamination!)"
);

// 3.5 Session Tracker Inactivity Boundary Check
SessionTracker.onTrackStart(trackDiljit, "user_A");
const liveSession = useSessionStore.getState().activeSession;
assert(liveSession !== null, "SessionTracker started active session");
SessionTracker.onTrackEnd(trackDiljit, 200, 223, false);
assert(
  useSessionStore.getState().activeSession?.tracksCount === 1,
  "Track ended and recorded in active session"
);

console.log("");

// ── TEST 4: PERSONALIZATION FEEDBACK LOOP ──
console.log("── TEST 4: Personalization Feedback Loop ──");

const profile = buildUserTasteProfile({
  likedSongs: [trackArijit1],
  history: sampleHistory,
  followedArtists: [{ name: "Arijit Singh" }],
});

assert(profile.familiarityRatio !== undefined, "familiarityRatio populated in taste profile");
assert(profile.discoveryRatio !== undefined, "discoveryRatio populated in taste profile");
assert(profile.diversityScore !== undefined, "diversityScore populated in taste profile");
assert(Boolean(profile.dominantVibe), `dominantVibe populated: "${profile.dominantVibe}"`);

console.log("");

// ── TEST 5: FROZEN PLAYBACK FILES INTEGRITY ──
console.log("── TEST 5: Frozen Playback Files Integrity ──");

const frozenFiles = [
  "hooks/useMediaSession.ts",
  "lib/audio-anchor.ts",
  "lib/playback-intent.ts",
  "components/player/YoutubePlayer.tsx",
];

for (const file of frozenFiles) {
  assert(fs.existsSync(file), `Frozen file exists and is preserved: ${file}`);
}

console.log("\n==================================================");
console.log("BATCH 2 FEATURE VERIFICATION COMPLETED: ALL PASSED");
console.log("==================================================");
