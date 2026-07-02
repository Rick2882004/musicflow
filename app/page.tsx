import HomeHero from "../src/components/home/HomeHero";
import HomeRecommendations from "../src/components/home/HomeRecommendations";
import PlayerBar from "../components/player/PlayerBar";
import PopularArtists from "../src/components/home/PopularArtists";
import MoodSection from "../src/components/home/MoodSection";
export default function HomePage() {
  return (
    <div className="bg-black min-h-screen text-white">
      <main className="p-8 pb-32">
        <HomeHero />
        <PopularArtists />
        <HomeRecommendations />
        <MoodSection />
      </main>

      <PlayerBar />
    </div>
  );
}