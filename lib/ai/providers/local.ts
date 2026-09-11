import { AIProvider, SearchIntent, UserTasteProfile, QueueRankingContext } from "../types";
import { Track } from "@/types/music";
import { isValidYouTubeVideoId, normalizeTrackTitle } from "../queue/track-verifier";

export const SIMILAR_ARTISTS: Record<string, string[]> = {
  "arijit singh": ["Atif Aslam", "Mohit Chauhan", "KK", "Pritam", "Shreya Ghoshal"],
  "atif aslam": ["Arijit Singh", "KK", "Mustafa Zahid", "Pritam"],
  "kk": ["Mohit Chauhan", "Shaan", "Lucky Ali", "Sonu Nigam", "Arijit Singh"],
  "mohit chauhan": ["KK", "Lucky Ali", "Arijit Singh", "Papon"],
  "diljit dosanjh": ["AP Dhillon", "Karan Aujla", "Shubh", "Sidhu Moose Wala"],
  "ap dhillon": ["Shubh", "Karan Aujla", "Diljit Dosanjh", "Gurinder Gill"],
  "karan aujla": ["Diljit Dosanjh", "AP Dhillon", "Shubh", "Sidhu Moose Wala"],
  "shubh": ["AP Dhillon", "Karan Aujla", "Diljit Dosanjh"],
  "sidhu moose wala": ["Karan Aujla", "Diljit Dosanjh", "Amrit Maan"],
  "taylor swift": ["Gracie Abrams", "Sabrina Carpenter", "Olivia Rodrigo", "Ed Sheeran"],
  "ed sheeran": ["Shawn Mendes", "James Arthur", "Lewis Capaldi", "Taylor Swift"],
  "the weeknd": ["Post Malone", "Drake", "Dua Lipa", "Bruno Mars"],
  "drake": ["The Weeknd", "Travis Scott", "Post Malone", "Kendrick Lamar"],
  "billie eilish": ["Finneas", "Olivia Rodrigo", "Lorde", "Lana Del Rey"],
  "ariana grande": ["Dua Lipa", "Selena Gomez", "Camila Cabello"],
  "coldplay": ["OneRepublic", "Imagine Dragons", "The Script", "Maroon 5"],
  "dua lipa": ["The Weeknd", "Ariana Grande", "Bebe Rexha", "Calvin Harris"],
  "sonu nigam": ["Udit Narayan", "Kumar Sanu", "Shaan", "Abhijeet"],
  "kumar sanu": ["Udit Narayan", "Alka Yagnik", "Sonu Nigam", "Abhijeet"],
  "lata mangeshkar": ["Asha Bhosle", "Kishore Kumar", "Mohammed Rafi", "Mukesh"],
  "kishore kumar": ["Mohammed Rafi", "Mukesh", "R.D. Burman", "Asha Bhosle"],
  "shreya ghoshal": ["Sunidhi Chauhan", "Neeti Mohan", "Monali Thakur", "Arijit Singh"],
  "pritam": ["Arijit Singh", "Vishal-Shekhar", "Sachin-Jigar", "A.R. Rahman"],
  "a.r. rahman": ["Pritam", "Amit Trivedi", "Shankar-Ehsaan-Loy", "Harris Jayaraj"],
  "anirudh ravichander": ["Sid Sriram", "Yuvan Shankar Raja", "Harris Jayaraj", "Santhosh Narayanan"],
  "sid sriram": ["Anirudh Ravichander", "Haricharan", "Pradeep Kumar", "Chinmayi"],
};

const MOODS: Record<string, string[]> = {
  sad: ["sad", "heartbreak", "crying", "emotional", "dard", "tuta dil", "tears", "lonely", "sorrow", "pain"],
  romantic: ["romantic", "love", "pyaar", "ishq", "mohabat", "valentines", "sweet", "affection", "date"],
  chill: ["chill", "relax", "relaxing", "calm", "soothing", "peaceful", "unwind", "mellow", "ambient"],
  upbeat: ["upbeat", "happy", "joy", "cheerful", "positive", "bubbly", "vibrant"],
  energetic: ["energetic", "energy", "pump", "hyped", "power", "explosive", "fast", "heavy bass", "hard"],
  lofi: ["lofi", "lo-fi", "tape", "study beats", "aesthetic", "chillhop"],
  party: ["party", "dance", "club", "banger", "shaadi", "dj", "celebration", "groove"],
  focus: ["focus", "study", "concentration", "coding", "work", "reading", "brain"],
};

