import { Track, ListeningHistoryEntry } from "@/types/music";
import { ContextAnalysisResult } from "./types";

export interface ContextSignals {
  recentTracks?: Track[];
  history?: ListeningHistoryEntry[];
  skips?: string[];
  currentTrack?: Track;
  timeOfDayOverride?: string;
}

const BENGALI_ARTISTS = new Set([
  "anupam roy",
  "fossils",
  "rupam islam",
  "nachiketa",
  "shilajit",
  "somlata",
  "hemanta mukherjee",
  "manna dey",
  "rupankar bagchi",
  "shreya ghoshal bengali",
  "arijit singh bengali",
  "cactuss",
  "moheener ghoraguli",
]);

const PUNJABI_ARTISTS = new Set([
  "ap dhillon",
  "diljit dosanjh",
  "karan aujla",
  "shubh",
  "sidhu moose wala",
  "gurinder gill",
  "amrit maan",
  "b praak",
  "hardy sandhu",
]);

const BOLLYWOOD_ARTISTS = new Set([
  "arijit singh",
  "kk",
  "atif aslam",
  "pritam",
  "shreya ghoshal",
  "sonu nigam",
  "kumar sanu",
  "udit narayan",
  "mohit chauhan",
  "vishal-shekhar",
  "sachin-jigar",
]);

const ENGLISH_ARTISTS = new Set([
  "taylor swift",
  "the weeknd",
  "ed sheeran",
  "drake",
  "billie eilish",
  "coldplay",
  "dua lipa",
  "ariana grande",
  "post malone",
  "bruno mars",
]);

