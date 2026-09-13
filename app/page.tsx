import HomeHero from "../src/components/home/HomeHero";
import HomeRecommendations from "../src/components/home/HomeRecommendations";
import { SmartMixesSection } from "@/components/mixes/SmartMixesSection";

export default function HomePage() {
  return (
    <div className="space-y-4 md:space-y-6 pb-12">
      {/* 1. Greeting & Continue Listening / Quick Picks */}
      <HomeHero />

      {/* 2. Smart Mixes (AI Crafted) */}
      <SmartMixesSection />

      {/* 3. Personalized Home V2 Sections */}
      <HomeRecommendations />
    </div>
  );
}