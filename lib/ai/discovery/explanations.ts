export interface ExplanationParams {
  matchedArtist?: string;
  sourceArtist?: string;
  matchedGenre?: string;
  matchedLanguage?: string;
  matchedMood?: string;
  isLiked?: boolean;
  isReplay?: boolean;
  isDiscovery?: boolean;
  timeOfDayVibe?: string;
}

export function generateExplanation(params: ExplanationParams): string {
  const {
    matchedArtist,
    sourceArtist,
    matchedGenre,
    matchedLanguage,
    matchedMood,
    isLiked,
    isReplay,
    isDiscovery,
    timeOfDayVibe,
  } = params;

  if (isLiked) {
    return "From your Liked Songs collection";
  }

  if (isReplay) {
    return "A favorite in your frequent rotation";
  }

  if (matchedArtist && sourceArtist && matchedArtist.toLowerCase() !== sourceArtist.toLowerCase()) {
    return `Because you listen to ${sourceArtist}`;
  }

  if (matchedArtist) {
    return `Because you listen to ${matchedArtist}`;
  }

  if (matchedLanguage) {
    return `Popular in your ${matchedLanguage} favorites`;
  }

  if (matchedMood) {
    return `Matched to your ${matchedMood.toLowerCase()} vibe`;
  }

  if (timeOfDayVibe === "late_night_calm") {
    return "Late night atmospheric pick";
  } else if (timeOfDayVibe === "energetic_morning") {
    return "Your morning energy boost";
  } else if (timeOfDayVibe === "relaxed_evening") {
    return "Evening wind-down selection";
  }

  if (matchedGenre) {
    return `Popular in ${matchedGenre}`;
  }

  if (isDiscovery) {
    return "A fresh pick outside your usual rotation";
  }

  return "Picked from your listening taste";
}
