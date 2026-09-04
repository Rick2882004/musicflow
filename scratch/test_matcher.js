const http = require("https");

function normalize(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTrackTitle(rawTitle) {
  let s = rawTitle || "";
  // Strip common YouTube fluff
  s = s.replace(/\[(?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song).*?\]/gi, "");
  s = s.replace(/\((?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song|slowed|reverb).*?\)/gi, "");
  // Strip trailing | ...
  s = s.replace(/\s*\|.*$/, "");
  // Strip (From "...") or (From '...')
  s = s.replace(/\(from\s+["'][^"']+["']\)/gi, "");
  // Strip featuring clauses for search query
  s = s.replace(/\b(?:feat\.?|ft\.?)\s+[^(\[-]*/gi, "");
  // Remove redundant hyphens
  s = s.replace(/\s+-\s+.*$/, (match) => {
    // only if the remainder looks like movie name or artist
    if (match.length > 20 || /video|song|audio/i.test(match)) return "";
    return match;
  });
  return s.trim();
}

function cleanArtistName(rawArtist) {
  let a = rawArtist || "";
  // Remove " - Topic", " VEVO"
  a = a.replace(/\s*-\s*topic/gi, "");
  a = a.replace(/\s*vevo/gi, "");
  // Split multiple artists by comma, &, ft., feat.
  return a.trim();
}

function calculateMatchScore(queryTitle, queryArtist, itunesTrack) {
  const normQTitle = normalize(cleanTrackTitle(queryTitle));
  const normQArtist = normalize(cleanArtistName(queryArtist));

  const normITitle = normalize(itunesTrack.trackName || "");
  const normIArtist = normalize(itunesTrack.artistName || "");
  const normIAlbum = normalize(itunesTrack.collectionName || "");

  // Check Remix mismatch: if one has remix and the other does not, heavy penalty
  const qHasRemix = /\bremix\b/i.test(queryTitle);
  const iHasRemix = /\bremix\b/i.test(itunesTrack.trackName || "") || /\bremix\b/i.test(itunesTrack.collectionName || "");
  if (qHasRemix !== iHasRemix) {
    return 0.1; // reject
  }

  // Check Live mismatch: if one has live and the other does not, heavy penalty
  const qHasLive = /\blive\b/i.test(queryTitle);
  const iHasLive = /\blive\b/i.test(itunesTrack.trackName || "") || /\blive\b/i.test(itunesTrack.collectionName || "");
  if (qHasLive !== iHasLive) {
    return 0.1; // reject
  }

  let titleScore = 0;
  if (normITitle === normQTitle) {
    titleScore = 1.0;
  } else if (normITitle.includes(normQTitle) || normQTitle.includes(normITitle)) {
    titleScore = 0.85;
  } else {
    // Word overlap
    const qWords = normQTitle.split(" ").filter(w => w.length > 1);
    const iWords = normITitle.split(" ").filter(w => w.length > 1);
    if (qWords.length > 0) {
      const matchedWords = qWords.filter(w => iWords.includes(w));
      titleScore = matchedWords.length / Math.max(qWords.length, iWords.length);
    }
  }

  let artistScore = 0;
  if (normIArtist === normQArtist) {
    artistScore = 1.0;
  } else if (normIArtist.includes(normQArtist) || normQArtist.includes(normIArtist)) {
    artistScore = 0.9;
  } else {
    // Check if any primary artist word matches
    const qArtists = normQArtist.split(/[\s,&]+/).filter(w => w.length > 2);
    const iArtists = normIArtist.split(/[\s,&]+/).filter(w => w.length > 2);
    const matched = qArtists.filter(w => iArtists.includes(w));
    if (matched.length > 0) {
      artistScore = 0.75;
    }
  }

  // Final score weighted: 60% title, 40% artist
  const finalScore = titleScore * 0.6 + artistScore * 0.4;
  return { finalScore, titleScore, artistScore };
}

async function searchItunes(title, artist) {
  const cleanedTitle = cleanTrackTitle(title);
  const cleanedArtist = cleanArtistName(artist);
  const query = `${cleanedTitle} ${cleanedArtist}`.trim();
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;

  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.results || []);
        } catch {
          resolve([]);
        }
      });
    }).on("error", () => resolve([]));
  });
}

async function test() {
  const testCases = [
    { title: 'Kesariya (From "Brahmastra") [Official Video]', artist: 'Arijit Singh, Pritam' },
    { title: 'Tum Hi Ho', artist: 'Arijit Singh' },
    { title: 'Blinding Lights (Official Audio)', artist: 'The Weeknd' },
    { title: 'Starboy (feat. Daft Punk)', artist: 'The Weeknd' },
    { title: 'Levitating [Remix]', artist: 'Dua Lipa' },
    { title: 'Hotel California - Live On MTV, 1994', artist: 'Eagles' }
  ];

  for (const tc of testCases) {
    const results = await searchItunes(tc.title, tc.artist);
    console.log(`\n--- Test: "${tc.title}" by "${tc.artist}" ---`);
    console.log(`Found ${results.length} results from iTunes:`);
    for (const r of results.slice(0, 3)) {
      const score = calculateMatchScore(tc.title, tc.artist, r);
      console.log(`  Candidate: "${r.trackName}" by "${r.artistName}"`);
      console.log(`  Album: "${r.collectionName}"`);
      console.log(`  High-Res Artwork: ${r.artworkUrl100 ? r.artworkUrl100.replace('/100x100bb.jpg', '/600x600bb.jpg') : 'N/A'}`);
      console.log(`  Score: ${score.finalScore?.toFixed(2)} (Title: ${score.titleScore?.toFixed(2)}, Artist: ${score.artistScore?.toFixed(2)})`);
    }
  }
}

test();
