# MusicFlow V2 — Full-App Central AI Discovery Engine
*Production Architecture Specification*

---

## 1. Executive Summary

The **MusicFlow V2 AI Discovery System** elevates MusicFlow into an intelligent, personalized music discovery platform. Operating on the non-negotiable principle of **Zero Fake Music**, the engine unifies taste profiling, temporal context, session momentum, skip aversion, and catalog search into a single real-music recommendation brain.

Every recommendation across all 9 primary application surfaces (Home, Search, Explore/Browse, Genres, Moods, Artist Pages, Album Pages, Playlist Pages, and Smart Queue) originates from verifiable catalog queries with valid 11-character YouTube video IDs, complete artist metadata, and contextual natural-language explanations.

---

## 2. Non-Negotiable Core Invariants

1. **Zero Fake Entities**: The AI never fabricates songs, artists, albums, playlists, artwork, or playback IDs. Every entity is anchored in real catalog search (`searchSongs`, `getArtistDiscography`, `getAlbumTracks`).
2. **Audio Architecture Frozen**: Samsung Internet playback architecture (`hooks/useMediaSession.ts`, `lib/audio-anchor.ts`, `lib/playback-intent.ts`, `components/player/YoutubePlayer.tsx`) remains 100% untouched.
3. **No Unnecessary UI Redesign**: Existing design tokens, UI components (`SongCard`, `TrackRow`, `SafeImage`), and layout paradigms are preserved.
4. **User & Cache Isolation**: Authenticated user profiles and guest sessions are strictly isolated. No cross-account data leakage occurs.
5. **Deterministic Graceful Degradation**: If AI providers or external metadata endpoints timeout or fail, the system falls back seamlessly to deterministic heuristic rankers without user-facing errors.

---

## 3. Architectural Blueprint

```
+-----------------------------------------------------------------------------------+
|                                 APPLICATION SURFACES                              |
|   Home  |  Search  |  Explore  |  Genres  |  Moods  |  Artist  |  Album  | Playlist  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        CENTRAL DISCOVERY ENGINE (/api/ai/discovery)               |
|                                                                                   |
|  1. Context Analysis        2. Multi-Strategy Generator    3. Real Catalog Fetch  |
|     - Time-of-day vibe         - Artist Affinity              - searchSongs       |
|     - Session momentum         - Similar Artists              - Verified IDs      |
|     - Skip aversion list       - Temporal / Mood Vibes        - Thumbnail checks  |
|     - Fatigue cooldown         - Controlled Novelty           - YouTube 11-char   |
|                                                                                   |
|  4. Candidate Verifier      5. 12-Signal Ranker            6. Section Generator   |
|     - Canonical dedup          - 50/30/20 Interleaving        - Reason Badging    |
|     - Real playability         - Max 2 / Artist Limit         - Surface Layouts   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       SMART QUEUE V2 (Direct Engine Consumer)                     |
|                  Continuous, Coherent, Verified Music Playback                     |
+-----------------------------------------------------------------------------------+
```

---

## 4. Discovery Engine Pipeline Modules

The discovery engine resides in `lib/ai/discovery/`:

### 4.1 `types.ts`
Defines contracts for discovery requests, dynamic sections, candidate scoring, context analysis, and surface parameters.
- `DiscoverySectionType`: `'personalized' | 'continue_listening' | 'similar_to' | 'based_on_history' | 'because_you_like' | 'discover' | 'mood' | 'genre' | 'artist' | 'trending' | 'new_for_you' | 'daily_mix'`
- `ContextAnalysisResult`: Temporal vibe, session momentum, skip aversion list, fatigue cooldown, and novelty tolerance.

### 4.2 `context-analyzer.ts`
Analyzes listening history and in-flight session behavior:
- **Temporal Context**:
  - `05:00 - 11:59`: `energetic_morning` (Upbeat, fresh, motivating).
  - `12:00 - 17:59`: `focused_day` (Steady, rhythmic, productive).
  - `18:00 - 22:59`: `relaxed_evening` (Warm, acoustic, unwinding).
  - `23:00 - 04:59`: `late_night_calm` (Lo-fi, ambient, soft melodies).
- **Session Language Momentum**: Detects streaks in Hindi, Punjabi, Bengali, English, etc.
- **Skip Aversion**: Tracks skipped within <15s and <15% completion are penalized (-5.0 points) and blacklisted from current session recommendations.
- **Artist Fatigue**: Artists played 4+ times recently enter cooldown (-2.5 points) to prevent monotony.

### 4.3 `candidate-generator.ts`
Issues multi-angle real catalog queries:
- **Seed Types**:
  1. `artist_affinity`: Hits from user's top affinity artists.
  2. `similar_artist`: Curated catalog graph (`SIMILAR_ARTISTS` mapping 40+ key Indian & global artists).
  3. `genre_affinity`: Top genres matched against curated genre queries.
  4. `language_momentum`: Regional language queries based on session streak.
  5. `temporal_vibe`: Time-of-day queries (e.g. "late night acoustic hindi").
  6. `mood_vibe`: Contextual mood queries.
  7. `discovery_novelty`: Adjacent artists and curated hidden gems.
  8. `page_entity`: Target artist, album, or playlist seed tracks.

