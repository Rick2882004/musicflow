import { AIProvider, SearchIntent, UserTasteProfile, QueueRankingContext } from "../types";
import { LocalAIProvider } from "./local";
import { Track } from "@/types/music";

export class GeminiAIProvider implements AIProvider {
  readonly name = "Google-Gemini";
  private fallback = new LocalAIProvider();
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
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
      const prompt = `You are an expert music metadata and recommendation parser for MusicFlow.
Analyze this music search query: "${query}".
User recently listened to artists: ${context?.recentArtists?.join(", ") || "none"}.

Return a strictly valid JSON object matching this schema:
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
  "searchKeywords": string[] (2-3 targeted search queries to find real matching songs in YouTube Music catalog),
  "explanation": string (A short, user-facing summary, e.g. "Sad romantic songs by Arijit Singh")
}
Do not return Markdown or conversational text, only valid JSON.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) {
        console.warn(`Gemini API returned status ${res.status}, falling back to local NLP`);
        return this.fallback.analyzeSearchIntent(query, context);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return this.fallback.analyzeSearchIntent(query, context);
      }

      const parsed = JSON.parse(rawText);
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
      console.warn("Gemini intent analysis error, falling back to local NLP:", err);
      return this.fallback.analyzeSearchIntent(query, context);
    }
  }

  async generateRecommendationKeywords(
    profile: UserTasteProfile,
    limit: number = 4
  ): Promise<Array<{ query: string; reason: string }>> {
    // For fast, deterministic performance, use local rule-based seed generation
    return this.fallback.generateRecommendationKeywords(profile, limit);
  }

  async rankQueueCandidates(
    candidates: Track[],
    context: QueueRankingContext
  ): Promise<Track[]> {
    // Local multi-signal scoring provides instant low-latency transition ranking
    return this.fallback.rankQueueCandidates(candidates, context);
  }
}