const LANGUAGES: Record<string, string[]> = {
  hindi: ["hindi", "bollywood", "desi"],
  punjabi: ["punjabi", "bhangra", "pollywood"],
  bengali: ["bengali", "bangla", "tollywood bangla"],
  english: ["english", "hollywood", "western", "global"],
  tamil: ["tamil", "kollywood"],
  telugu: ["telugu", "tollywood"],
  korean: ["korean", "k-pop", "kpop"],
  spanish: ["spanish", "latin", "reggaeton"],
  urdu: ["urdu", "ghazal", "qawwali", "sufi"],
};

const ERAS: Record<string, string[]> = {
  "90s": ["90s", "nineties", "1990s", "1990"],
  "80s": ["80s", "eighties", "1980s"],
  "2000s": ["2000s", "y2k", "early 2000s"],
  retro: ["retro", "vintage", "old is gold", "purane gane", "evergreen", "classic"],
};

const ACTIVITIES: Record<string, string[]> = {
  "late night drive": ["late night drive", "night drive", "driving", "cruising", "car ride", "road trip", "highway"],
  workout: ["workout", "gym", "exercise", "running", "cardio", "lifting", "fitness", "training"],
  study: ["study", "studying", "homework", "exam", "reading", "library"],
  sleep: ["sleep", "sleeping", "bedtime", "insomnia", "night"],
  party: ["party", "clubbing", "club", "dance floor", "festive"],
};

const KNOWN_ARTISTS: Record<string, string> = {
  arijit: "Arijit Singh",
  "arijit singh": "Arijit Singh",
  kk: "KK",
  atif: "Atif Aslam",
  "atif aslam": "Atif Aslam",
  "shreya ghoshal": "Shreya Ghoshal",
  shreya: "Shreya Ghoshal",
  "diljit dosanjh": "Diljit Dosanjh",
  diljit: "Diljit Dosanjh",
  "ap dhillon": "AP Dhillon",
  dhillon: "AP Dhillon",
  "taylor swift": "Taylor Swift",
  "ed sheeran": "Ed Sheeran",
  "the weeknd": "The Weeknd",
  weeknd: "The Weeknd",
  drake: "Drake",
  "billie eilish": "Billie Eilish",
  "sonu nigam": "Sonu Nigam",
  sonu: "Sonu Nigam",
  pritam: "Pritam",
  "ar rahman": "A.R. Rahman",
  rahman: "A.R. Rahman",
  anirudh: "Anirudh Ravichander",
  "sid sriram": "Sid Sriram",
  "karan aujla": "Karan Aujla",
  aujla: "Karan Aujla",
  "shubh": "Shubh",
  "sidhu moose wala": "Sidhu Moose Wala",
  "moose wala": "Sidhu Moose Wala",
  "kishore kumar": "Kishore Kumar",
  kishore: "Kishore Kumar",
  "lata mangeshkar": "Lata Mangeshkar",
  lata: "Lata Mangeshkar",
  "mohit chauhan": "Mohit Chauhan",
  "ariana grande": "Ariana Grande",
  coldplay: "Coldplay",
  dua: "Dua Lipa",
  "dua lipa": "Dua Lipa",
};