### 4.4 `candidate-verifier.ts`
Guarantees catalog playability and uniqueness:
- Validates 11-character alphanumeric YouTube video IDs (`/^[a-zA-Z0-9_-]{11}$/`).
- Validates non-empty title and artist.
- Enforces canonical title normalization via `normalizeTrackTitle` to strip remix/live/status pollution before deduplication.

### 4.5 `recommendation-ranker.ts`
Evaluates candidates using a 12-signal scoring formula:
$$\text{Score} = \text{Base}(5.0) + \text{Affinity}(0..5.5) + \text{Liked}(+2.5) + \text{Replay}(+2.0) - \text{Skip}(-5.0) - \text{Recent}(-3.0) - \text{Fatigue}(-2.5) + \text{Momentum}(+2.2) + \text{Context}(+1.5) + \text{TargetEntity}(+3.0) + \text{Novelty}(+1.4)$$

- **50 / 30 / 20 Interleaving**:
  - 50% High-confidence user preference (`artist_affinity`, `page_entity`, score $\ge 7.5$)
  - 30% Musical similarity (`similar_artist`, `genre_affinity`, `daily_mix`)
  - 20% Fresh discovery & novelty (`discovery_novelty`, `temporal_vibe`)
- **Artist Saturation Limit**: Strict maximum of 2 songs per artist in any section (unless it is an explicit artist discography section).

### 4.6 `explanations.ts`
Generates natural-language reason badges:
- *"Because you listen to Arijit Singh"*
- *"Similar to Diljit Dosanjh"*
- *"Matched to your late-night mood"*
- *"Replay favorite"*
- *"Discovered for your Punjabi mix"*

### 4.7 `section-generator.ts`
Constructs surface-tailored dynamic sections:
- **Home**: *Made For You*, *Because You Listen To [Top Artist]*, *Your Current Vibe*, *Daily Mix*, *Discover Something New*.
- **Browse / Explore**: *Trending For You*, *Based On Your Listening*, *Late Night Atmospheric Melodies*, *Explore Something Different*.
- **Genres**: *Recommended [Genre] For You*, *Because You Like [Artist]*, *[Genre] Deep Cuts & Gems*.
- **Moods**: Contextual vibe clustering with direct playback.
- **Artist**: *More From [Artist]*, *Fans Also Like*, *Deep Cuts*.
- **Album**: Canonical tracklist preserved intact + *More Like This Album*.
- **Playlist**: Canonical tracklist preserved intact + *Continue This Playlist* with 1-click "+ Add".

---

## 5. Surface Implementations

| Surface | Component / File | Behavior |
|---|---|---|
| **Home** | `src/components/home/HomeRecommendations.tsx` | Dynamically fetches discovery feed on mount and user signal updates; renders horizontal carousel sections with reason badges. |
| **Search** | `app/search/page.tsx`, `lib/ai/search/ai-search-service.ts` | Literal exact match strictly prioritized at top; discovery engine injects *"More Like This"* below. |
| **Explore** | `app/explore/page.tsx` | Dynamic AI Discovery sections rendered above global charts and static genre chips. |
| **Genres** | `app/genres/page.tsx` | Selecting a genre triggers dynamic discovery sub-sections tailored to the user within that genre. |
| **Moods** | `src/components/home/MoodSection.tsx` | Routes mood cards into AI Search with vibe momentum keywords. |
| **Artist** | `app/artist/[name]/page.tsx` | Full discography preserved; discovery engine appends *"Fans Also Like"* and *"Deep Cuts"*. |
| **Album** | `app/album/[id]/page.tsx` | Exact canonical album tracklist preserved; discovery engine appends *"More Like This Album"*. |
| **Playlist** | `app/playlists/[id]/page.tsx` | Canonical playlist preserved; discovery engine appends *"Continue This Playlist"* sidebar with 1-click "+ Add" button. |
| **Queue** | `lib/ai/queue/ai-smart-queue-service.ts` | Direct consumer of `getDiscoveryFeed({ currentPage: 'queue' })` with continuity constraints. |

---

## 6. Verification & Quality Assurance

- **TypeScript Compilation**: `npx tsc --noEmit` -> 0 errors.
- **ESLint**: `npm run lint` -> 0 errors, 0 warnings.
- **Turbopack Build**: `npm run build` -> Exit code 0, all 37 pages and endpoints optimized.
- **Discovery Engine Test Suite**: `scratch/test_discovery_engine.ts` -> 41 passed, 0 failed.
- **Live Surface Verification**: `scratch/verify_live_surfaces.ts` -> 7 live endpoints verified with 200 OK responses and populated real catalog tracks.
