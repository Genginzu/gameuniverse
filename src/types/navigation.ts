/**
 * Navigation Model types (see GLOSSARY.md, "Navigation").
 *
 * Definitions (`Nav*Definition`) are the static, untranslated catalogue.
 * Resolved types (`Nav*` without suffix) are what renderers consume: labels
 * translated, active state computed, visibility applied.
 */

export type NavSpaceKey =
  "social" | "groups" | "communities" | "library" | "esport" | "coaching" | "account";

export type NavEntryKey = "games" | "characters" | "players" | "esport";

/** Live counter attached to a link (rendered by `NavCountBadge`). */
export type NavBadge = "unreadNotifications" | "pendingFriends";

/**
 * How a link claims the current location:
 * - `exact`: same pathname (and every query param of the href present)
 * - `prefix`: same pathname or any descendant path
 */
export type NavMatch = "exact" | "prefix";

export interface NavLinkDefinition {
  href: string;
  /** i18n sub-key, resolved by the owning entry / space. */
  labelKey: string;
  icon: string;
  match?: NavMatch;
  badge?: NavBadge;
}

export interface NavSectionDefinition {
  titleKey: string;
  links: readonly NavLinkDefinition[];
}

export interface NavPublicEntryDefinition {
  key: NavEntryKey;
  icon: string;
  pathPrefixes: readonly string[];
  sections: readonly NavSectionDefinition[];
}

export interface NavMembershipDefinition {
  source: "groups" | "communities";
  basePath: string;
  fallbackIcon: string;
}

export interface NavSpaceDefinition {
  key: NavSpaceKey;
  icon: string;
  pathPrefixes: readonly string[];
  links: readonly NavLinkDefinition[];
  membership?: NavMembershipDefinition;
}

/** Current location, without locale prefix. */
export interface NavLocation {
  pathname: string | null;
  /** Query string, with or without the leading `?`. */
  search?: string;
}

export interface NavMembershipItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface NavMembershipState {
  items: readonly NavMembershipItem[];
  isLoading: boolean;
}

export interface NavigationInput extends NavLocation {
  isAuthenticated: boolean;
  memberships?: Partial<Record<NavMembershipDefinition["source"], NavMembershipState>>;
}

/** Translates a key relative to the `editorial` namespace. */
export type NavTranslate = (key: string) => string;

export interface NavLink {
  /** Stable identifier within its list (labelKey, or slug for memberships). */
  key: string;
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  badge?: NavBadge;
  imageUrl?: string | null;
}

export interface NavSection {
  key: string;
  title: string;
  links: NavLink[];
}

export interface NavPublicEntry {
  key: NavEntryKey;
  label: string;
  icon: string;
  isActive: boolean;
  sections: NavSection[];
}

export interface NavMembership {
  isLoading: boolean;
  links: NavLink[];
}

export interface NavSpace {
  key: NavSpaceKey;
  label: string;
  icon: string;
  isActive: boolean;
  links: NavLink[];
  /** `null` when anonymous or when the member belongs to nothing. */
  membership: NavMembership | null;
}

export interface NavigationModel {
  publicEntries: NavPublicEntry[];
  spaces: NavSpace[];
  /** Empty for anonymous visitors. */
  account: NavLink[];
  activeEntryKey: NavEntryKey | null;
  activeSpaceKey: NavSpaceKey | null;
  /** Href of the single Active Link, or `null`. */
  activeHref: string | null;
}
