import { Track } from "@/types/music";

export interface SearchIntent {
  rawQuery: string;
  artist?: string;
  song?: string;
  album?: string;
  genre?: string;
  language?: string;
  mood?: string;
  era?: string;
  activity?: string;
  popularity?: "popular" | "underground" | "any";
  similarityTarget?: string;
  intent: "music_discovery" | "specific_playback" | "artist_focus" | "mood_vibe" | "similar_tracks";
  searchKeywords: string[];
  explanation?: string;
}

export interface UserTasteProfile {
  topArtists: Array<{ name: string; weight: number }>;
  topGenres: Array<{ genre: string; weight: number }>;
  topLanguages: Array<{ language: string; weight: number }>;
  preferredMoods: string[];
  preferredEras: string[];
  skippedTrackIds: string[];
  completedTrackIds: string[];
  replayTrackIds: string[];
  totalInteractions: number;
}

export interface ScoredRecommendation extends Track {
  score: number;
  recommendationReason: string;
  matchSignals: {
    artistAffinity: number;
    genreAffinity: number;
    moodAffinity: number;
    noveltyScore: number;
    repetitionPenalty: number;
  };
}

export interface QueueRankingContext {
  currentTrack?: Track;
  queue: Track[];
  recentVideoIds: string[];
  profile: UserTasteProfile;
  skips: string[];
}

export interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  analyzeSearchIntent(
    query: string,
    context?: { recentArtists?: string[] }
  ): Promise<SearchIntent>;
  generateRecommendationKeywords(
    profile: UserTasteProfile,
    limit?: number
  ): Promise<Array<{ query: string; reason: string }>>;
  rankQueueCandidates(
    candidates: Track[],
    context: QueueRankingContext
  ): Promise<Track[]>;
}
