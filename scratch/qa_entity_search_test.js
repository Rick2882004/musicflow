const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, error: e.message });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- STARTING QA AUDIT TESTS ---');
  const results = {};

  // 1. Artist Details
  console.log('\nTesting 1. Artist Details...');
  try {
    const r = await fetchJson('http://localhost:3000/api/artist?name=Arijit%20Singh');
    const artist = r.data?.artist || r.data;
    const hasSongs = artist?.songs?.length > 0;
    const hasAlbums = artist?.albums?.length > 0;
    const firstSong = artist?.songs?.[0];
    results['Artist Details'] = {
      status: hasSongs && hasAlbums ? 'PASS' : 'FAIL',
      name: artist?.name,
      songCount: artist?.songs?.length,
      albumCount: artist?.albums?.length,
      firstSong: firstSong ? { title: firstSong.title, videoId: firstSong.videoId, duration: firstSong.duration } : null
    };
  } catch (e) {
    results['Artist Details'] = { status: 'FAIL', error: e.message };
  }

  // 2. Album Details & Tracklist & Previously Unresolved Tracks
  console.log('\nTesting 2. Album Details & On-demand Resolution...');
  try {
    // Let's get an album ID from Arijit Singh
    const artistRes = await fetchJson('http://localhost:3000/api/artist?name=Arijit%20Singh');
    const artist = artistRes.data?.artist || artistRes.data;
    const albumId = artist?.albums?.[0]?.albumId;
    
    if (albumId) {
      const albRes = await fetchJson(`http://localhost:3000/api/album?id=${encodeURIComponent(albumId)}`);
      const alb = albRes.data?.album || albRes.data;
      const tracks = alb?.songs || [];
      const hasTracks = tracks.length > 0;
      const allHaveDuration = tracks.every(t => typeof t.duration === 'number' && t.duration > 0);
      const itunesTrack = tracks.find(t => t.videoId && t.videoId.startsWith('itunes-'));
      
      results['Album Details & Tracklists'] = {
        status: hasTracks ? 'PASS' : 'FAIL',
        albumName: alb?.name,
        trackCount: tracks.length,
        allHaveDuration,
        sampleTracks: tracks.slice(0, 3).map(t => ({ title: t.title, videoId: t.videoId, duration: t.duration }))
      };

      // Test On-Demand Resolution of tracks
      console.log('Testing On-demand Track Resolution (/api/resolve-track)...');
      const testTrack = itunesTrack || tracks[0];
      if (testTrack) {
        const resTrack = await fetchJson(`http://localhost:3000/api/resolve-track?title=${encodeURIComponent(testTrack.title)}&artist=${encodeURIComponent(testTrack.artist || 'Arijit Singh')}`);
        results['On-Demand Track Resolution'] = {
          status: resTrack.data?.matched && resTrack.data?.videoId ? 'PASS' : 'FAIL',
          originalTrack: testTrack.title,
          resolvedVideoId: resTrack.data?.videoId,
          matched: resTrack.data?.matched
        };
      }
    } else {
      results['Album Details & Tracklists'] = { status: 'FAIL', reason: 'No albumId found' };
    }
  } catch (e) {
    results['Album Details & Tracklists'] = { status: 'FAIL', error: e.message };
  }

  // 3. Search Queries: Exact, Partial, Typos, English, Hindi, Punjabi, Bengali, International
  console.log('\nTesting 3. Search Variations...');
  const searchQueries = [
    { query: 'Kesariya', category: 'Exact song name (Hindi)' },
    { query: 'Kesari', category: 'Partial name' },
    { query: 'Kessariya', category: 'Typo' },
    { query: 'Shape of You', category: 'English' },
    { query: 'Chaleya', category: 'Hindi' },
    { query: 'Brown Munde', category: 'Punjabi' },
    { query: 'Bojhena Shey Bojhena', category: 'Bengali' },
    { query: 'Taylor Swift', category: 'International artist' }
  ];

  for (const item of searchQueries) {
    try {
      const sRes = await fetchJson(`http://localhost:3000/api/search?q=${encodeURIComponent(item.query)}`);
      const tracks = sRes.data?.results || sRes.data?.songs || [];
      const hasResults = tracks.length > 0;
      results[`Search: ${item.category} ("${item.query}")`] = {
        status: hasResults ? 'PASS' : 'FAIL',
        matchCount: tracks.length,
        topResult: tracks[0] ? `${tracks[0].title} - ${tracks[0].artist} (${tracks[0].videoId})` : 'NONE'
      };
    } catch (e) {
      results[`Search: ${item.category} ("${item.query}")`] = { status: 'FAIL', error: e.message };
    }
  }

  // 4. Search Suggestions API
  console.log('\nTesting 4. Search Suggestions API...');
  try {
    const sugRes = await fetchJson('http://localhost:3000/api/search/suggestions?q=Arijit');
    const suggestions = sugRes.data || [];
    results['Search Suggestions'] = {
      status: Array.isArray(suggestions) && suggestions.length > 0 ? 'PASS' : 'FAIL',
      count: suggestions.length,
      sample: suggestions.slice(0, 3)
    };
  } catch (e) {
    results['Search Suggestions'] = { status: 'FAIL', error: e.message };
  }

  // 5. Lyrics API (Available, Unavailable, Instrumental)
  console.log('\nTesting 5. Lyrics API...');
  try {
    // Normal track lyrics test
    const lyRes = await fetchJson('http://localhost:3000/api/lyrics?videoId=BddP6PYo2gs');
    results['Lyrics API: Known Track'] = {
      status: lyRes.status === 200 ? 'PASS' : 'FAIL',
      hasLyrics: !!(lyRes.data?.lyrics && lyRes.data.lyrics.length > 0),
      linesSample: lyRes.data?.lyrics?.slice(0, 3)
    };

    // Instrumental or unknown videoId
    const lyUnk = await fetchJson('http://localhost:3000/api/lyrics?videoId=invalid_video_id_xyz');
    results['Lyrics API: Unknown / Instrumental Fallback'] = {
      status: lyUnk.status === 200 && (!lyUnk.data?.lyrics || lyUnk.data.lyrics.length === 0) ? 'PASS' : 'FAIL',
      response: lyUnk.data
    };
  } catch (e) {
    results['Lyrics API'] = { status: 'FAIL', error: e.message };
  }

  // 6. PWA Manifest & Service Worker
  console.log('\nTesting 6. PWA Manifest & SW file...');
  try {
    const manRes = await fetchJson('http://localhost:3000/manifest.json');
    const swRes = await new Promise((res) => {
      http.get('http://localhost:3000/sw.js', (r) => res({ status: r.statusCode, type: r.headers['content-type'] }));
    });
    results['PWA Manifest'] = {
      status: manRes.status === 200 && manRes.data?.name ? 'PASS' : 'FAIL',
      name: manRes.data?.name,
      display: manRes.data?.display,
      start_url: manRes.data?.start_url
    };
    results['PWA Service Worker file'] = {
      status: swRes.status === 200 ? 'PASS' : 'FAIL',
      contentType: swRes.type
    };
  } catch (e) {
    results['PWA Assets'] = { status: 'FAIL', error: e.message };
  }

  console.log('\n--- AUTOMATED API RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

runTests();
