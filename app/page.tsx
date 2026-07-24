import HomeHero from "../src/components/home/HomeHero";
import HomeRecommendations from "../src/components/home/HomeRecommendations";
import MoodSection from "../src/components/home/MoodSection";
import PopularArtists from "../src/components/home/PopularArtists";
import PersonalizedMixes from "../src/components/home/PersonalizedMixes";

export default function HomePage() {
  return (
    <div className="space-y-14">
      {/* 1. Animated Greeting & Hero Header */}
      <HomeHero />

      {/* 2. Personalized Mixes (Daily Mix, Weekly Discover, Most Played) */}
      <PersonalizedMixes />

      {/* 3. Popular Artists Circle Grid */}
      <PopularArtists />

      {/* 4. Recommended, Trending, Made For You, Albums sections */}
      <HomeRecommendations />

      {/* 5. Moods & Dynamic Collections */}
      <MoodSection />
    </div>
  );
}