function matchesWordBoundary(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export class LocalAIProvider implements AIProvider {
  readonly name = "Local-Heuristic-ML";

  isAvailable(): boolean {
    return true;
  }

  async analyzeSearchIntent(
    query: string,
    context?: { recentArtists?: string[] }
  ): Promise<SearchIntent> {
    const clean = query.toLowerCase().trim();
    let detectedArtist: string | undefined;
    let detectedMood: string | undefined;
    let detectedLanguage: string | undefined;
    let detectedEra: string | undefined;
    let detectedActivity: string | undefined;
    let detectedGenre: string | undefined;
    let isSimilarIntent = false;

    // 1. Detect artist
    for (const [key, fullName] of Object.entries(KNOWN_ARTISTS)) {
      const regex = new RegExp(`\\b${key}\\b`, "i");
      if (regex.test(clean)) {
        detectedArtist = fullName;
        break;
      }
    }

    // Contextual artist fallback if user mentioned "similar to what I was just listening to"
    if (!detectedArtist && context?.recentArtists && context.recentArtists.length > 0) {
      if (clean.includes("similar") || clean.includes("like before") || clean.includes("what i was")) {
        detectedArtist = context.recentArtists[0];
        isSimilarIntent = true;
      }
    }

    // 2. Detect mood (strict word boundaries)
    for (const [mood, keywords] of Object.entries(MOODS)) {
      if (keywords.some((k) => matchesWordBoundary(clean, k))) {
        detectedMood = mood;
        break;
      }
    }

    // 3. Detect language (strict word boundaries)
    for (const [lang, keywords] of Object.entries(LANGUAGES)) {
      if (keywords.some((k) => matchesWordBoundary(clean, k))) {
        detectedLanguage = lang.charAt(0).toUpperCase() + lang.slice(1);
        break;
      }
    }

    // 4. Detect era (strict word boundaries)
    for (const [era, keywords] of Object.entries(ERAS)) {
      if (keywords.some((k) => matchesWordBoundary(clean, k))) {
        detectedEra = era;
        break;
      }
    }

    // 5. Detect activity (strict word boundaries)
    for (const [act, keywords] of Object.entries(ACTIVITIES)) {
      if (keywords.some((k) => matchesWordBoundary(clean, k))) {
        detectedActivity = act;
        break;
      }
    }

    let detectedSong: string | undefined;

    // Detect song entity from patterns like "similar to <song>", "songs like <song>"
    const songMatch = clean.match(/(?:similar to|more like|songs? like)\s+([a-z0-9\s]+?)(?:\s+(?:by|from)\s+|$)/i);
    if (songMatch && songMatch[1]) {
      const candidateSong = songMatch[1].trim();
      if (candidateSong && !MOODS[candidateSong] && !LANGUAGES[candidateSong] && !KNOWN_ARTISTS[candidateSong]) {
        detectedSong = candidateSong
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }

    if (clean.includes("similar") || clean.includes("more like") || clean.includes("songs like")) {
      isSimilarIntent = true;
    }

    // Infer genre with strict word boundaries
    if (matchesWordBoundary(clean, "bollywood") || (detectedLanguage === "Hindi" && !detectedGenre)) {
      detectedGenre = "Bollywood";
    } else if (matchesWordBoundary(clean, "rock") && !matchesWordBoundary(clean, "rockstar")) {
      detectedGenre = "Rock";
    } else if (matchesWordBoundary(clean, "pop")) {
      detectedGenre = "Pop";
    } else if (/\b(hip\s*hop|rap)\b/i.test(clean)) {
      detectedGenre = "Hip-Hop";
    } else if (/\b(edm|electronic)\b/i.test(clean)) {
      detectedGenre = "EDM";
    } else if (matchesWordBoundary(clean, "indie")) {
      detectedGenre = "Indie";
    } else if (matchesWordBoundary(clean, "ghazal") || matchesWordBoundary(clean, "sufi")) {
      detectedGenre = "Sufi & Ghazal";
    }

    // Determine high-level intent
    let intent: SearchIntent["intent"] = "music_discovery";
    if (isSimilarIntent) {
      intent = "similar_tracks";
    } else if (detectedArtist && !detectedMood && !detectedActivity) {
      intent = "artist_focus";
    } else if (detectedMood || detectedActivity) {
      intent = "mood_vibe";
    }

    // Construct targeted search keywords: ALWAYS preserve the user's explicit query as primary keyword
    const keywords: string[] = [];
    const cleanUserQuery = clean.replace(/^(play|search|find|give me|stream|listen to)\s+/i, "").trim() || clean;
    if (cleanUserQuery) {
      keywords.push(cleanUserQuery);
    }

    // Optional secondary terms for AI enrichment
    const searchTerms: string[] = [];
    if (detectedArtist) searchTerms.push(detectedArtist);
    if (detectedMood) searchTerms.push(detectedMood);
    if (detectedEra) searchTerms.push(detectedEra);
    if (detectedLanguage && detectedLanguage !== "English") searchTerms.push(detectedLanguage);
    if (detectedGenre && !searchTerms.includes(detectedGenre)) searchTerms.push(detectedGenre);
    if (detectedActivity && !searchTerms.includes(detectedActivity)) searchTerms.push(detectedActivity);

    const combinedTerms = searchTerms.join(" ").trim();
    if (combinedTerms && !keywords.includes(combinedTerms) && combinedTerms.toLowerCase() !== cleanUserQuery.toLowerCase()) {
      keywords.push(combinedTerms);
    }

    // Add secondary search variations
    if (detectedArtist && detectedMood) {
      const artMood = `${detectedArtist} ${detectedMood} hits`;
      if (!keywords.includes(artMood)) keywords.push(artMood);
    }
    if (detectedLanguage && detectedActivity) {
      const langAct = `${detectedLanguage} ${detectedActivity} songs`;
      if (!keywords.includes(langAct)) keywords.push(langAct);
    }
    if (detectedEra && detectedGenre) {
      const eraGenre = `${detectedEra} ${detectedGenre} hits`;
      if (!keywords.includes(eraGenre)) keywords.push(eraGenre);
    }

    // Generate natural explanation
    const parts: string[] = [];
    if (detectedMood) parts.push(detectedMood);
    if (detectedEra) parts.push(detectedEra);
    if (detectedLanguage) parts.push(detectedLanguage);
    if (detectedActivity) parts.push(`for ${detectedActivity}`);
    if (detectedArtist) parts.push(`by ${detectedArtist}`);
    if (detectedGenre && !parts.includes(detectedGenre)) parts.push(detectedGenre);

    const explanation = parts.length > 0
      ? `Curated ${parts.join(" ")} tracks`
      : `Searched for "${clean}"`;

    return {
      rawQuery: query,
      artist: detectedArtist,
      song: detectedSong,
      genre: detectedGenre,
      language: detectedLanguage,
      mood: detectedMood,
      era: detectedEra,
      activity: detectedActivity,
      intent,
      searchKeywords: keywords,
      explanation,
    };
  }

  async generateRecommendationKeywords(
    profile: UserTasteProfile,
    limit: number = 4
  ): Promise<Array<{ query: string; reason: string }>> {
    const queries: Array<{ query: string; reason: string }> = [];

    // 1. Top artist expansion
    if (profile.topArtists.length > 0) {
      const topA = profile.topArtists[0].name;
      queries.push({
        query: `${topA} Top Hits and Melodies`,
        reason: `Because you listen to ${topA}`,
      });
      if (profile.topArtists.length > 1) {
        const secondA = profile.topArtists[1].name;
        queries.push({
          query: `${secondA} Best Songs`,
          reason: `Based on your interest in ${secondA}`,
        });
      }
    }

    // 2. Genre + Mood expansion
    if (profile.topGenres.length > 0) {
      const topG = profile.topGenres[0].genre;
      const topMood = profile.preferredMoods[0] || "Chill";
      queries.push({
        query: `${topMood} ${topG} Hits`,
        reason: `Curated for your ${topG} taste`,
      });
    }

    // 3. Language preference
    if (profile.topLanguages.length > 0) {
      const topLang = profile.topLanguages[0].language;
      queries.push({
        query: `Top ${topLang} Trending Songs`,
        reason: `Trending in ${topLang}`,
      });
    }

    // Cold-start fallback
    if (queries.length === 0) {
      queries.push(
        { query: "Top Global Hits 2026", reason: "Popular worldwide" },
        { query: "Bollywood Melodies Arijit KK", reason: "Soulful timeless favorites" },
        { query: "Chill Lo-Fi Instrumental Beats", reason: "Relaxing vibes to start your day" },
        { query: "Punjabi Party Hits", reason: "High-energy bangers" }
      );
    }

    return queries.slice(0, limit);
  }

  async rankQueueCandidates(
    candidates: Track[],
    context: QueueRankingContext
  ): Promise<Track[]> {
    const { currentTrack, queue, recentVideoIds, profile, skips } = context;

    const queuedIds = new Set(queue.map((t) => t.videoId));
    if (currentTrack?.videoId) {
      queuedIds.add(currentTrack.videoId);
    }

    const currentCanonicalTitle = currentTrack ? normalizeTrackTitle(currentTrack.title) : "";
    const currentArtist = currentTrack?.artist.toLowerCase().trim() || "";
    const similarArtistsToCurrent = currentArtist && SIMILAR_ARTISTS[currentArtist]
      ? new Set(SIMILAR_ARTISTS[currentArtist].map((a) => a.toLowerCase()))
      : new Set<string>();

    const recentIds = new Set(recentVideoIds);
    const skipSet = new Set(skips);
    const artistAffinity = new Map(profile.topArtists.map((a) => [a.name.toLowerCase().trim(), a.weight]));

    // Count skips per artist to identify artist fatigue / irritation
    const artistSkipCount = new Map<string, number>();
    // Check skipped tracks
    for (const sId of skips) {
      const match = candidates.find((c) => c.videoId === sId) || queue.find((q) => q.videoId === sId);
      if (match?.artist) {
        const aKey = match.artist.toLowerCase().trim();
        artistSkipCount.set(aKey, (artistSkipCount.get(aKey) || 0) + 1);
      }
    }

    // 1. Strict Playability & VideoId Validation
    // Filter out invalid video IDs, already queued video IDs, and exact current track
    const validCandidates = candidates.filter((c) => {
      if (!c || !isValidYouTubeVideoId(c.videoId)) return false;
      if (queuedIds.has(c.videoId)) return false;
      return true;
    });

    // 2. Canonical Title Deduplication (Reject any version/remix/cover of current track)
    const filteredByTitle: Track[] = [];
    const seenCanonicalTitles = new Set<string>();
    if (currentCanonicalTitle) {
      seenCanonicalTitles.add(currentCanonicalTitle);
    }

    for (const t of validCandidates) {
      const canon = normalizeTrackTitle(t.title);
      // If candidate title duplicates current track or already seen candidate, skip it!
      if (!canon || seenCanonicalTitles.has(canon)) {
        continue;
      }
      seenCanonicalTitles.add(canon);
      filteredByTitle.push(t);
    }

    // 3. Multi-Signal Scoring
    const scored = filteredByTitle.map((track) => {
      let score = 20; // Base score
      const trackArtist = track.artist.toLowerCase().trim();

      // Signal A: Current-Track Similarity (up to +25)
      if (currentArtist && trackArtist === currentArtist) {
        // Same artist bonus (reduced by artist fatigue penalty below)
        score += 10;
      } else if (similarArtistsToCurrent.has(trackArtist)) {
        // High similarity to current artist
        score += 20;
      }

      // Signal B & C: User Taste & Artist Affinity (up to +25)
      const affinity = artistAffinity.get(trackArtist) || 0;
      score += Math.min(affinity * 2.5, 20);

      // Top genre bonus
      if (profile.topGenres.length > 0 && track.album) {
        score += 5;
      }

      // Signal D: Mood & Energy Compatibility (up to +15)
      const lowerTitle = track.title.toLowerCase();
      const isRomanticOrChill = lowerTitle.includes("love") || lowerTitle.includes("tum") || lowerTitle.includes("dil") || lowerTitle.includes("acoustic");
      if (isRomanticOrChill) {
        score += 10;
      }

      // Signal E: Completion Boost (up to +15)
      if (profile.replayTrackIds.includes(track.videoId)) {
        score += 15;
      } else if (profile.completedTrackIds.includes(track.videoId)) {
        score += 8;
      }

      // Signal F: Novelty Boost (+10)
      if (!recentIds.has(track.videoId) && !profile.completedTrackIds.includes(track.videoId)) {
        score += 10;
      }

      // --- Penalties ---
      // Penalty 1: Recent Duplicate (-20)
      if (recentIds.has(track.videoId)) {
        score -= 20;
      }

      // Penalty 2: Skip History (-20)
      if (skipSet.has(track.videoId)) {
        score -= 20;
      }

      // Penalty 3: Artist Fatigue (-15 if same artist as currently playing track)
      if (currentArtist && trackArtist === currentArtist) {
        score -= 15;
      }

      // Penalty 4: Artist Session Skip (-25 if user skipped >= 2 tracks from this artist)
      const skipsForThisArtist = artistSkipCount.get(trackArtist) || 0;
      if (skipsForThisArtist >= 2) {
        score -= 25;
      }

      return { track, score: Math.round(score * 10) / 10 };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // 4. Controlled Diversity Sequencing (Max 2 consecutive tracks from the same artist)
    const sequenced: Track[] = [];
    const remaining = [...scored];
    let lastArtist = currentArtist;
    let consecutiveCount = 1; // start assuming 1 count for currentTrack

    while (remaining.length > 0 && sequenced.length < 10) {
      // Find the best track that doesn't violate the 2-consecutive rule
      let candidateIndex = -1;

      for (let i = 0; i < remaining.length; i++) {
        const itemArtist = remaining[i].track.artist.toLowerCase().trim();
        if (itemArtist === lastArtist && consecutiveCount >= 2) {
          // Violates max 2 consecutive limit; try to find a different artist
          continue;
        }
        candidateIndex = i;
        break;
      }

      // If all remaining candidates violate the rule, take the top remaining candidate as fallback
      if (candidateIndex === -1) {
        candidateIndex = 0;
      }

      const [selected] = remaining.splice(candidateIndex, 1);
      const selArtist = selected.track.artist.toLowerCase().trim();

      if (selArtist === lastArtist) {
        consecutiveCount++;
      } else {
        lastArtist = selArtist;
        consecutiveCount = 1;
      }

      sequenced.push(selected.track);
    }

    return sequenced;
  }
}
