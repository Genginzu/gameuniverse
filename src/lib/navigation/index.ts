/**
 * Navigation Model module (see GLOSSARY.md, "Navigation").
 *
 * `resolveNavigation` is the interface the editorial renderers consume.
 * `resolveActiveHref` is exposed for navigations outside the editorial shell
 * (admin sidebar) that only need the Active Link rule.
 */
export { resolveNavigation } from "./resolveNavigation";
export { resolveActiveHref, type MatchableLink } from "./linkMatching";
export { EDITORIAL_SPACE_KEYS } from "./spaces";
