import type { NavLocation, NavMatch } from "@/types/navigation";

export interface MatchableLink {
  href: string;
  match?: NavMatch;
}

// Specificity tiers: a link whose query is satisfied beats an exact pathname
// match, which beats a prefix match. Within a tier, the longer path wins.
const QUERY_TIER = 3;
const EXACT_TIER = 2;
const PREFIX_TIER = 1;
const TIER_WEIGHT = 10_000;

export function isPathWithin(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function splitHref(href: string): { path: string; query: URLSearchParams } {
  const index = href.indexOf("?");
  if (index === -1) return { path: href, query: new URLSearchParams() };
  return { path: href.slice(0, index), query: new URLSearchParams(href.slice(index + 1)) };
}

function querySatisfied(required: URLSearchParams, current: URLSearchParams): boolean {
  for (const [key, value] of required) {
    if (current.get(key) !== value) return false;
  }
  return true;
}

function matchScore(link: MatchableLink, pathname: string, current: URLSearchParams): number {
  const { path, query } = splitHref(link.href);
  const hasQuery = [...query.keys()].length > 0;
  if (hasQuery) {
    if (pathname !== path || !querySatisfied(query, current)) return 0;
    return QUERY_TIER * TIER_WEIGHT + path.length;
  }
  if (pathname === path) return EXACT_TIER * TIER_WEIGHT + path.length;
  if (link.match === "prefix" && isPathWithin(pathname, path)) {
    return PREFIX_TIER * TIER_WEIGHT + path.length;
  }
  return 0;
}

/**
 * Returns the href of the single link that best matches the location, or
 * `null`. Links default to `exact` matching.
 */
export function resolveActiveHref(
  links: readonly MatchableLink[],
  location: NavLocation
): string | null {
  const { pathname } = location;
  if (!pathname) return null;
  const current = new URLSearchParams(location.search ?? "");
  let best: { href: string; score: number } | null = null;
  for (const link of links) {
    const score = matchScore(link, pathname, current);
    if (score > 0 && (!best || score > best.score)) best = { href: link.href, score };
  }
  return best?.href ?? null;
}
