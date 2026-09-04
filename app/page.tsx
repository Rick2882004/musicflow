import HomeHero from "../src/components/home/HomeHero";
import HomeRecommendations from "../src/components/home/HomeRecommendations";
import MoodSection from "../src/components/home/MoodSection";

export default function HomePage() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* 1. Greeting & Continue Listening / Quick Picks */}
      <HomeHero />

      {/* 2. Top Songs Today, Trending, Albums, Artists & New Releases */}
      <HomeRecommendations />

      {/* 3. Genres & Moods */}
      <MoodSection />
    </div>
  );
}