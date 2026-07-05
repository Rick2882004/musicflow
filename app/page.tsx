import HomeHero from "../src/components/home/HomeHero";
import HomeRecommendations from "../src/components/home/HomeRecommendations";
import MoodSection from "../src/components/home/MoodSection";
import PopularArtists from "../src/components/home/PopularArtists";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Animated Greeting & Hero Header */}
      <HomeHero />

      {/* Popular Artists Circle Grid */}
      <PopularArtists />

      {/* Recommended, Trending, Made For You, Albums sections */}
      <HomeRecommendations />

      {/* Category / Mood triggers */}
      <MoodSection />
    </div>
  );
}