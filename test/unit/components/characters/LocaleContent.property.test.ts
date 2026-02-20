import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: character-pages
 * Property 12: Locale-Based Content Display
 * **Validates: Requirements 9.2**
 *
 * For any locale setting (fr or en), all displayed character information
 * (names, descriptions, roles) should be in the selected language.
 */

// Supported locales
type Locale = "fr" | "en";

// Translation content for a character
interface CharacterTranslation {
  name: string;
  role?: string;
  description?: string;
  biography?: string;
}

// Character with translations for both locales
interface CharacterWithTranslations {
  id: string;
  slug: string;
  translations: {
    fr: CharacterTranslation;
    en: CharacterTranslation;
  };
}

// Character data as returned by API for a specific locale
interface LocalizedCharacter {
  id: string;
  slug: string;
  name: string;
  role?: string;
  description?: string;
  biography?: string;
}

// UI translation keys for character pages
interface UITranslations {
  title: string;
  searchPlaceholder: string;
  filterByGame: string;
  filterByRole: string;
  noResults: string;
  roles: {
    protagonist: string;
    antagonist: string;
    supporting: string;
    npc: string;
    playable: string;
  };
}

// French UI translations
const frenchUITranslations: UITranslations = {
  title: "Personnages",
  searchPlaceholder: "Rechercher un personnage...",
  filterByGame: "Filtrer par jeu",
  filterByRole: "Filtrer par rôle",
  noResults: "Aucun personnage trouvé",
  roles: {
    protagonist: "Protagoniste",
    antagonist: "Antagoniste",
    supporting: "Secondaire",
    npc: "PNJ",
    playable: "Jouable",
  },
};

// English UI translations
const englishUITranslations: UITranslations = {
  title: "Characters",
  searchPlaceholder: "Search for a character...",
  filterByGame: "Filter by game",
  filterByRole: "Filter by role",
  noResults: "No characters found",
  roles: {
    protagonist: "Protagonist",
    antagonist: "Antagonist",
    supporting: "Supporting",
    npc: "NPC",
    playable: "Playable",
  },
};

/**
 * Simulates the locale-based content selection logic.
 */
const getLocalizedCharacter = (
  character: CharacterWithTranslations,
  locale: Locale
): LocalizedCharacter => {
  const translation = character.translations[locale];
  return {
    id: character.id,
    slug: character.slug,
    name: translation.name,
    role: translation.role,
    description: translation.description,
    biography: translation.biography,
  };
};

/**
 * Simulates getting UI translations for a locale.
 */
const getUITranslations = (locale: Locale): UITranslations => {
  return locale === "fr" ? frenchUITranslations : englishUITranslations;
};

// Generators for property-based testing
const localeGenerator: fc.Arbitrary<Locale> = fc.constantFrom("fr", "en");

// Generator for French text (with accented characters)
const frenchTextGenerator = fc.oneof(
  fc.constant("Le héros légendaire"),
  fc.constant("Un personnage mystérieux"),
  fc.constant("La princesse du royaume"),
  fc.constant("L'antagoniste principal"),
  fc.constant("Un guerrier courageux"),
  fc.stringMatching(/^[A-Za-zéèêëàâäùûüôöîïç ]{5,50}$/)
);

// Generator for English text
const englishTextGenerator = fc.oneof(
  fc.constant("The legendary hero"),
  fc.constant("A mysterious character"),
  fc.constant("The princess of the kingdom"),
  fc.constant("The main antagonist"),
  fc.constant("A brave warrior"),
  fc.stringMatching(/^[A-Za-z ]{5,50}$/)
);

// Generator for character translations
const characterTranslationsGenerator: fc.Arbitrary<CharacterWithTranslations> = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
  translations: fc.record({
    fr: fc.record({
      name: frenchTextGenerator,
      role: fc.option(
        fc.constantFrom("Protagoniste", "Antagoniste", "Secondaire", "PNJ", "Jouable"),
        { nil: undefined }
      ),
      description: fc.option(frenchTextGenerator, { nil: undefined }),
      biography: fc.option(frenchTextGenerator, { nil: undefined }),
    }),
    en: fc.record({
      name: englishTextGenerator,
      role: fc.option(
        fc.constantFrom("Protagonist", "Antagonist", "Supporting", "NPC", "Playable"),
        { nil: undefined }
      ),
      description: fc.option(englishTextGenerator, { nil: undefined }),
      biography: fc.option(englishTextGenerator, { nil: undefined }),
    }),
  }),
});

