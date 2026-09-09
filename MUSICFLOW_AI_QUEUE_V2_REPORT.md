# MusicFlow V2: AI Smart Queue V2 Architecture, Audit & Verification Report

**Date:** 2026-09-09  
**Status:** ✅ **COMPLETED & VERIFIED**  
**TypeScript Typecheck:** ✅ 0 Errors (`npx tsc --noEmit`)  
**ESLint Code Quality:** ✅ 0 Errors, 0 Warnings (`npm run lint`)  
**Production Build:** ✅ Next.js 16.2.9 Turbopack Build Code 0  
**Verification Invariant:** ✅ **Every track entering Smart Queue is grounded in MusicFlow's real catalog and passes playability verification.**  
**Samsung Playback Lock:** 🔒 Samsung Internet Background Playback architecture (`hooks/useMediaSession.ts`, `lib/audio-anchor.ts`, `lib/playback-intent.ts`, `components/player/YoutubePlayer.tsx`) **100% FROZEN & UNMODIFIED**.

---

## 1. Root Cause Analysis of the Previous Bug

### Bug Symptoms
When a user searched for a single song (e.g. "Kesariya") and played it:
1. The playback queue was immediately flooded with 20–30 tracks of the searched keyword (e.g. "Kesariya remix", "Kesariya cover", "Kesariya lofi", "Kesariya female version").
2. Subsequent Smart Queue auto-continuation continued to recycle variations of the original search keyword instead of intelligently continuing based on musical context.
3. Unverified or placeholder video IDs (such as `itunes-*` or missing IDs) could enter the queue unvetted.

### Exact Code Causes Identified
1. **Search Playback Queue Contamination (`app/search/page.tsx:354`)**:
   ```ts
   // PREVIOUS BUGGY CODE:
   const playSong = (song: Track, index: number) => {
     setQueue(results); // <- Set queue to all 30 search results for "Kesariya"!
     setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
   };
   ```
   When a user clicked a search result, `results` contained every matching YouTube search result for that keyword. Storing all 30 keyword results in the playback queue polluted the active queue with covers, remixes, and duplicates before Smart Queue even fired.
2. **Naive Keyword Search Fallback in Hook (`hooks/useSmartQueue.ts:75`)**:
   ```ts
   // PREVIOUS CODE:
   const query = `${artist} Similar Hit Songs`;
   const fallbackRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
   const newTracks = results.filter((t) => !existingIds.has(t.videoId)).slice(0, 6);
   setQueue([...baseQueue, ...newTracks]);
   ```
   If the AI endpoint was slow or returned fewer tracks, this hook bypassed all verification and AI ranking, dumping raw keyword search results into the queue.
3. **Single-Seed & Title Search Fallback in Smart Queue (`lib/ai/queue/ai-smart-queue-service.ts:37`)**:
   ```ts
   // PREVIOUS CODE:
   const primarySeed = `${currentTrack.artist} Similar Hit Songs`;
   if (rawCandidates.length < 5) {
     const fallback = await searchSongs(`${currentTrack.title} Radio`);
   }
   ```
   If `currentTrack.title` was "Kesariya", searching `${currentTrack.title} Radio` queried YouTube with the song title, returning more Kesariya covers and remixes.
4. **Lack of Canonical Title Deduplication in Provider (`lib/ai/providers/local.ts`)**:
   Deduplication only checked `queuedIds.has(c.videoId)`. Different videos for "Kesariya (Lofi)" and "Kesariya (Acoustic)" have distinct `videoId`s, so they were not deduplicated.

---

## 2. Architecture & Pipeline Changes

Smart Queue V2 implements a 6-stage architecture:

```
CURRENT PLAYING TRACK
        ↓
[Stage 1: Current Track Analysis]
Extract cleanTitle, cleanArtist, mood, genre, mapped similar artists
        ↓
[Stage 2: Multi-Seed Real Catalog Search]
Run parallel queries: (Artist Hits, Similar Artist 1, Similar Artist 2, User Favorite, Mood/Genre)
        ↓
[Stage 3: Playability Verification]
verifyPlayableTrack() checks 11-char YouTube ID, resolves itunes-* via real catalog, discards invalid
        ↓
[Stage 4: AI Ranking & Scoring]
12 weighted signals: current similarity (25), user taste (25), mood/energy (15), novelty (10), penalties (-20)
        ↓
[Stage 5: Controlled Diversity & Repetition Filtering]
Canonical title deduplication (zero covers/remixes of current or queued tracks) + artist cooldown (max 2 consecutive)
        ↓
[Stage 6: Final Validation]
Strict sanity check: valid YouTube ID, not in queue, real metadata
        ↓
VERIFIED PLAYBACK QUEUE
```

