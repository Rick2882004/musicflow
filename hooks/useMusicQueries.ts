import { useQuery } from "@tanstack/react-query";
import { Track } from "@/types/music";

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return { results: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search request failed");
      return res.json() as Promise<{ results: Track[] }>;
    },
    enabled: Boolean(query.trim()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useArtistQuery(artistName: string) {
  return useQuery({
    queryKey: ["artist", artistName],
    queryFn: async () => {
      if (!artistName.trim()) return null;
      const res = await fetch(`/api/artist?name=${encodeURIComponent(artistName)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(artistName.trim()),
    staleTime: 10 * 60 * 1000,
  });
}

export function useLyricsQuery(videoId: string) {
  return useQuery({
    queryKey: ["lyrics", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.lyrics || null;
    },
    enabled: Boolean(videoId),
    staleTime: 15 * 60 * 1000,
  });
}

export function useRecommendationsQuery(query: string = "Bollywood Hits") {
  return useQuery({
    queryKey: ["recommendations", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.results || []) as Track[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
