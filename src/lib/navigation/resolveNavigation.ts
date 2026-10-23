import type {
  NavigationInput,
  NavigationModel,
  NavLink,
  NavLinkDefinition,
  NavMembership,
  NavMembershipDefinition,
  NavPublicEntry,
  NavSpace,
  NavSpaceDefinition,
  NavTranslate,
} from "@/types/navigation";

import { isPathWithin, resolveActiveHref, type MatchableLink } from "./linkMatching";
import { PUBLIC_ENTRIES } from "./publicEntries";
import { ACCOUNT_LINKS, EDITORIAL_SPACES } from "./spaces";

interface Territory<K> {
  key: K;
  pathPrefixes: readonly string[];
}

function territoryOf<K>(territories: readonly Territory<K>[], pathname: string | null): K | null {
  if (!pathname) return null;
  const match = territories.find((t) => t.pathPrefixes.some((p) => isPathWithin(pathname, p)));
  return match?.key ?? null;
}

function toLink(definition: NavLinkDefinition, label: string): NavLink {
  const link: NavLink = {
    key: definition.labelKey,
    href: definition.href,
    label,
    icon: definition.icon,
    isActive: false,
  };
  if (definition.badge) link.badge = definition.badge;
  return link;
}

function resolveMembership(
  definition: NavMembershipDefinition | undefined,
  input: NavigationInput
): NavMembership | null {
  if (!definition || !input.isAuthenticated) return null;
  const state = input.memberships?.[definition.source];
  if (!state) return null;
  if (state.isLoading) return { isLoading: true, links: [] };
  if (state.items.length === 0) return null;
  return {
    isLoading: false,
    links: state.items.map((item) => ({
      key: item.slug,
      href: `${definition.basePath}/${item.slug}`,
      label: item.name,
      icon: definition.fallbackIcon,
      imageUrl: item.imageUrl,
      isActive: false,
    })),
  };
}

function resolveSpace(
  space: NavSpaceDefinition,
  input: NavigationInput,
  t: NavTranslate
): NavSpace {
  return {
    key: space.key,
    label: t(`spaces.${space.key}`),
    icon: space.icon,
    isActive: false,
    links: space.links.map((l) => toLink(l, t(`links.${space.key}.${l.labelKey}`))),
    membership: resolveMembership(space.membership, input),
  };
}

function resolveEntries(t: NavTranslate): NavPublicEntry[] {
  return PUBLIC_ENTRIES.map((entry) => ({
    key: entry.key,
    label: t(`megaMenu.entries.${entry.key}`),
    icon: entry.icon,
    isActive: false,
    sections: entry.sections.map((section) => ({
      key: section.titleKey,
      title: t(`megaMenu.sections.${entry.key}.${section.titleKey}`),
      links: section.links.map((l) => toLink(l, t(`megaMenu.links.${entry.key}.${l.labelKey}`))),
    })),
  }));
}

// Membership pages own their sub-pages (members, settings…), static links do not.
function matchables(model: Omit<NavigationModel, "activeHref">): MatchableLink[] {
  const staticLinks = [
    ...model.publicEntries.flatMap((e) => e.sections.flatMap((s) => s.links)),
    ...model.spaces.flatMap((s) => s.links),
    ...model.account,
  ].map((l) => ({ href: l.href }));
  const membershipLinks = model.spaces
    .flatMap((s) => s.membership?.links ?? [])
    .map((l) => ({ href: l.href, match: "prefix" as const }));
  return [...staticLinks, ...membershipLinks];
}

function markActive(links: NavLink[], activeHref: string | null): void {
  for (const link of links) link.isActive = link.href === activeHref;
}

/**
 * Builds the Navigation Model for one visitor at one location. Pure: the
 * caller supplies location, auth, memberships and a translator for the
 * `editorial` namespace.
 */
export function resolveNavigation(input: NavigationInput, t: NavTranslate): NavigationModel {
  const activeEntryKey = territoryOf(PUBLIC_ENTRIES, input.pathname);
  const activeSpaceKey = territoryOf(EDITORIAL_SPACES, input.pathname);

  const publicEntries = resolveEntries(t).map((e) => ({
    ...e,
    isActive: e.key === activeEntryKey,
  }));
  const spaces = EDITORIAL_SPACES.map((s) => ({
    ...resolveSpace(s, input, t),
    isActive: s.key === activeSpaceKey,
  }));
  const account = input.isAuthenticated
    ? ACCOUNT_LINKS.map((l) => toLink(l, t(`links.account.${l.labelKey}`)))
    : [];

  const partial = { publicEntries, spaces, account, activeEntryKey, activeSpaceKey };
  const activeHref = resolveActiveHref(matchables(partial), input);

  markActive(
    publicEntries.flatMap((e) => e.sections.flatMap((s) => s.links)),
    activeHref
  );
  markActive(
    spaces.flatMap((s) => [...s.links, ...(s.membership?.links ?? [])]),
    activeHref
  );
  markActive(account, activeHref);

  return { ...partial, activeHref };
}
