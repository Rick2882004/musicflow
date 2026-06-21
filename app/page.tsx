import HomeHero from "../src/components/home/HomeHero";
import HomeRecommendations from "../src/components/home/HomeRecommendations";
import PlayerBar from "@/components/player/PlayerBar";

export default function HomePage() {
  return (
    <div className="bg-black min-h-screen text-white">
      <main className="p-8 pb-32">
        <HomeHero />
        <HomeRecommendations />
      </main>

      <PlayerBar />
    </div>
  );
}