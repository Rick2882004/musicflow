import { executeAISearch } from "../lib/ai/search/ai-search-service";
import { searchSongs, searchAlbums as ytSearchAlbums } from "../lib/ytmusic";
import { searchCanonicalArtists, searchCanonicalAlbums } from "../lib/canonical-music";
import { LocalAIProvider } from "../lib/ai/providers/local";

const queries = [
  "Rockstar",
  "Arijit Singh",
  "Kesariya",
  "Tum Hi Ho",
  "Bengali songs",
  "Punjabi songs",
  "Taylor Swift",
  "The Weeknd",
  "Blinding Lights", // random real song title
  "Dua Lipa",        // random real artist name
];

async function runAudit() {
  console.log("================================================================================");
  console.log("                 SEARCH REGRESSION AUDIT - DETAILED RUN                         ");
  console.log("================================================================================\n");

  const localAI = new LocalAIProvider();

  for (const q of queries) {
    console.log(`\n================================================================================`);
    console.log(`QUERY: "${q}"`);
    console.log(`================================================================================`);

    // 1. Check AI Intent Analysis
    const intent = await localAI.analyzeSearchIntent(q);
    console.log("\n[1] AI Intent Analysis (LocalAIProvider):");
    console.log("  - Detected Artist:", intent.artist || "none");
    console.log("  - Detected Genre :", intent.genre || "none");
    console.log("  - Detected Mood  :", intent.mood || "none");
    console.log("  - Detected Lang  :", intent.language || "none");
    console.log("  - Intent Type    :", intent.intent);
    console.log("  - SearchKeywords :", JSON.stringify(intent.searchKeywords));
    console.log("  - Explanation    :", intent.explanation);

    // 2. Run Current Search Path (app/search/page.tsx -> /api/ai/search -> executeAISearch)
    const tStartAI = Date.now();
    let aiRes: any = null;
    let aiErr: any = null;
    try {
      aiRes = await executeAISearch(q);
    } catch (e: any) {
      aiErr = e.message;
    }
    const tEndAI = Date.now();
    const aiLatency = tEndAI - tStartAI;

    console.log("\n[2] Current Search Path (app/search/page.tsx calls executeAISearch):");
    console.log(`  - Latency: ${aiLatency}ms`);
    if (aiErr) {
      console.log("  - Error:", aiErr);
    } else {
      console.log(`  - Songs Count  : ${aiRes.results?.length || 0}`);
      console.log(`  - Artists Count: ${aiRes.artists?.length || 0}`);
      console.log(`  - Albums Count : ${aiRes.albums?.length || 0}`);
      console.log(`  - Top 3 Songs  :`, (aiRes.results || []).slice(0, 3).map((s: any) => `"${s.title}" by ${s.artist} (id: ${s.videoId}, dur: ${s.duration})`));
      console.log(`  - Top 2 Artists:`, (aiRes.artists || []).slice(0, 2).map((a: any) => `"${a.name}" (id: ${a.artistId || a.browseId})`));
      console.log(`  - Top 2 Albums :`, (aiRes.albums || []).slice(0, 2).map((a: any) => `"${a.name}" by ${typeof a.artist === 'object' ? a.artist?.name : a.artist} (id: ${a.albumId})`));
    }

    // 3. Run Direct /api/search Path (Raw catalog search)
    const tStartDirect = Date.now();
    const [rawSongsRes, rawArtistsRes, rawAlbumsRes] = await Promise.allSettled([
      searchSongs(q),
      searchCanonicalArtists(q),
      searchCanonicalAlbums(q),
    ]);
    const tEndDirect = Date.now();
    const directLatency = tEndDirect - tStartDirect;

    const rawSongs = rawSongsRes.status === "fulfilled" ? rawSongsRes.value : [];
    const rawArtists = rawArtistsRes.status === "fulfilled" ? rawArtistsRes.value : [];
    const rawAlbums = rawAlbumsRes.status === "fulfilled" ? rawAlbumsRes.value : [];

    console.log("\n[3] Direct Catalog Search Path (/api/search route):");
    console.log(`  - Latency: ${directLatency}ms`);
    console.log(`  - Songs Count  : ${rawSongs.length}`);
    console.log(`  - Artists Count: ${rawArtists.length}`);
    console.log(`  - Albums Count : ${rawAlbums.length}`);
    console.log(`  - Top 3 Songs  :`, rawSongs.slice(0, 3).map((s: any) => `"${s.title}" by ${s.artist} (id: ${s.videoId}, dur: ${s.duration})`));
    console.log(`  - Top 2 Artists:`, rawArtists.slice(0, 2).map((a: any) => `"${a.name}" (id: ${a.artistId})`));
    console.log(`  - Top 2 Albums :`, rawAlbums.slice(0, 2).map((a: any) => `"${a.name}" by ${typeof a.artist === 'object' ? a.artist?.name : a.artist} (id: ${a.albumId})`));

    // 4. Pre-Purge Album Search comparison (ytSearchAlbums directly vs searchCanonicalAlbums)
    const [oldAlbumsRes] = await Promise.allSettled([
      ytSearchAlbums(q),
    ]);
    const oldAlbums = oldAlbumsRes.status === "fulfilled" ? oldAlbumsRes.value : [];
    console.log("\n[4] Pre-Purge Album Comparison (ytSearchAlbums directly):");
    console.log(`  - Old ytSearchAlbums Count: ${oldAlbums.length}`);
    console.log(`  - New searchCanonicalAlbums Count: ${rawAlbums.length}`);
    if (oldAlbums.length > 0) {
      console.log(`  - Old Albums Sample:`, oldAlbums.slice(0, 2).map((a: any) => `"${a.name}" by ${a.artist} (id: ${a.albumId})`));
    }

    // Comparison summary for this query
    console.log("\n[5] Comparison & Degradation Assessment:");
    const normQ = q.toLowerCase().trim();
    const aiTopSong = aiRes?.results?.[0]?.title?.toLowerCase().trim();
    const directTopSong = rawSongs[0]?.title?.toLowerCase().trim();
    const aiExactMatch = aiTopSong === normQ || aiTopSong?.includes(normQ);
    const directExactMatch = directTopSong === normQ || directTopSong?.includes(normQ);
    console.log(`  - AI Search top song match: "${aiRes?.results?.[0]?.title}" (matches query: ${aiExactMatch})`);
    console.log(`  - Direct Search top song match: "${rawSongs[0]?.title}" (matches query: ${directExactMatch})`);
    if (intent.searchKeywords[0] && intent.searchKeywords[0].toLowerCase() !== normQ) {
      console.log(`  - !!! AI REWROTE QUERY !!! "${q}" -> "${intent.searchKeywords[0]}"`);
    }
  }
}

runAudit().catch(console.error);
