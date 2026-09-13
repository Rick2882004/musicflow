import "./bootstrap_env.js";
import { getAllSmartMixes, generateSmartMix } from "../lib/ai/mixes/smart-mixes-service";
import { parsePlaylistPrompt, generatePlaylistFromPrompt } from "../lib/ai/playlist/playlist-generator";
import { generateSurpriseDiscovery } from "../lib/ai/explore/explore-service";
import { getMoreLikeThis, getContinueVibe, getDiscoveryMore } from "../lib/ai/queue/ai-smart-queue-service";
import { buildUserTasteProfile } from "../lib/ai/profile/taste-profile-service";
import { Track } from "../types/music";
import { usePlayerStore } from "../store/player-store";

async function runTests() {
  console.log("==================================================");
  console.log("MUSICFLOW — BATCH 1 FEATURES COMPREHENSIVE TEST");
  console.log("==================================================\n");

  const sampleTrack: Track = {
    videoId: "kJQP7kiw5Fk", // Despacito
    title: "Despacito",
    artist: "Luis Fonsi",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: 228,
  };

  const sampleTrack2: Track = {
    videoId: "fJ9rUzIMcZQ", // Bohemian Rhapsody
    title: "Bohemian Rhapsody",
    artist: "Queen",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: 359,
  };

  const mockTasteProfile = buildUserTasteProfile({
    likedSongs: [sampleTrack, sampleTrack2],
    recentSongs: [sampleTrack],
    history: [],
    skips: [],
  });

  // =========================================================================
  // TEST 1: SMART MIXES (Feature 1)
  // =========================================================================
  console.log("── TEST 1: Smart Mixes ──");
  try {
    const chillMix = await generateSmartMix("chill", mockTasteProfile, [sampleTrack]);
    console.log(`✓ Generated "${chillMix.title}" (${chillMix.tracks.length} tracks, ${chillMix.totalDuration}s)`);
    console.log(`  Sample track 0: "${chillMix.tracks[0]?.title}" by ${chillMix.tracks[0]?.artist} [ID: ${chillMix.tracks[0]?.videoId}]`);
    if (chillMix.tracks.length === 0) throw new Error("Chill mix returned 0 tracks");
    if (!chillMix.tracks[0]?.videoId || chillMix.tracks[0]?.videoId.length !== 11) {
      throw new Error(`Invalid videoId: ${chillMix.tracks[0]?.videoId}`);
    }
  } catch (err) {
    console.error("✗ Smart Mixes test failed:", err);
  }

  // =========================================================================
  // TEST 2: AI PLAYLIST GENERATOR (Feature 2)
  // =========================================================================
  console.log("\n── TEST 2: AI Playlist Generator ──");
  try {
    const prompt = "Late night rainy city drive with synthwave beats";
    const parsed = parsePlaylistPrompt(prompt, 30);
    console.log(`✓ Parsed prompt: targetTracks=${parsed.targetTracks}, suggestedTitle="${parsed.suggestedTitle}"`);
    console.log(`  Search seeds: ${parsed.searchSeeds.join(", ")}`);

    const playlist = await generatePlaylistFromPrompt(prompt, 30);
    console.log(`✓ Generated Playlist: "${playlist.title}" (${playlist.tracks.length} tracks, ${playlist.totalDuration}s)`);
    console.log(`  Description: "${playlist.description}"`);
    if (playlist.tracks.length === 0) throw new Error("Generated playlist returned 0 tracks");
    console.log(`  Sample: "${playlist.tracks[0]?.title}" by ${playlist.tracks[0]?.artist}`);
  } catch (err) {
    console.error("✗ AI Playlist Generator test failed:", err);
  }

  // =========================================================================
  // TEST 3: EXPLORE MODE (Surprise Me) (Feature 3)
  // =========================================================================
  console.log("\n── TEST 3: Explore Mode (Surprise Me) ──");
  try {
    const surprise = await generateSurpriseDiscovery({
      profile: mockTasteProfile,
      likedSongs: [sampleTrack],
      recentTracks: [sampleTrack2],
      limit: 10,
    });
    console.log(`✓ Surprise Me: ${surprise.tracks.length} tracks (affinity: ${surprise.affinityCount}, novelty: ${surprise.noveltyCount})`);
    console.log(`  Summary: ${surprise.vibeSummary}`);

    // Verify anti-fatigue: strictly max 1 per artist
    const artists = surprise.tracks.map((t) => (t.artist || "").toLowerCase().trim());
    const uniqueArtists = new Set(artists);
    console.log(`  Unique artists: ${uniqueArtists.size} / ${artists.length}`);
    if (uniqueArtists.size !== artists.length) {
      console.warn("  ⚠ Warning: duplicate artists detected in surprise set!");
    } else {
      console.log("  ✓ Anti-fatigue check passed: 100% unique artists!");
    }
  } catch (err) {
    console.error("✗ Explore Mode test failed:", err);
  }

  // =========================================================================
  // TEST 4: ADVANCED SMART QUEUE (Feature 4)
  // =========================================================================
  console.log("\n── TEST 4: Advanced Smart Queue ──");
  try {
    // 4A: More Like This
    const more = await getMoreLikeThis(sampleTrack, 3);
    console.log(`✓ More Like This: ${more.length} tracks`);
    if (more[0]) console.log(`  First: "${more[0].title}" by ${more[0].artist} [${more[0].videoId}]`);

    // 4B: Continue Vibe
    const continueTracks = await getContinueVibe(sampleTrack, [sampleTrack2]);
    console.log(`✓ Continue Vibe: ${continueTracks.length} tracks`);

    // 4C: Discover More
    const discoverTracks = await getDiscoveryMore(sampleTrack, mockTasteProfile);
    console.log(`✓ Discover More: ${discoverTracks.length} tracks`);

    // 4D: Player Store Queue Manipulations
    usePlayerStore.getState().setQueue([sampleTrack, sampleTrack2]);
    console.log(`✓ Store initial queue length: ${usePlayerStore.getState().queue.length}`);

    // Play Next
    const insertTrack: Track = {
      videoId: "3JZ_D3ELwOQ",
      title: "Clair de Lune",
      artist: "Claude Debussy",
      thumbnail: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
      duration: 300,
    };
    usePlayerStore.getState().playNext(insertTrack);
    console.log(`✓ playNext inserted track at index 1: "${usePlayerStore.getState().queue[1]?.title}"`);

    // Avoid Artist
    usePlayerStore.getState().avoidArtist("Queen");
    console.log(`✓ avoidArtist removed Queen: remaining upcoming queue length = ${usePlayerStore.getState().queue.length}`);
    const hasQueen = usePlayerStore.getState().queue.slice(1).some((t) => (t.artist || "").toLowerCase().includes("queen"));
    if (hasQueen) throw new Error("avoidArtist did not remove artist from upcoming queue");
    console.log(`✓ Skips now contains Queen: ${usePlayerStore.getState().skips.includes("artist:queen")}`);

    // Deduplicate
    usePlayerStore.getState().addToQueue(insertTrack); // Add duplicate
    console.log(`✓ Queue length with duplicate: ${usePlayerStore.getState().queue.length}`);
    usePlayerStore.getState().removeQueueDuplicates();
    console.log(`✓ Queue length after removeQueueDuplicates: ${usePlayerStore.getState().queue.length}`);
  } catch (err) {
    console.error("✗ Advanced Smart Queue test failed:", err);
  }

  // =========================================================================
  // TEST 5: SLEEP TIMER (Feature 5)
  // =========================================================================
  console.log("\n── TEST 5: Sleep Timer ──");
  try {
    // Minutes timer
    usePlayerStore.getState().setSleepTimer(15, "minutes");
    const s1 = usePlayerStore.getState();
    console.log(`✓ Set 15m timer: sleepTimer=${s1.sleepTimer}, type=${s1.sleepTimerType}`);
    console.log(`  EndsAt set: ${s1.sleepTimerEndsAt !== null}`);
    console.log(`  SecondsRemaining set: ${s1.sleepTimerSecondsRemaining === 15 * 60}`);

    // End of song timer
    usePlayerStore.getState().setSleepTimer(0, "end-of-song");
    const s2 = usePlayerStore.getState();
    console.log(`✓ Set End of Song timer: sleepTimer=${s2.sleepTimer}, type=${s2.sleepTimerType}`);

    // Cancel timer
    usePlayerStore.getState().cancelSleepTimer();
    const s3 = usePlayerStore.getState();
    console.log(`✓ Cancelled timer: sleepTimer=${s3.sleepTimer}, type=${s3.sleepTimerType}`);
  } catch (err) {
    console.error("✗ Sleep Timer test failed:", err);
  }

  console.log("\n==================================================");
  console.log("BATCH 1 FEATURE VERIFICATION COMPLETED");
  console.log("==================================================");
}

runTests().catch(console.error);