describe("Character Pages Property-Based Tests - Locale Content Display", () => {
  describe("Property 12: Locale-Based Content Display", () => {
    it("French locale returns French character content", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, (character) => {
          const localizedCharacter = getLocalizedCharacter(character, "fr");

          expect(localizedCharacter.name).toBe(character.translations.fr.name);
          expect(localizedCharacter.role).toBe(character.translations.fr.role);
          expect(localizedCharacter.description).toBe(character.translations.fr.description);
          expect(localizedCharacter.biography).toBe(character.translations.fr.biography);
        }),
        { numRuns: 30 }
      );
    });

    it("English locale returns English character content", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, (character) => {
          const localizedCharacter = getLocalizedCharacter(character, "en");

          expect(localizedCharacter.name).toBe(character.translations.en.name);
          expect(localizedCharacter.role).toBe(character.translations.en.role);
          expect(localizedCharacter.description).toBe(character.translations.en.description);
          expect(localizedCharacter.biography).toBe(character.translations.en.biography);
        }),
        { numRuns: 30 }
      );
    });

    it("locale selection is deterministic - same locale always returns same content", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, localeGenerator, (character, locale) => {
          const result1 = getLocalizedCharacter(character, locale);
          const result2 = getLocalizedCharacter(character, locale);

          expect(result1.name).toBe(result2.name);
          expect(result1.role).toBe(result2.role);
          expect(result1.description).toBe(result2.description);
          expect(result1.biography).toBe(result2.biography);
        }),
        { numRuns: 30 }
      );
    });

    it("different locales return different content when translations differ", () => {
      fc.assert(
        fc.property(
          characterTranslationsGenerator.filter(
            (c) => c.translations.fr.name !== c.translations.en.name
          ),
          (character) => {
            const frenchContent = getLocalizedCharacter(character, "fr");
            const englishContent = getLocalizedCharacter(character, "en");

            expect(frenchContent.name).not.toBe(englishContent.name);
            expect(frenchContent.name).toBe(character.translations.fr.name);
            expect(englishContent.name).toBe(character.translations.en.name);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("character ID and slug are preserved regardless of locale", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, localeGenerator, (character, locale) => {
          const localizedCharacter = getLocalizedCharacter(character, locale);

          expect(localizedCharacter.id).toBe(character.id);
          expect(localizedCharacter.slug).toBe(character.slug);
        }),
        { numRuns: 30 }
      );
    });

    it("UI translations match the selected locale", () => {
      fc.assert(
        fc.property(localeGenerator, (locale) => {
          const translations = getUITranslations(locale);

          if (locale === "fr") {
            expect(translations.title).toBe("Personnages");
            expect(translations.searchPlaceholder).toBe("Rechercher un personnage...");
            expect(translations.filterByGame).toBe("Filtrer par jeu");
            expect(translations.filterByRole).toBe("Filtrer par rôle");
            expect(translations.noResults).toBe("Aucun personnage trouvé");
            expect(translations.roles.protagonist).toBe("Protagoniste");
            expect(translations.roles.antagonist).toBe("Antagoniste");
          } else {
            expect(translations.title).toBe("Characters");
            expect(translations.searchPlaceholder).toBe("Search for a character...");
            expect(translations.filterByGame).toBe("Filter by game");
            expect(translations.filterByRole).toBe("Filter by role");
            expect(translations.noResults).toBe("No characters found");
            expect(translations.roles.protagonist).toBe("Protagonist");
            expect(translations.roles.antagonist).toBe("Antagonist");
          }
        }),
        { numRuns: 50 }
      );
    });

    it("role translations are consistent with locale", () => {
      const roleKeys = ["protagonist", "antagonist", "supporting", "npc", "playable"] as const;

      fc.assert(
        fc.property(localeGenerator, fc.constantFrom(...roleKeys), (locale, roleKey) => {
          const translations = getUITranslations(locale);
          const roleTranslation = translations.roles[roleKey];

          expect(roleTranslation).toBeDefined();
          expect(roleTranslation.length).toBeGreaterThan(0);

          const frenchTranslations = getUITranslations("fr");
          const englishTranslations = getUITranslations("en");

          if (locale === "fr") {
            expect(roleTranslation).toBe(frenchTranslations.roles[roleKey]);
          } else {
            expect(roleTranslation).toBe(englishTranslations.roles[roleKey]);
          }
        }),
        { numRuns: 50 }
      );
    });

    it("all character fields are localized together", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, localeGenerator, (character, locale) => {
          const localizedCharacter = getLocalizedCharacter(character, locale);
          const expectedTranslation = character.translations[locale];

          expect(localizedCharacter.name).toBe(expectedTranslation.name);
          expect(localizedCharacter.role).toBe(expectedTranslation.role);
          expect(localizedCharacter.description).toBe(expectedTranslation.description);
          expect(localizedCharacter.biography).toBe(expectedTranslation.biography);
        }),
        { numRuns: 30 }
      );
    });

    it("optional fields are correctly handled for both locales", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, localeGenerator, (character, locale) => {
          const localizedCharacter = getLocalizedCharacter(character, locale);
          const expectedTranslation = character.translations[locale];

          if (expectedTranslation.role === undefined) {
            expect(localizedCharacter.role).toBeUndefined();
          }
          if (expectedTranslation.description === undefined) {
            expect(localizedCharacter.description).toBeUndefined();
          }
          if (expectedTranslation.biography === undefined) {
            expect(localizedCharacter.biography).toBeUndefined();
          }
        }),
        { numRuns: 30 }
      );
    });

    it("locale switching returns correct content for each locale", () => {
      fc.assert(
        fc.property(characterTranslationsGenerator, (character) => {
          const frenchContent = getLocalizedCharacter(character, "fr");
          const englishContent = getLocalizedCharacter(character, "en");
          const frenchAgain = getLocalizedCharacter(character, "fr");
          const englishAgain = getLocalizedCharacter(character, "en");

          expect(frenchContent.name).toBe(frenchAgain.name);
          expect(englishContent.name).toBe(englishAgain.name);
          expect(frenchContent.role).toBe(frenchAgain.role);
          expect(englishContent.role).toBe(englishAgain.role);
        }),
        { numRuns: 30 }
      );
    });

    it("batch of characters all receive same locale treatment", () => {
      fc.assert(
        fc.property(
          fc.array(characterTranslationsGenerator, { minLength: 1, maxLength: 10 }),
          localeGenerator,
          (characters, locale) => {
            const localizedCharacters = characters.map((c) => getLocalizedCharacter(c, locale));

            for (let i = 0; i < characters.length; i++) {
              const original = characters[i];
              const localized = localizedCharacters[i];
              const expectedTranslation = original.translations[locale];

              expect(localized.name).toBe(expectedTranslation.name);
              expect(localized.role).toBe(expectedTranslation.role);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 12 Extended: API Locale Parameter Handling", () => {
    const parseLocaleParam = (localeParam: string | null): Locale => {
      if (localeParam === "en") return "en";
      return "fr"; // Default to French
    };

    it("valid locale parameters are correctly parsed", () => {
      fc.assert(
        fc.property(fc.constantFrom("fr", "en"), (locale) => {
          const parsed = parseLocaleParam(locale);
          expect(parsed).toBe(locale);
        }),
        { numRuns: 20 }
      );
    });

    it("null locale parameter defaults to French", () => {
      const parsed = parseLocaleParam(null);
      expect(parsed).toBe("fr");
    });

    it("invalid locale parameter defaults to French", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s !== "fr" && s !== "en"),
          (invalidLocale) => {
            const parsed = parseLocaleParam(invalidLocale);
            expect(parsed).toBe("fr");
          }
        ),
        { numRuns: 50 }
      );
    });

    it("empty string locale parameter defaults to French", () => {
      const parsed = parseLocaleParam("");
      expect(parsed).toBe("fr");
    });
  });

  describe("Property 12 Extended: Link Generation with Locale", () => {
    const generateCharacterLink = (slug: string, locale: Locale): string => {
      return `/${locale}/characters/${slug}`;
    };

    it("character links include correct locale prefix", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-z0-9-]{3,30}$/), localeGenerator, (slug, locale) => {
          const link = generateCharacterLink(slug, locale);

          expect(link).toContain(`/${locale}/`);
          expect(link).toContain(`/characters/${slug}`);
          expect(link).toBe(`/${locale}/characters/${slug}`);
        }),
        { numRuns: 30 }
      );
    });

    it("French locale generates French URL prefix", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-z0-9-]{3,30}$/), (slug) => {
          const link = generateCharacterLink(slug, "fr");
          expect(link.startsWith("/fr/")).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it("English locale generates English URL prefix", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-z0-9-]{3,30}$/), (slug) => {
          const link = generateCharacterLink(slug, "en");
          expect(link.startsWith("/en/")).toBe(true);
        }),
        { numRuns: 50 }
      );
    });
  });
});
