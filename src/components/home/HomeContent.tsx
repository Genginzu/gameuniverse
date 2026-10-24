"use client";

/**
 * HomeContent : orchestration de la page d'accueil.
 *
 * The page is ISR (no cookies), so the server always renders the visitor
 * landing. To avoid flashing it for logged-in users, an inline script in the
 * root layout flags `<html data-auth-hint>` when a Supabase session cookie
 * exists: while auth is loading, CSS then hides the landing and shows a dark
 * dashboard skeleton from the very first paint.
 */

import { useAuth } from "@/hooks/useAuth";
import { useAuthCookieHint } from "@/hooks/useAuthCookieHint";
import type { HomeApiResponse } from "@/types/home";
import { HomeDashboard } from "./HomeDashboard";
import { HomeDashboardSkeleton } from "./HomeDashboardSkeleton";
import { HomeLanding } from "./HomeLanding";

const HIDDEN_WHEN_HINTED = "[html[data-auth-hint]_&]:hidden";
const VISIBLE_WHEN_HINTED = "hidden [html[data-auth-hint]_&]:block";

interface HomeContentProps {
  /** Données hydratées server-side via /api/home (ISR 5 min). */
  initialHomeData?: HomeApiResponse;
}

export function HomeContent({ initialHomeData }: HomeContentProps) {
  const { user, loading } = useAuth();
  const hinted = useAuthCookieHint();

  if (!loading && user) {
    return <HomeDashboard user={user} initialData={initialHomeData} />;
  }

  if (loading && hinted) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <>
      <div className={loading ? HIDDEN_WHEN_HINTED : undefined} data-testid="home-landing-wrapper">
        <HomeLanding data={initialHomeData} />
      </div>
      {loading && <HomeDashboardSkeleton className={VISIBLE_WHEN_HINTED} />}
    </>
  );
}