export function analyzeContext(signals: ContextSignals): ContextAnalysisResult {
  const {
    recentTracks = [],
    history = [],
    skips = [],
    currentTrack,
    timeOfDayOverride,
  } = signals;

  // 1. Time-of-day vibe
  let hour = new Date().getHours();
  if (timeOfDayOverride) {
    if (timeOfDayOverride.includes("morning")) hour = 8;
    else if (timeOfDayOverride.includes("day") || timeOfDayOverride.includes("afternoon")) hour = 14;
    else if (timeOfDayOverride.includes("evening")) hour = 19;
    else if (timeOfDayOverride.includes("night")) hour = 23;
  }

  let timeOfDayVibe: ContextAnalysisResult["timeOfDayVibe"] = "focused_day";
  let timeOfDayLabel = "Daytime Flow & Focus";

  if (hour >= 5 && hour < 11) {
    timeOfDayVibe = "energetic_morning";
    timeOfDayLabel = "Morning Energy & Fresh Starts";
  } else if (hour >= 11 && hour < 17) {
    timeOfDayVibe = "focused_day";
    timeOfDayLabel = "Daytime Momentum & Focus";
  } else if (hour >= 17 && hour < 22) {
    timeOfDayVibe = "relaxed_evening";
    timeOfDayLabel = "Evening Chill & Wind Down";
  } else {
    timeOfDayVibe = "late_night_calm";
    timeOfDayLabel = "Late Night Atmospheric Melodies";
  }

  // 2. Combine session tracks (currentTrack + recentTracks + history)
  const sessionTracks: Track[] = [];
  if (currentTrack) sessionTracks.push(currentTrack);
  for (const t of recentTracks.slice(0, 10)) {
    if (!sessionTracks.some((s) => s.videoId === t.videoId)) {
      sessionTracks.push(t);
    }
  }

  // 3. Detect Language Momentum
  let bengaliCount = 0;
  let punjabiCount = 0;
  let hindiCount = 0;
  let englishCount = 0;

  for (const t of sessionTracks) {
    const raw = `${t.title || ""} ${t.artist || ""}`.toLowerCase();
    const artist = (t.artist || "").toLowerCase().trim();

    if (BENGALI_ARTISTS.has(artist) || raw.includes("bengali") || raw.includes("bangla")) {
      bengaliCount++;
    } else if (PUNJABI_ARTISTS.has(artist) || raw.includes("punjabi")) {
      punjabiCount++;
    } else if (ENGLISH_ARTISTS.has(artist) || raw.includes("english")) {
      englishCount++;
    } else if (BOLLYWOOD_ARTISTS.has(artist) || raw.includes("hindi") || raw.includes("bollywood")) {
      hindiCount++;
    }
  }

  let recentLanguageMomentum: string | undefined;
  const maxLang = Math.max(bengaliCount, punjabiCount, hindiCount, englishCount);
  if (maxLang >= 2) {
    if (bengaliCount === maxLang) recentLanguageMomentum = "Bengali";
    else if (punjabiCount === maxLang) recentLanguageMomentum = "Punjabi";
    else if (hindiCount === maxLang) recentLanguageMomentum = "Hindi";
    else if (englishCount === maxLang) recentLanguageMomentum = "English";
  }

  // 4. Detect Mood Momentum
  let romanticCount = 0;
  let sadCount = 0;
  let chillCount = 0;
  let upbeatCount = 0;

  for (const t of sessionTracks) {
    const text = `${t.title || ""} ${t.artist || ""}`.toLowerCase();
    if (
      text.includes("love") ||
      text.includes("romantic") ||
      text.includes("pyaar") ||
      text.includes("dil") ||
      text.includes("ishq") ||
      text.includes("tum")
    ) {
      romanticCount++;
    } else if (
      text.includes("sad") ||
      text.includes("dard") ||
      text.includes("alone") ||
      text.includes("crying") ||
      text.includes("juda")
    ) {
      sadCount++;
    } else if (
      text.includes("chill") ||
      text.includes("lofi") ||
      text.includes("slowed") ||
      text.includes("relax") ||
      text.includes("acoustic")
    ) {
      chillCount++;
    } else if (
      text.includes("party") ||
      text.includes("bhangra") ||
      text.includes("dance") ||
      text.includes("beat") ||
      text.includes("energy")
    ) {
      upbeatCount++;
    }
  }

  let recentMoodMomentum: string | undefined;
  const maxMood = Math.max(romanticCount, sadCount, chillCount, upbeatCount);
  if (maxMood >= 2) {
    if (romanticCount === maxMood) recentMoodMomentum = "Romantic";
    else if (sadCount === maxMood) recentMoodMomentum = "Melancholy";
    else if (chillCount === maxMood) recentMoodMomentum = "Chill";
    else if (upbeatCount === maxMood) recentMoodMomentum = "Energetic";
  }

  // 5. Artist Fatigue (repeated plays in recent 10 tracks)
  const artistCounts = new Map<string, number>();
  for (const t of sessionTracks.slice(0, 10)) {
    const a = (t.artist || "").toLowerCase().trim();
    if (a) {
      artistCounts.set(a, (artistCounts.get(a) || 0) + 1);
    }
  }

  const artistFatigueList: string[] = [];
  for (const [artist, count] of artistCounts.entries()) {
    if (count >= 3) {
      artistFatigueList.push(artist);
    }
  }

  // 6. Skip Aversion List
  const skipAversionList: string[] = [...skips];
  for (const h of history) {
    if (
      h.completionPercentage < 20 &&
      h.playbackDuration < 30 &&
      h.playbackDuration > 0
    ) {
      if (h.track?.videoId && !skipAversionList.includes(h.track.videoId)) {
        skipAversionList.push(h.track.videoId);
      }
    }
  }

  // 7. Novelty Tolerance
  let noveltyTolerance = 0.2; // 20% discovery standard
  if (sessionTracks.length === 0) {
    noveltyTolerance = 0.35; // higher for cold-start
  } else if (skips.length >= 3) {
    noveltyTolerance = 0.3; // user is skipping familiar things, introduce more variety
  }

  return {
    timeOfDayVibe,
    timeOfDayLabel,
    recentMoodMomentum,
    recentLanguageMomentum,
    artistFatigueList,
    skipAversionList,
    noveltyTolerance,
  };
}
