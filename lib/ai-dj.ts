export interface DJMessage {
  text: string;
  query: string;
}

export function getDJResponse(prompt: string, favoriteArtist: string = "Arijit Singh"): DJMessage {
  const query = prompt.toLowerCase();

  if (query.includes("relax") || query.includes("chill") || query.includes("lofi") || query.includes("slow")) {
    return {
      text: `🎙️ "Hey! Let's dial down the energy. I've curated a soothing lo-fi and acoustic instrumental playlist to help you unwind."`,
      query: "lofi chill ambient study beats",
    };
  }

  if (query.includes("gym") || query.includes("energetic") || query.includes("workout") || query.includes("power")) {
    return {
      text: `🎙️ "Time to push your limits! I'm loading a high-octane mix of electronic, EDM, and phonk tracks to power up your session."`,
      query: "workout high energy EDM gaming phonk",
    };
  }

  if (query.includes("romantic") || query.includes("love") || query.includes("romance")) {
    return {
      text: `🎙️ "Love is in the air. Here's a selection of premium romantic ballads and soft melodies inspired by ${favoriteArtist}."`,
      query: `${favoriteArtist} romantic songs love hits`,
    };
  }

  if (query.includes("retro") || query.includes("90s") || query.includes("classic")) {
    return {
      text: `🎙️ "Nostalgia time! I'm cueing up some legendary 90s classic hits and retro blockbusters."`,
      query: "90s classic pop hits retro",
    };
  }

  return {
    text: `🎙️ "I've analyzed your taste profile. Here is a custom personal mix tailored around ${favoriteArtist}. Let's play!"`,
    query: `${favoriteArtist} latest music hits radio`,
  };
}
