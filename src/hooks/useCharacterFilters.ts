"use client";

import useSWR from "swr";
import type { RoleFilterOption } from "@/types/character";
import type { PlatformFilterOption } from "@/types/platform";
import type { UseCharacterFiltersReturn } from "@/types/hooks";

interface RolesResponse {
  roles: RoleFilterOption[];
}

interface PlatformsResponse {
  platforms: PlatformFilterOption[];
}

/**
 * Hook SWR pour les options de filtrage de la page personnages (rôles + plateformes).
 * Deux clés SWR indépendantes → cache séparé, fetch parallèle.
 *
 * Les données sont stables (rarement modifiées) donc on désactive la revalidation au focus.
 */
export function useCharacterFilters(locale: string): UseCharacterFiltersReturn {
  const { data: rolesData, isLoading: rolesLoading } = useSWR<RolesResponse>(
    `/api/roles?locale=${locale}`,
    { revalidateOnFocus: false }
  );

  const { data: platformsData, isLoading: platformsLoading } = useSWR<PlatformsResponse>(
    `/api/platforms?locale=${locale}`,
    { revalidateOnFocus: false }
  );

  return {
    roles: rolesData?.roles ?? [],
    platforms: platformsData?.platforms ?? [],
    rolesLoading,
    platformsLoading,
  };
}
