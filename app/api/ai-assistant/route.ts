import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/ytmusic";
import { Track } from "@/types/music";

export const dynamic = "force-dynamic";

interface AIAssistantResponse {
  reply: string;
  intent: "recommendation" | "playlist" | "artist_discovery" | "explanation" | "general";
  tracks: Track[];
  suggestedPlaylistTitle?: string;
  tags?: string[];
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const clean = message.toLowerCase().trim();
    let query = "Top Hit Songs";
    let reply = "Here are some handpicked tracks matching your vibe!";
    const intent: AIAssistantResponse["intent"] = "recommendation";
    let suggestedPlaylistTitle = "AI Curated Mix";
    let tags = ["curated", "vibes"];

    // Intent Matching & Smart Prompt Parsing
    if (clean.includes("drive") || clean.includes("night") || clean.includes("car")) {
      query = "Late Night Drive Hits Lofi Pop";
      reply = "Here is a smooth, atmospheric soundscape curated for late-night cruising and open roads.";
      suggestedPlaylistTitle = "Midnight Drive 🌙";
      tags = ["late-night", "driving", "chill", "atmospheric"];
    } else if (clean.includes("workout") || clean.includes("gym") || clean.includes("energy") || clean.includes("cardio")) {
      query = "High Energy Gym Workout EDM Trap";
      reply = "Turn up the intensity! Here is a high-BPM workout session packed with heavy bass and motivation.";
      suggestedPlaylistTitle = "Power Workout ⚡";
      tags = ["workout", "edm", "gym", "high-bpm"];
    } else if (clean.includes("arijit") || clean.includes("kk") || clean.includes("atif") || clean.includes("romantic") || clean.includes("love")) {
      query = "Romantic Bollywood Melodies Arijit Singh KK";
      reply = "Curated the most soulful, heartfelt melodies and timeless acoustic duets for you.";
      suggestedPlaylistTitle = "Soulful Melodies 💕";
      tags = ["romance", "bollywood", "soulful", "acoustic"];
    } else if (clean.includes("underrated") || clean.includes("indie") || clean.includes("rock")) {
      query = "Indie Rock Underrated Hits";
      reply = "Here are raw guitar riffs, passionate vocals, and fresh indie gems from breakout bands.";
      suggestedPlaylistTitle = "Indie Rock Discovery 🎸";
      tags = ["indie", "rock", "underrated", "alternative"];
    } else if (clean.includes("study") || clean.includes("focus") || clean.includes("coding") || clean.includes("work")) {
      query = "Lo-Fi Beats for Study Coding Work";
      reply = "Entering deep focus mode. Here is a soothing instrumental stream with subtle tape warmths.";
      suggestedPlaylistTitle = "Deep Focus Flow 🧠";
      tags = ["focus", "study", "lofi", "instrumental"];
    } else if (clean.includes("punjabi") || clean.includes("party") || clean.includes("bhangra")) {
      query = "Top Punjabi Party Hits AP Dhillon Diljit";
      reply = "Bringing the party alive with heavy dhol, urban trap bass, and viral Punjabi bangers!";
      suggestedPlaylistTitle = "Punjabi Party Bangers 🥁";
      tags = ["punjabi", "party", "bhangra", "dance"];
    } else if (clean.includes("relax") || clean.includes("sleep") || clean.includes("calm") || clean.includes("stress")) {
      query = "Ambient Sleep Piano Meditation Music";
      reply = "Unwind and decompress with these calming piano melodies and gentle ambient textures.";
      suggestedPlaylistTitle = "Peaceful Calm 🌊";
      tags = ["relax", "ambient", "sleep", "piano"];
    } else {
      // General prompt search translation
      query = message.replace(/give me|find me|show me|songs for|music for|playlist for|make me a/gi, "").trim() || "Trending Hits";
      reply = `I searched and tailored a session for "${message}". Enjoy the music!`;
      suggestedPlaylistTitle = `Vibe: ${message.slice(0, 20)}`;
      tags = ["personalized", "instant-mix"];
    }

    const rawTracks = await searchSongs(query);
    const tracks: Track[] = rawTracks.slice(0, 10);

    const responseData: AIAssistantResponse = {
      reply,
      intent,
      tracks,
      suggestedPlaylistTitle,
      tags,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("AI Assistant API error:", error);
    return NextResponse.json(
      {
        reply: "I encountered a hiccup while curating your mix. Here are trending tracks instead!",
        intent: "recommendation",
        tracks: [],
        tags: ["fallback"],
      },
      { status: 500 }
    );
  }
}
