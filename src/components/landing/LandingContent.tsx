"use client";

import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingStats } from "./LandingStats";
import { LandingCta } from "./LandingCta";

/**
 * Landing page content — orchestrates the 4 gaming-styled sections.
 * Each section is extracted into its own sub-component for maintainability.
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
