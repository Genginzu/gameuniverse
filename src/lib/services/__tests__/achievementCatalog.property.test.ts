import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Feature: achievements-system
// Property 1: Catalog entry completeness
// ---------------------------------------------------------------------------

/**
 * Seed data extracted from:
 * supabase/migrations/20240313000001_achievement_catalog.sql
 *
 * 24 achievements across 5 categories.
 */
const VALID_CATEGORIES = ["library", "playtime", "reviews", "social", "collections"] as const;

const VALID_TIERS = ["bronze", "silver", "gold"] as const;

interface CatalogEntry {
  key: string;
  category: string;
  tier: string;
  threshold: number;
  xpValue: number;
  icon: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: number;
}

const ACHIEVEMENT_CATALOG: CatalogEntry[] = [
  // library (6)
  {
    key: "library_1",
    category: "library",
    tier: "bronze",
    threshold: 1,
    xpValue: 10,
    icon: "BookOpen",
    nameFr: "Premier Jeu",
    nameEn: "First Game",
    descriptionFr: "Ajoutez votre premier jeu à la bibliothèque",
    descriptionEn: "Add your first game to the library",
    sortOrder: 1,
  },
  {
    key: "library_5",
    category: "library",
    tier: "bronze",
    threshold: 5,
    xpValue: 25,
    icon: "BookOpen",
    nameFr: "Petit Collectionneur",
    nameEn: "Small Collector",
    descriptionFr: "Ajoutez 5 jeux à votre bibliothèque",
    descriptionEn: "Add 5 games to your library",
    sortOrder: 2,
  },
  {
    key: "library_10",
    category: "library",
    tier: "silver",
    threshold: 10,
    xpValue: 50,
    icon: "Library",
    nameFr: "Bibliophile",
    nameEn: "Bookworm",
    descriptionFr: "Ajoutez 10 jeux à votre bibliothèque",
    descriptionEn: "Add 10 games to your library",
    sortOrder: 3,
  },
  {
    key: "library_25",
    category: "library",
    tier: "silver",
    threshold: 25,
    xpValue: 100,
    icon: "Library",
    nameFr: "Collectionneur Averti",
    nameEn: "Seasoned Collector",
    descriptionFr: "Ajoutez 25 jeux à votre bibliothèque",
    descriptionEn: "Add 25 games to your library",
    sortOrder: 4,
  },
  {
    key: "library_50",
    category: "library",
    tier: "gold",
    threshold: 50,
    xpValue: 200,
    icon: "BookMarked",
    nameFr: "Grand Collectionneur",
    nameEn: "Grand Collector",
    descriptionFr: "Ajoutez 50 jeux à votre bibliothèque",
    descriptionEn: "Add 50 games to your library",
    sortOrder: 5,
  },
  {
    key: "library_100",
    category: "library",
    tier: "gold",
    threshold: 100,
    xpValue: 500,
    icon: "BookMarked",
    nameFr: "Maître Bibliothécaire",
    nameEn: "Master Librarian",
    descriptionFr: "Ajoutez 100 jeux à votre bibliothèque",
    descriptionEn: "Add 100 games to your library",
    sortOrder: 6,
  },
  // playtime (5)
  {
    key: "playtime_10h",
    category: "playtime",
    tier: "bronze",
    threshold: 10,
    xpValue: 25,
    icon: "Clock",
    nameFr: "Premiers Pas",
    nameEn: "First Steps",
    descriptionFr: "Jouez pendant 10 heures au total",
    descriptionEn: "Play for a total of 10 hours",
    sortOrder: 1,
  },
  {
    key: "playtime_50h",
    category: "playtime",
    tier: "bronze",
    threshold: 50,
    xpValue: 50,
    icon: "Clock",
    nameFr: "Joueur Régulier",
    nameEn: "Regular Player",
    descriptionFr: "Jouez pendant 50 heures au total",
    descriptionEn: "Play for a total of 50 hours",
    sortOrder: 2,
  },
  {
    key: "playtime_100h",
    category: "playtime",
    tier: "silver",
    threshold: 100,
    xpValue: 100,
    icon: "Timer",
    nameFr: "Passionné",
    nameEn: "Enthusiast",
    descriptionFr: "Jouez pendant 100 heures au total",
    descriptionEn: "Play for a total of 100 hours",
    sortOrder: 3,
  },
  {
    key: "playtime_500h",
    category: "playtime",
    tier: "gold",
    threshold: 500,
    xpValue: 250,
    icon: "Hourglass",
    nameFr: "Vétéran",
    nameEn: "Veteran",
    descriptionFr: "Jouez pendant 500 heures au total",
    descriptionEn: "Play for a total of 500 hours",
    sortOrder: 4,
  },
  {
    key: "playtime_1000h",
    category: "playtime",
    tier: "gold",
    threshold: 1000,
    xpValue: 500,
    icon: "Hourglass",
    nameFr: "Légende Vivante",
    nameEn: "Living Legend",
    descriptionFr: "Jouez pendant 1000 heures au total",
    descriptionEn: "Play for a total of 1000 hours",
    sortOrder: 5,
  },
  // reviews (5)
  {
    key: "reviews_1",
    category: "reviews",
    tier: "bronze",
    threshold: 1,
    xpValue: 10,
    icon: "Star",
    nameFr: "Premier Avis",
    nameEn: "First Review",
    descriptionFr: "Rédigez votre premier avis",
    descriptionEn: "Write your first review",
    sortOrder: 1,
  },
  {
    key: "reviews_5",
    category: "reviews",
    tier: "bronze",
    threshold: 5,
    xpValue: 25,
    icon: "Star",
    nameFr: "Critique en Herbe",
    nameEn: "Budding Critic",
    descriptionFr: "Rédigez 5 avis",
    descriptionEn: "Write 5 reviews",
    sortOrder: 2,
  },
  {
    key: "reviews_10",
    category: "reviews",
    tier: "silver",
    threshold: 10,
    xpValue: 50,
    icon: "MessageSquare",
    nameFr: "Critique Confirmé",
    nameEn: "Confirmed Critic",
    descriptionFr: "Rédigez 10 avis",
    descriptionEn: "Write 10 reviews",
    sortOrder: 3,
  },
  {
    key: "reviews_25",
    category: "reviews",
    tier: "silver",
    threshold: 25,
    xpValue: 100,
    icon: "MessageSquare",
    nameFr: "Critique Expert",
    nameEn: "Expert Critic",
    descriptionFr: "Rédigez 25 avis",
    descriptionEn: "Write 25 reviews",
    sortOrder: 4,
  },
  {
    key: "reviews_50",
    category: "reviews",
    tier: "gold",
    threshold: 50,
    xpValue: 250,
    icon: "PenLine",
    nameFr: "Critique Légendaire",
    nameEn: "Legendary Critic",
    descriptionFr: "Rédigez 50 avis",
    descriptionEn: "Write 50 reviews",
    sortOrder: 5,
  },
  // social (4)
  {
    key: "social_1",
    category: "social",
    tier: "bronze",
    threshold: 1,
    xpValue: 10,
    icon: "UserPlus",
    nameFr: "Premier Ami",
    nameEn: "First Friend",
    descriptionFr: "Ajoutez votre premier ami",
    descriptionEn: "Add your first friend",
    sortOrder: 1,
  },
  {
    key: "social_5",
    category: "social",
    tier: "bronze",
    threshold: 5,
    xpValue: 25,
    icon: "UserPlus",
    nameFr: "Sociable",
    nameEn: "Sociable",
    descriptionFr: "Ajoutez 5 amis",
    descriptionEn: "Add 5 friends",
    sortOrder: 2,
  },
  {
    key: "social_10",
    category: "social",
    tier: "silver",
    threshold: 10,
    xpValue: 50,
    icon: "Users",
    nameFr: "Populaire",
    nameEn: "Popular",
    descriptionFr: "Ajoutez 10 amis",
    descriptionEn: "Add 10 friends",
    sortOrder: 3,
  },
  {
    key: "social_25",
    category: "social",
    tier: "gold",
    threshold: 25,
    xpValue: 100,
    icon: "Users",
    nameFr: "Star Sociale",
    nameEn: "Social Star",
    descriptionFr: "Ajoutez 25 amis",
    descriptionEn: "Add 25 friends",
    sortOrder: 4,
  },
  // collections (4)
  {
    key: "collections_1",
    category: "collections",
    tier: "bronze",
    threshold: 1,
    xpValue: 10,
    icon: "FolderPlus",
    nameFr: "Première Collection",
    nameEn: "First Collection",
    descriptionFr: "Créez votre première collection",
    descriptionEn: "Create your first collection",
    sortOrder: 1,
  },
  {
    key: "collections_3",
    category: "collections",
    tier: "bronze",
    threshold: 3,
    xpValue: 25,
    icon: "FolderPlus",
    nameFr: "Organisateur",
    nameEn: "Organizer",
    descriptionFr: "Créez 3 collections",
    descriptionEn: "Create 3 collections",
    sortOrder: 2,
  },
  {
    key: "collections_5",
    category: "collections",
    tier: "silver",
    threshold: 5,
    xpValue: 50,
    icon: "Layers",
    nameFr: "Curateur",
    nameEn: "Curator",
    descriptionFr: "Créez 5 collections",
    descriptionEn: "Create 5 collections",
    sortOrder: 3,
  },
  {
    key: "collections_10",
    category: "collections",
    tier: "gold",
    threshold: 10,
    xpValue: 100,
    icon: "Grid3X3",
    nameFr: "Maître Curateur",
    nameEn: "Master Curator",
    descriptionFr: "Créez 10 collections",
    descriptionEn: "Create 10 collections",
    sortOrder: 4,
  },
];

