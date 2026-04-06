import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingStats } from "./LandingStats";
import { LandingCta } from "./LandingCta";

/**
 * Landing page content — orchestrates the 4 gaming-styled sections.
 * Server component: each section handles its own client boundary.
 */
export function LandingContent() {
  return (
    <>
      <LandingHero />
      <LandingFeatures />
      <LandingStats />
      <LandingCta />
    </>
  );
}