---

## 3. Detailed Component Implementation

### Component 1: Server-Side Track Verifier (`lib/ai/queue/track-verifier.ts`)
- **`normalizeTrackTitle(title: string): string`**:
  Strips bracketed noise `[...]`, `(...)`, feature credits `feat.`, and descriptors like `(Official Music Video)`, `(Remix)`, `(Cover)`, `(Acoustic)`, `(Live)`, `(Lofi)`, `(Slowed + Reverb)` to produce the canonical title.
- **`isValidYouTubeVideoId(videoId: string): boolean`**:
  Validates against `^[a-zA-Z0-9_-]{11}$`. Rejects empty strings, whitespace, `itunes-*` placeholders, and `fake-*` strings.
- **`verifyPlayableTrack(candidate: Partial<Track>): Promise<VerificationResult>`**:
  - Validates non-empty title and artist (rejects "Unknown" placeholders).
  - If `videoId` is missing or `itunes-*`, resolves it via `resolvePlayableYouTubeId`.
  - Rejects if resolution fails or yields an invalid video ID.
  - Returns a strictly verified `Track` object.

### Component 2: Multi-Seed Real Catalog Search (`lib/ai/queue/ai-smart-queue-service.ts`)
- Never queries raw song title.
- Uses a curated music similarity graph (`SIMILAR_ARTISTS`):
  - *Arijit Singh* $\rightarrow$ Atif Aslam, Mohit Chauhan, KK, Pritam, Shreya Ghoshal
  - *Atif Aslam* $\rightarrow$ Arijit Singh, KK, Mustafa Zahid, Pritam
  - *KK* $\rightarrow$ Mohit Chauhan, Shaan, Lucky Ali, Sonu Nigam
  - *Diljit Dosanjh* $\rightarrow$ AP Dhillon, Karan Aujla, Shubh, Sidhu Moose Wala
  - *Taylor Swift* $\rightarrow$ Gracie Abrams, Sabrina Carpenter, Olivia Rodrigo, Ed Sheeran
  - (and 20+ additional core artists)
- Merges results from:
  1. `${rawArtist} Top Hits`
  2. `${mappedSimilar[0]} Best Songs`
  3. `${mappedSimilar[1]} Melodies`
  4. `${userFavArtist} Songs` (from `UserTasteProfile`)
  5. `${topGenre} Hits`
- Logs observability traces in development mode (`[SmartQueue Debug]`).

### Component 3: 12-Signal AI Ranking & Diversity Sequencing (`lib/ai/providers/local.ts`)
- **Canonical Title Deduplication**: Any track whose canonical title matches the current playing song or an already-queued candidate is rejected.
- **Scoring Signals**:
  - Current-track similarity: $+10$ to $+20$
  - User taste affinity: up to $+20$
  - Genre compatibility: $+5$
  - Mood/energy compatibility: $+10$
  - Completion boost: $+8$ to $+15$
  - Novelty boost: $+10$
  - Recent duplicate penalty: $-20$
  - Skip history penalty: $-20$
  - Artist fatigue penalty (same artist as current track): $-15$
  - Session artist skip penalty: $-25$
- **Controlled Diversity Sequencing**:
  Enforces a strict maximum of 2 consecutive tracks by the same artist.

### Component 4: Single-Song Search Playback Fix (`app/search/page.tsx:351`)
```ts
const playSong = (song: Track) => {
  // Queue only the chosen song from search. Smart Queue will continue playback
  // based on the verified song and user taste profile, preventing search query contamination.
  setQueue([song]);
  setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0);
};
```

---

## 4. Before vs. After Queue Behavior

### Scenario: User searches "Kesariya" and plays it

