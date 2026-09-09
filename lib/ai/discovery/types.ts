import { Track, Album, Artist } from "@/types/music";
import { UserTasteProfile, SearchIntent } from "../types";
import { UserSignals } from "../profile/taste-profile-service";

export type DiscoverySectionType =
  | "personalized"
  | "continue_listening"
  | "similar_to"
  | "based_on_history"
  | "because_you_like"
  | "discover"
  | "mood"
  | "genre"
  | "artist"
  | "trending"
  | "new_for_you"
  | "daily_mix";

export interface DiscoverySection {
  sectionId: string;
  title: string;
  subtitle?: string;
  type: DiscoverySectionType;
  tracks: Track[];
  reason?: string;
  seeAllHref?: string;
  extraEntities?: {
    artists?: Artist[];
    albums?: Album[];
  };
}

export interface ContextAnalysisResult {
  timeOfDayVibe: "energetic_morning" | "focused_day" | "relaxed_evening" | "late_night_calm";
  timeOfDayLabel: string;
  recentMoodMomentum?: string;
  recentLanguageMomentum?: string;
  artistFatigueList: string[];
  skipAversionList: string[];
  noveltyTolerance: number;
}

export interface PageEntityContext {
  id?: string;
  name?: string;
  type?: "artist" | "album" | "playlist" | "genre" | "mood";
  artist?: string;
  tracks?: Track[];
}

export interface DiscoveryFeedParams {
  userTaste?: UserTasteProfile;
  signals?: UserSignals;
  currentTrack?: Track;
  recentTracks?: Track[];
  currentPage:
    | "home"
    | "browse"
    | "genres"
    | "moods"
    | "artist"
    | "album"
    | "playlist"
    | "queue"
    | "search";
  pageEntity?: PageEntityContext;
  searchIntent?: SearchIntent;
  context?: {
    timeOfDay?: string;
    mood?: string;
    genre?: string;
    query?: string;
  };
  limit?: number;
  userId?: string;
}

export interface DiscoveryFeedResult {
  sections: DiscoverySection[];
  tasteProfile: UserTasteProfile;
  coherenceScore?: number;
  source: "ai" | "heuristic_fallback";
}

export interface ScoredCandidate {
  track: Track;
  score: number;
  reason: string;
  seedType: string;
  matchedArtist?: string;
  matchedGenre?: string;
  matchedMood?: string;
  isNovelty?: boolean;
}
