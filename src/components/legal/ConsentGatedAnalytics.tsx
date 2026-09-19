"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/**
 * Mounts Vercel Analytics and Speed Insights only after the user has
 * consented to the "analytics" category. Renders nothing otherwise, so no
 * measurement script loads before consent.
 */
export function ConsentGatedAnalytics() {
  const { categories } = useCookieConsent();

  if (!categories.analytics) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