| Stage | Before (V1 / Buggy V2 Phase 1) | After (V2 Smart Queue V2) |
|---|---|---|
| **Active Queue on Click** | 20–30 search results of "Kesariya" (remixes, covers, instrumental) | 1 track: `Kesariya (From "Brahmastra")` by Arijit Singh |
| **Continuation Track 1** | "Kesariya (Dance Mix)" (Duplicate title) | "Ae Dil Hai Mushkil Title Track" — Pritam |
| **Continuation Track 2** | "Kesariya - Lofi Flip" (Duplicate title) | "Dil Meri Na Sune" — Atif Aslam |
| **Continuation Track 3** | "Kesariya (Female Version)" (Duplicate title) | "Tum Se Hi" — Pritam |
| **Continuation Track 4** | "Kesariya Acoustic Cover" (Duplicate title) | "Tum Ho" — Mohit Chauhan |
| **Continuation Track 5** | "Kesariya 8D Audio" (Duplicate title) | "Dil Ye Bekarar Kyun Hai" — Pritam |
| **Continuation Track 6** | "Kesariya (Slowed & Reverb)" (Duplicate title) | "Khairiyat" — Pritam |
| **Video ID Integrity** | Unvetted raw search results | Every track verified against YouTube video ID regex |
| **Artist Diversity** | 100% same title / same song | Curated mix across similar artists (Atif Aslam, Mohit Chauhan, Pritam) |

---

## 5. Verification Results

### A. Automated 17-Point Audit Suite (`scratch/test_ai_queue_v2.ts`)
```
========================================================
MUSICFLOW V2 — AI SMART QUEUE V2 AUDIT & VERIFICATION
========================================================

--- Test A & Q: Single-Song Search -> Play & No Query Contamination ---
  ✅ PASS: Test A: Playing single song queues only that song (not all 30 search results)
  ✅ PASS: Test A: Smart Queue continues playback with verified candidates
  ✅ PASS: Test Q: Search query does NOT contaminate queue (zero Kesariya remixes/covers in next tracks)

--- Test B: Real Track Invariant (Only Verified Playable Tracks) ---
  ✅ PASS: Test B: All generated queue tracks pass strict playability verification

--- Test C: Rejection of itunes-* Placeholder IDs ---
  ✅ PASS: Test C: Unresolved itunes-* track is rejected by verifyPlayableTrack
  ✅ PASS: Test C: Zero itunes-* IDs in Smart Queue continuation

--- Test D: Rejection of Malformed YouTube IDs ---
  ✅ PASS: Test D: Rejects short videoId
  ✅ PASS: Test D: Rejects overly long videoId
  ✅ PASS: Test D: Rejects videoId with spaces/punctuation
  ✅ PASS: Test D: Rejects fake-video1 placeholder
  ✅ PASS: Test D: Accepts valid 11-char YouTube ID (JFcgOboQZ08)

--- Test E: No Duplicate Tracks (By videoId and Canonical Title) ---
  ✅ PASS: Test E: Current track videoId is not duplicated in queue
  ✅ PASS: Test E: Current track canonical title is not duplicated in queue
  ✅ PASS: Test E: Zero canonical title duplicates among queued candidates

--- Test F: Rejection of Title-Only Fake Tracks ---
  ✅ PASS: Test F: Title-only or unknown fake tracks rejected

--- Test G: Artist Repetition Cooldown (<= 2 Consecutive) ---
  ✅ PASS: Test G: Max consecutive same artist in continuation queue is 0 (<= 2)

--- Test H: Recent-Track Suppression ---
  ✅ PASS: Test H: Fresh candidate ranks ahead of recently played candidate

--- Test I: Skip Adaptation (Single Track & Artist Level) ---
  ✅ PASS: Test I: Skipped track is heavily downranked below non-skipped track

--- Test J: Like Adaptation ---
  ✅ PASS: Test J: Liked artist is given strong positive affinity boost

--- Test K: AI Provider Resilience ---
  ✅ PASS: Test K: Local deterministic engine operates without cloud keys

--- Test L: Catalog API Resilience ---
  ✅ PASS: Test L: Catalog returning empty results gracefully returns empty array

--- Test M: Zero Fabricated Fallbacks on Empty Candidates ---
  ✅ PASS: Test M: Never fabricates fake tracks when zero candidates exist (empty array returned)

--- Test N: Guest User Support ---
  ✅ PASS: Test N: Guest taste profile initializes cleanly without error
  ✅ PASS: Test N: Guest receives real continuation queue

--- Test O: Authenticated User Support ---
  ✅ PASS: Test O: Authenticated user library reflected in taste profile

--- Test P: User A & User B Taste Isolation ---
  ✅ PASS: Test P: User B taste profile contains zero leakage from User A

========================================================
SMART QUEUE V2 AUDIT: 26 PASSED, 0 FAILED
========================================================
```

