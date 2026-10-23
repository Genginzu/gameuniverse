"use client";

/**
 * EditorialNavigationProvider : adapter that feeds the Navigation Model
 * (`resolveNavigation`) with the live location, auth state, memberships and
 * next-intl, then exposes it to every editorial renderer through context.
 *
 * The query string is read by a sibling inside its own Suspense boundary:
 * `useSearchParams` would otherwise opt the whole statically rendered page
 * out of SSR. Until it reports, the model is resolved without query.
 */

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { EditorialNavigationContext } from "@/hooks/useEditorialNavigation";
import { useMyCommunities } from "@/hooks/useMyCommunities";
import { useMyGroups } from "@/hooks/useMyGroups";
import { resolveNavigation } from "@/lib/navigation";

function SearchParamsListener({ onChange }: { onChange: (search: string) => void }) {
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  useEffect(() => onChange(search), [search, onChange]);
  return null;
}

export function EditorialNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const t = useTranslations("editorial");
  const { user } = useAuth();
  const { groups, isLoading: groupsLoading } = useMyGroups();
  const { communities, isLoading: communitiesLoading } = useMyCommunities();

  const model = useMemo(
    () =>
      resolveNavigation(
        {
          pathname,
          search,
          isAuthenticated: Boolean(user),
          memberships: {
            groups: { items: groups, isLoading: groupsLoading },
            communities: { items: communities, isLoading: communitiesLoading },
          },
        },
        (key) => t(key as Parameters<typeof t>[0])
      ),
    [pathname, search, user, groups, groupsLoading, communities, communitiesLoading, t]
  );

  return (
    <EditorialNavigationContext.Provider value={model}>
      <Suspense fallback={null}>
        <SearchParamsListener onChange={setSearch} />
      </Suspense>
      {children}
    </EditorialNavigationContext.Provider>
  );
}
