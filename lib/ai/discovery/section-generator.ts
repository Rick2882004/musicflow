import { Track } from "@/types/music";
import { UserTasteProfile } from "../types";
import {
  ContextAnalysisResult,
  DiscoverySection,
  PageEntityContext,
  ScoredCandidate,
} from "./types";

export function generatePageSections(
  page: string,
  candidates: ScoredCandidate[],
  userTaste: UserTasteProfile,
  contextAnalysis: ContextAnalysisResult,
  pageEntity?: PageEntityContext
): DiscoverySection[] {
  const sections: DiscoverySection[] = [];
  const topArtistName = userTaste.topArtists[0]?.name;
  const topGenre = userTaste.topGenres[0]?.genre || "Bollywood";

  // Helper to extract tracks
  const getTracks = (
    predicate: (c: ScoredCandidate) => boolean,
    limit: number = 8
  ): Track[] => {
    const matched = candidates.filter(predicate).map((c) => c.track);
    return matched.slice(0, limit);
  };

  const usedVideoIds = new Set<string>();
  const getUniqueTracks = (
    predicate: (c: ScoredCandidate) => boolean,
    limit: number = 8
  ): Track[] => {
    const selected: Track[] = [];
    for (const c of candidates) {
      if (usedVideoIds.has(c.track.videoId)) continue;
      if (predicate(c)) {
        usedVideoIds.add(c.track.videoId);
        selected.push(c.track);
        if (selected.length >= limit) break;
      }
    }
    return selected;
  };

  if (page === "home") {
    // 1. Made For You
    const madeForYouTracks = getUniqueTracks((c) => c.score >= 6.0, 10);
    if (madeForYouTracks.length >= 3) {
      sections.push({
        sectionId: "home-made-for-you",
        title: "Made For You",
        subtitle: "Personalized",
        type: "personalized",
        tracks: madeForYouTracks,
        reason: "Picked from your listening taste",
        seeAllHref: "/explore",
      });
    }

    // 2. Because You Listen To [Top Artist]
    if (topArtistName) {
      const becauseYouListenTracks = getUniqueTracks(
        (c) =>
          c.seedType === "artist_affinity" ||
          c.seedType === "similar_artist" ||
          (c.track.artist || "").toLowerCase().includes(topArtistName.toLowerCase()),
        8
      );
      if (becauseYouListenTracks.length >= 3) {
        sections.push({
          sectionId: "home-because-you-listen",
          title: `Because you listen to ${topArtistName}`,
          subtitle: "Artist Affinity",
          type: "because_you_like",
          tracks: becauseYouListenTracks,
          reason: `Mix of ${topArtistName} and similar musical styles`,
          seeAllHref: `/artist/${encodeURIComponent(topArtistName)}`,
        });
      }
    }

    // 3. Your Current Vibe
    const vibeTracks = getUniqueTracks(
      (c) => c.seedType === "temporal_vibe" || c.seedType === "mood_vibe",
      8
    );
    if (vibeTracks.length >= 3) {
      sections.push({
        sectionId: "home-current-vibe",
        title: contextAnalysis.timeOfDayLabel,
        subtitle: "Atmosphere",
        type: "mood",
        tracks: vibeTracks,
        reason: "Tuned to your current listening session vibe",
      });
    }

    // 4. Daily Mix / Regional Mix
    const mixTracks = getUniqueTracks(
      (c) => c.seedType === "daily_mix" || c.seedType === "language_momentum",
      8
    );
    if (mixTracks.length >= 3) {
      const mixTitle = contextAnalysis.recentLanguageMomentum
        ? `Your ${contextAnalysis.recentLanguageMomentum} Mix`
        : `Your ${topGenre} Mix`;
      sections.push({
        sectionId: "home-daily-mix",
        title: mixTitle,
        subtitle: "Curated Mix",
        type: "daily_mix",
        tracks: mixTracks,
        reason: "A focused cluster matching your frequent genres",
      });
    }

    // 5. Discover Something New
    const discoveryTracks = getUniqueTracks(
      (c) => c.seedType === "discovery_novelty" || c.isNovelty === true,
      8
    );
    if (discoveryTracks.length >= 3) {
      sections.push({
        sectionId: "home-discover-new",
        title: "Discover Something New",
        subtitle: "Fresh Horizons",
        type: "discover",
        tracks: discoveryTracks,
        reason: "Controlled discovery beyond your regular rotation",
      });
    }
  } else if (page === "browse") {
    // 1. Trending For You
    const trendingTracks = getUniqueTracks(() => true, 10);
    if (trendingTracks.length >= 3) {
      sections.push({
        sectionId: "browse-trending-for-you",
        title: "Trending For You",
        subtitle: "Live Discoveries",
        type: "trending",
        tracks: trendingTracks,
        reason: "High velocity tracks matched with your listening taste",
      });
    }

    // 2. Based On Your Listening
    if (topArtistName) {
      const historyBasedTracks = getUniqueTracks(
        (c) => c.seedType === "artist_affinity" || c.seedType === "similar_artist",
        8
      );
      if (historyBasedTracks.length >= 3) {
        sections.push({
          sectionId: "browse-based-on-history",
          title: "Based On Your Listening",
          subtitle: "Recommendations",
          type: "based_on_history",
          tracks: historyBasedTracks,
          reason: `Echoes your favorite artists and genres`,
        });
      }
    }

    // 3. Late Night Picks / Time Vibe
    const temporalTracks = getUniqueTracks((c) => c.seedType === "temporal_vibe", 8);
    if (temporalTracks.length >= 3) {
      sections.push({
        sectionId: "browse-late-night",
        title: contextAnalysis.timeOfDayLabel,
        subtitle: "Mood",
        type: "mood",
        tracks: temporalTracks,
        reason: "Tailored to this time of day",
      });
    }

    // 4. Explore Something Different
    const differentTracks = getUniqueTracks((c) => c.isNovelty === true, 8);
    if (differentTracks.length >= 3) {
      sections.push({
        sectionId: "browse-explore-different",
        title: "Explore Something Different",
        subtitle: "Discovery",
        type: "discover",
        tracks: differentTracks,
        reason: "Hidden gems and fresh sounds outside the mainstream",
      });
    }
  } else if (page === "genres") {
    const genreName = pageEntity?.name || "Bollywood";

    // 1. Recommended [Genre] For You
    const recGenreTracks = getUniqueTracks((c) => c.seedType === "page_entity", 8);
    if (recGenreTracks.length >= 3) {
      sections.push({
        sectionId: `genre-rec-${genreName.toLowerCase()}`,
        title: `Recommended ${genreName} For You`,
        subtitle: `${genreName} Selection`,
        type: "personalized",
        tracks: recGenreTracks,
        reason: `Curated ${genreName} hits tailored to your listening taste`,
      });
    }

    // 2. Because You Like [Artist in Genre]
    if (topArtistName) {
      const artistGenreTracks = getUniqueTracks((c) => c.seedType === "artist_affinity", 8);
      if (artistGenreTracks.length >= 3) {
        sections.push({
          sectionId: `genre-artist-${genreName.toLowerCase()}`,
          title: `Because You Like ${topArtistName}`,
          subtitle: "Artist Focus",
          type: "because_you_like",
          tracks: artistGenreTracks,
          reason: `${genreName} hits from and similar to ${topArtistName}`,
        });
      }
    }

    // 3. Mood or Deep Cuts
    const deepCutsTracks = getUniqueTracks(() => true, 8);
    if (deepCutsTracks.length >= 3) {
      sections.push({
        sectionId: `genre-deepcuts-${genreName.toLowerCase()}`,
        title: `${genreName} Deep Cuts & Gems`,
        subtitle: "Unexplored",
        type: "discover",
        tracks: deepCutsTracks,
        reason: `Sublime lesser-known tracks from ${genreName}`,
      });
    }
  } else if (page === "moods") {
    const moodName = pageEntity?.name || "Chill";
    const moodTracks = getUniqueTracks(() => true, 10);
    if (moodTracks.length >= 3) {
      sections.push({
        sectionId: `mood-${moodName.toLowerCase()}`,
        title: `${moodName} Flow For You`,
        subtitle: "Vibe Session",
        type: "mood",
        tracks: moodTracks,
        reason: `Intelligently ranked for ${moodName.toLowerCase()} momentum`,
      });
    }
  } else if (page === "artist") {
    const artistName = pageEntity?.name || "Artist";

    // 1. More From This Artist
    const artistTracks = getTracks(
      (c) => (c.track.artist || "").toLowerCase().includes(artistName.toLowerCase()),
      8
    );
    if (artistTracks.length >= 2) {
      sections.push({
        sectionId: "artist-more-from",
        title: `More From ${artistName}`,
        subtitle: "Discography",
        type: "artist",
        tracks: artistTracks,
        reason: `Top tracks and features by ${artistName}`,
      });
    }

    // 2. Similar Artists & Collaborations
    const similarTracks = getTracks(
      (c) => !(c.track.artist || "").toLowerCase().includes(artistName.toLowerCase()),
      8
    );
    if (similarTracks.length >= 3) {
      sections.push({
        sectionId: "artist-similar",
        title: "Fans Also Like",
        subtitle: "Musical Neighbors",
        type: "similar_to",
        tracks: similarTracks,
        reason: `Artists and styles closely aligned with ${artistName}`,
      });
    }
  } else if (page === "album") {
    const albumTracks = getTracks(() => true, 8);
    if (albumTracks.length >= 3) {
      sections.push({
        sectionId: "album-more-like-this",
        title: "More Like This Album",
        subtitle: "Musical Continuum",
        type: "similar_to",
        tracks: albumTracks,
        reason: "Sounds, styles, and eras harmonious with this album",
      });
    }
  } else if (page === "playlist") {
    const continueTracks = getTracks(() => true, 8);
    if (continueTracks.length >= 3) {
      sections.push({
        sectionId: "playlist-continue",
        title: "Continue This Playlist",
        subtitle: "Smart Continuation",
        type: "continue_listening",
        tracks: continueTracks,
        reason: "Verified tracks matching the mood and artists of your playlist",
      });
    }
  } else if (page === "queue") {
    const queueTracks = getTracks(() => true, 10);
    sections.push({
      sectionId: "queue-continuation",
      title: "Up Next From Discovery",
      type: "continue_listening",
      tracks: queueTracks,
      reason: "Seamless transition matching your session",
    });
  }

  return sections;
}
