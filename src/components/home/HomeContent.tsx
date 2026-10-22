"use client";

/**
 * HomeContent : orchestration de la page d'accueil.
 *
 * Le landing visiteur est rendu par défaut (HTML serveur + premier paint,
 * page ISR sans cookies). Une fois l'auth résolue côté client, un
 * utilisateur connecté bascule sur `HomeDashboard` : un bref flash du
 * landing est accepté pour garder l'ISR.
 */

import { useAuth } from "@/hooks/useAuth";
import type { HomeApiResponse } from "@/types/home";
import { HomeDashboard } from "./HomeDashboard";
import { HomeLanding } from "./HomeLanding";

interface HomeContentProps {
  /** Données hydratées server-side via /api/home (ISR 5 min). */
  initialHomeData?: HomeApiResponse;
}

export function HomeContent({ initialHomeData }: HomeContentProps) {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <HomeDashboard initialData={initialHomeData} />;
  }

  return <HomeLanding data={initialHomeData} />;
}