describe("Achievement Catalog — Property Tests", () => {
  // Feature: achievements-system, Property 1: Catalog entry completeness
  describe("Property 1: Catalog entry completeness", () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 7.2**
     *
     * For any achievement catalog entry, all required fields must be
     * non-null and non-empty strings (for text fields) or positive
     * integers (for numeric fields).
     */
    it("every catalog entry has all required fields non-null and non-empty", () => {
      fc.assert(
        fc.property(fc.constantFrom(...ACHIEVEMENT_CATALOG), (entry: CatalogEntry) => {
          // String fields must be non-empty
          expect(entry.key).toBeTruthy();
          expect(entry.key.length).toBeGreaterThan(0);

          expect(entry.category).toBeTruthy();
          expect(VALID_CATEGORIES).toContain(entry.category);

          expect(entry.tier).toBeTruthy();
          expect(VALID_TIERS).toContain(entry.tier);

          expect(entry.icon).toBeTruthy();
          expect(entry.icon.length).toBeGreaterThan(0);

          expect(entry.nameFr).toBeTruthy();
          expect(entry.nameFr.length).toBeGreaterThan(0);

          expect(entry.nameEn).toBeTruthy();
          expect(entry.nameEn.length).toBeGreaterThan(0);

          expect(entry.descriptionFr).toBeTruthy();
          expect(entry.descriptionFr.length).toBeGreaterThan(0);

          expect(entry.descriptionEn).toBeTruthy();
          expect(entry.descriptionEn.length).toBeGreaterThan(0);

          // Numeric fields must be positive
          expect(entry.threshold).toBeGreaterThan(0);
          expect(entry.xpValue).toBeGreaterThan(0);

          // sort_order must be non-negative
          expect(entry.sortOrder).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: achievements-system, Property 2: Tier ordering by threshold within category
  describe("Property 2: Tier ordering by threshold within category", () => {
    const TIER_RANK: Record<string, number> = { bronze: 0, silver: 1, gold: 2 };

    /** Group catalog entries by category */
    const entriesByCategory = ACHIEVEMENT_CATALOG.reduce<Record<string, CatalogEntry[]>>(
      (acc, entry) => {
        if (!acc[entry.category]) acc[entry.category] = [];
        acc[entry.category].push(entry);
        return acc;
      },
      {}
    );

    /**
     * **Validates: Requirements 2.6**
     *
     * For any two achievements in the same category, if threshold_a < threshold_b,
     * then tier_a ≤ tier_b (bronze=0 < silver=1 < gold=2).
     */
    it("a lower threshold implies a tier rank ≤ within the same category", () => {
      for (const [, entries] of Object.entries(entriesByCategory)) {
        const pairs = entries.flatMap((a) => entries.map((b) => [a, b] as const));

        fc.assert(
          fc.property(fc.constantFrom(...pairs), ([a, b]) => {
            if (a.threshold < b.threshold) {
              expect(TIER_RANK[a.tier]).toBeLessThanOrEqual(TIER_RANK[b.tier]);
            }
          }),
          { numRuns: 100 }
        );
      }
    });
  });
});
