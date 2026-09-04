const http = require("https");

function normalizeString(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['"’`]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(raw) {
  if (!raw) return "";
  let s = raw;
  // Strip common YouTube bracket/parenthesis tags
  s = s.replace(/\[(?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song|slowed|reverb|teaser|trailer).*?\]/gi, "");
  s = s.replace(/\((?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song|slowed|reverb|teaser|trailer).*?\)/gi, "");
  // Strip trailing | ...
  s = s.replace(/\s*\|.*$/, "");
  // Strip (From "...") or (From '...')
  s = s.replace(/\(from\s+["'][^"']+["']\)/gi, "");
  s = s.replace(/\(from\s+[^)]+\)/gi, "");
  // Strip feat / ft inside parentheses or standalone
  s = s.replace(/\((?:feat\.?|ft\.?)\s+[^)]*\)/gi, "");
  s = s.replace(/\b(?:feat\.?|ft\.?)\s+[^(\[-]*/gi, "");
  // If there is " - " followed by movie or channel name, strip it if long
  s = s.replace(/\s+-\s+.*$/, (match) => {
    if (/video|audio|lyric|song|soundtrack|ost/i.test(match) || match.length > 25) return "";
    return match;
  });
  return s.trim();
}

function cleanArtist(raw) {
  if (!raw) return "";
  let a = raw;
  a = a.replace(/\s*-\s*topic/gi, "");
  a = a.replace(/\s*vevo/gi, "");
  a = a.replace(/\[.*?\]/g, "");
  return a.trim();
}

function calculateMatchScore(queryTitle, queryArtist, queryAlbum, itunesTrack) {
  const qTitleClean = cleanTitle(queryTitle);
  const qArtistClean = cleanArtist(queryArtist);

  const normQTitle = normalizeString(qTitleClean);
  const normQArtist = normalizeString(qArtistClean);
  const normQAlbum = queryAlbum ? normalizeString(queryAlbum) : "";

  const normITitle = normalizeString(itunesTrack.trackName || "");
  const normIArtist = normalizeString(itunesTrack.artistName || "");
  const normIAlbum = normalizeString(itunesTrack.collectionName || "");

  // 1. Tag mismatch penalties
  const checkTagMismatch = (tag) => {
    const qHas = new RegExp(`\\b${tag}\\b`, "i").test(queryTitle);
    const iHas = new RegExp(`\\b${tag}\\b`, "i").test(itunesTrack.trackName || "") ||
                 new RegExp(`\\b${tag}\\b`, "i").test(itunesTrack.collectionName || "");
    if (qHas !== iHas) {
      return true; // mismatch
    }
    return false;
  };

  const sensitiveTags = ["remix", "live", "acoustic", "instrumental", "piano", "cover", "karaoke", "lullaby", "tribute"];
  for (const tag of sensitiveTags) {
    if (checkTagMismatch(tag)) {
      return { score: 0.15, reason: `mismatched tag: ${tag}` };
    }
  }

  // 2. Title matching
  let titleScore = 0;
  if (normITitle === normQTitle) {
    titleScore = 1.0;
  } else if (normITitle.startsWith(normQTitle) || normQTitle.startsWith(normITitle)) {
    titleScore = 0.92;
  } else if (normITitle.includes(normQTitle) || normQTitle.includes(normITitle)) {
    titleScore = 0.85;
  } else {
    // Word overlap (Jaccard on non-stop words)
    const stopWords = new Set(["the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "from", "with", "by"]);
    const qWords = normQTitle.split(" ").filter(w => w.length > 1 && !stopWords.has(w));
    const iWords = normITitle.split(" ").filter(w => w.length > 1 && !stopWords.has(w));
    if (qWords.length > 0 && iWords.length > 0) {
      const common = qWords.filter(w => iWords.includes(w));
      const jaccard = common.length / new Set([...qWords, ...iWords]).size;
      titleScore = jaccard;
    }
  }

  // 3. Artist matching
  let artistScore = 0;
  if (normIArtist === normQArtist) {
    artistScore = 1.0;
  } else if (normIArtist.includes(normQArtist) || normQArtist.includes(normIArtist)) {
    artistScore = 0.90;
  } else {
    // Check individual artist tokens (e.g. "Arijit Singh" in "Pritam, Arijit Singh & Amitabh Bhattacharya")
    const qTokens = normQArtist.split(/[\s,&]+/).filter(w => w.length > 2);
    const iTokens = normIArtist.split(/[\s,&]+/).filter(w => w.length > 2);
    if (qTokens.length > 0 && iTokens.length > 0) {
      const matched = qTokens.filter(t => iTokens.includes(t));
      artistScore = matched.length / qTokens.length >= 0.5 ? 0.80 : (matched.length / qTokens.length) * 0.7;
    }
  }

  // 4. Album bonus
  let albumBonus = 0;
  if (normQAlbum && normIAlbum) {
    if (normIAlbum === normQAlbum || normIAlbum.includes(normQAlbum) || normQAlbum.includes(normIAlbum)) {
      albumBonus = 0.1;
    }
  }

  const finalScore = Math.min(1.0, titleScore * 0.65 + artistScore * 0.35 + albumBonus);
  return { score: finalScore, titleScore, artistScore, albumBonus };
}

async function searchITunesSong(title, artist, album) {
  const cleanT = cleanTitle(title);
  const cleanA = cleanArtist(artist);
  const q = `${cleanT} ${cleanA}`.trim();
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=6`;

  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const results = parsed.results || [];
          let bestMatch = null;
          let bestScore = 0;

          for (const item of results) {
            const res = calculateMatchScore(title, artist, album, item);
            if (res.score > bestScore) {
              bestScore = res.score;
              bestMatch = { item, score: res.score, details: res };
            }
          }

          if (bestMatch && bestScore >= 0.60) {
            const rawArt = bestMatch.item.artworkUrl100 || "";
            const artwork600 = rawArt.replace(/\/100x100bb\.jpg$/, "/600x600bb.jpg");
            const artwork1000 = rawArt.replace(/\/100x100bb\.jpg$/, "/1000x1000bb.jpg");
            resolve({
              matched: true,
              score: bestScore,
              trackName: bestMatch.item.trackName,
              artistName: bestMatch.item.artistName,
              albumName: bestMatch.item.collectionName,
              artworkUrl: artwork600 || rawArt,
              highResArtworkUrl: artwork1000 || artwork600 || rawArt,
              thumbnailUrl: rawArt,
              releaseDate: bestMatch.item.releaseDate,
              releaseYear: bestMatch.item.releaseDate ? new Date(bestMatch.item.releaseDate).getFullYear() : undefined,
              genre: bestMatch.item.primaryGenreName,
              itunesTrackId: bestMatch.item.trackId,
              itunesCollectionId: bestMatch.item.collectionId,
            });
          } else {
            resolve({ matched: false, score: bestScore });
          }
        } catch (e) {
          resolve({ matched: false, error: e.message });
        }
      });
    }).on("error", (e) => resolve({ matched: false, error: e.message }));
  });
}

async function run() {
  const cases = [
    { title: "Kesariya", artist: "Arijit Singh" },
    { title: "Tum Hi Ho", artist: "Arijit Singh" },
    { title: "Blinding Lights", artist: "The Weeknd" },
    { title: "Espresso", artist: "Sabrina Carpenter" },
    { title: "Shape of You", artist: "Ed Sheeran" },
    { title: "Despacito", artist: "Luis Fonsi" },
    { title: "Bekhayali", artist: "Sachet Tandon" },
    { title: "Random Nonexistent Song XYYZZ123", artist: "Nobody" }
  ];

  for (const c of cases) {
    const res = await searchITunesSong(c.title, c.artist);
    console.log(`\nQuery: "${c.title}" - "${c.artist}"`);
    console.log(`Matched: ${res.matched} | Score: ${res.score?.toFixed(2)}`);
    if (res.matched) {
      console.log(`  Track: ${res.trackName} | Artist: ${res.artistName}`);
      console.log(`  Album: ${res.albumName} (${res.releaseYear})`);
      console.log(`  Art 600: ${res.artworkUrl}`);
    }
  }
}

run();