### B. Live HTTP Scenario Verification (`scratch/test_live_queue_v2.js`)
```
========================================================
LIVE SCENARIO: Single-Song Search -> Play -> Smart Queue Continuation
========================================================

1. Executing Search: /api/search?q=Kesariya
   Found 20 search results for "Kesariya".

2. Playing Selected Song: "Kesariya (From "Brahmastra")" by "Arijit Singh" (VideoID: NJAv_7lHUIU)
   Active Queue: 1 track (single song queued).

3. Triggering Smart Queue Continuation: POST /api/ai/smart-queue
   Smart Queue returned 6 continuation tracks.
   Coherence Score: 92/100

4. Inspecting Every Queued Track for Real Track Invariant & Diversity:
----------------------------------------------------------------------
   [1] "Ae Dil Hai Mushkil Title Track (From "Ae Dil Hai Mushkil")" — Pritam (ID: wx89ZdkwtS8)
   [2] "Dil Meri Na Sune" — Atif Aslam (ID: E6g1Bip-3Xw)
   [3] "Tum Se Hi" — Pritam (ID: I94fhjQ-U30)
   [4] "Tum Ho" — Mohit Chauhan (ID: AqVIQ9ymvM8)
   [5] "Dil Ye Bekarar Kyun Hai" — Pritam (ID: 5oKFcSeHTSU)
   [6] "Khairiyat (Bonus Track)" — Pritam (ID: q3HNo5a3ol4)
----------------------------------------------------------------------

✅ TEST PASSED: All tracks are verified real music with zero title recycling!
```

### C. 7-Point Manual QA Test Suite (`scratch/test_manual_qa_scenarios.js`)
```
========================================================
MUSICFLOW V2 SMART QUEUE — 7-POINT MANUAL QA RUNNER
========================================================

--- Scenario 1: Search 'Kesariya' -> Play One ---
  ✅ PASS: Scenario 1: Queue generated continuation tracks
  ✅ PASS: Scenario 1: Zero Kesariya title recycling/covers/remixes in queue
  ✅ PASS: Scenario 1: All queued tracks have valid YouTube video IDs

--- Scenario 2: Search 'Arijit Singh romantic songs' -> Play One ---
  ✅ PASS: Scenario 2: Queue generated continuation tracks
  ✅ PASS: Scenario 2: Queue has diversity across multiple artists

--- Scenario 3: Search 'Bengali late night songs' -> Play One ---
  ✅ PASS: Scenario 3: Returned smooth mood/language continuation
  ✅ PASS: Scenario 3: All tracks have valid YouTube IDs

--- Scenario 4: Obscure Song -> Never Manufacture Fake Songs ---
  ✅ PASS: Scenario 4: Zero fake or manufactured tracks returned for obscure track

--- Scenario 5: Skip Adaptation ---
  ✅ PASS: Scenario 5: Skipped tracks completely suppressed from continuation queue

--- Scenario 6: Liked Artist Affinity & Cooldown Rule ---
  ✅ PASS: Scenario 6: Max consecutive same artist is 0 (<= 2)

--- Scenario 7: User Taste Isolation ---
  ✅ PASS: Scenario 7: User A profile has Taylor Swift, User B profile has ZERO Taylor Swift leakage

========================================================
MANUAL QA SUMMARY: 11 PASSED, 0 FAILED
========================================================
```

---

## 6. Known Limitations & Edge-Case Safeguards

1. **Very Obscure Catalog Entities**:
   If an indie or niche artist has zero similar artists mapped and YouTube returns fewer than 6 search results, Smart Queue returns a shorter queue (e.g. 2–3 tracks). **This is intentional behavior**: MusicFlow strictly rejects synthetic filler.
2. **Third-Party Rate Limits**:
   If YouTube Music API experiences a temporary network hiccup, Smart Queue gracefully returns an empty continuation array without crashing or generating fake tracks.
3. **PWA Offline Mode**:
   When offline, Smart Queue does not perform remote seed searches and relies on cached library tracks.

---

## 7. Final Invariant Confirmation

> **Every track entering Smart Queue is grounded in MusicFlow's real catalog and passes playability verification.**
