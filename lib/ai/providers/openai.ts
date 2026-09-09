import { AIProvider, SearchIntent, UserTasteProfile, QueueRankingContext } from "../types";
import { LocalAIProvider } from "./local";
import { Track } from "@/types/music";

export class OpenAIAIProvider implements AIProvider {
  readonly name = "OpenAI-GPT";
  private fallback = new LocalAIProvider();
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async analyzeSearchIntent(
    query: string,
    context?: { recentArtists?: string[] }
  ): Promise<SearchIntent> {
    if (!this.isAvailable()) {
      return this.fallback.analyzeSearchIntent(query, context);
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `You are MusicFlow's query intent extractor. Parse music search queries into structured JSON:
{
  "artist": string or null,
  "song": string or null,
  "album": string or null,
  "genre": string or null,
  "language": string or null,
  "mood": string or null,
  "era": string or null,
  "activity": string or null,
  "intent": "music_discovery" | "specific_playback" | "artist_focus" | "mood_vibe" | "similar_tracks",
  "searchKeywords": string[],
  "explanation": string
}`,
            },
            {
              role: "user",
              content: `Query: "${query}". Recent artists: ${context?.recentArtists?.join(", ") || "none"}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        console.warn(`OpenAI API returned status ${res.status}, falling back to local NLP`);
        return this.fallback.analyzeSearchIntent(query, context);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return this.fallback.analyzeSearchIntent(query, context);

      const parsed = JSON.parse(content);
      return {
        rawQuery: query,
        artist: parsed.artist || undefined,
        song: parsed.song || undefined,
        album: parsed.album || undefined,
        genre: parsed.genre || undefined,
        language: parsed.language || undefined,
        mood: parsed.mood || undefined,
        era: parsed.era || undefined,
        activity: parsed.activity || undefined,
        intent: parsed.intent || "music_discovery",
        searchKeywords: Array.isArray(parsed.searchKeywords) && parsed.searchKeywords.length > 0
          ? parsed.searchKeywords
          : [query],
        explanation: parsed.explanation || undefined,
      };
    } catch (err) {
      console.warn("OpenAI intent analysis error, falling back to local NLP:", err);
      return this.fallback.analyzeSearchIntent(query, context);
    }
  }

  async generateRecommendationKeywords(
    profile: UserTasteProfile,
    limit: number = 4
  ): Promise<Array<{ query: string; reason: string }>> {
    return this.fallback.generateRecommendationKeywords(profile, limit);
  }

  async rankQueueCandidates(
    candidates: Track[],
    context: QueueRankingContext
  ): Promise<Track[]> {
    return this.fallback.rankQueueCandidates(candidates, context);
  }
}
