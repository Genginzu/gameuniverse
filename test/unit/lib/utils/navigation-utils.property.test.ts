import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isActive, NAV_LINKS, PUBLIC_LINKS } from "../../../../src/lib/utils/navigation-utils";

// =============================================================================
// Generators
// =============================================================================

const LOCALES = ["fr", "en"] as const;

const ALL_LINKS = [...NAV_LINKS, ...PUBLIC_LINKS];

/** Generate a random locale prefix or none. */
const localePrefix = () => fc.oneof(fc.constant(""), ...LOCALES.map((l) => fc.constant(`/${l}`)));

/** Generate a random sub-path segment (e.g. "/abc", "/123"). */
const subPath = () =>
  fc.oneof(
    fc.constant(""),
    fc.stringMatching(/^[a-z0-9-]{1,12}$/).map((s) => `/${s}`)
  );

// =============================================================================
// Feature: navigation-sidebar — Propriété 1 : Unicité et exactitude du lien actif
// =============================================================================

describe("Feature: navigation-sidebar, Propriété 1 : Unicité et exactitude du lien actif", () => {
  it("isActive retourne true pour au plus un seul lien parmi NAV_LINKS pour tout pathname", () => {
    fc.assert(
      fc.property(
        localePrefix(),
        fc.constantFrom(...NAV_LINKS.map((l) => l.href)),
        subPath(),
        (prefix, linkHref, suffix) => {
          const pathname = `${prefix}${linkHref}${suffix}`;
          const activeCount = NAV_LINKS.filter((link) => isActive(pathname, link.href)).length;
          expect(activeCount).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isActive retourne true pour au plus un seul lien parmi ALL_LINKS pour tout pathname arbitraire", () => {
    fc.assert(
      fc.property(localePrefix(), fc.stringMatching(/^[a-z0-9/-]{1,30}$/), (prefix, randomPath) => {
        const pathname = `${prefix}/${randomPath}`;
        const activeCount = ALL_LINKS.filter((link) => isActive(pathname, link.href)).length;
        // At most one link should be active (some paths may match none)
        expect(activeCount).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it("si le pathname commence par le href d'un lien (après suppression du préfixe locale), isActive retourne true pour ce lien", () => {
    fc.assert(
      fc.property(
        localePrefix(),
        fc.constantFrom(...ALL_LINKS.map((l) => l.href)),
        subPath(),
        (prefix, linkHref, suffix) => {
          const pathname = `${prefix}${linkHref}${suffix}`;
          // After stripping locale, the pathname starts with linkHref
          // so isActive must return true for that link
          expect(isActive(pathname, linkHref)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
