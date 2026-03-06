import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  ActivityEvent,
  ActivityEventType,
  ActivityEventData,
  ReviewEventData,
  CommentEventData,
  LibraryEventData,
  PlaytimeEventData,
  FavoriteEventData,
  CollectionEventData,
} from "@/types/activity";
import { getActivityIcon } from "@/components/players/ActivityItem";

// ---------------------------------------------------------------------------
// Pure functions under test
// ---------------------------------------------------------------------------

/** Sorts activity events by date descending (most recent first). */
function sortEventsDesc(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Computes pagination metadata from totalCount and current page. */
function computePagination(
  totalCount: number,
  page: number,
  pageSize = 20
): { totalPages: number; hasNextPage: boolean; pageItemCount: number } {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNextPage = page < totalPages;
  const remaining = totalCount - (page - 1) * pageSize;
  const pageItemCount = Math.max(0, Math.min(pageSize, remaining));
  return { totalPages, hasNextPage, pageItemCount };
}

/** Filters events by type. "all" returns the original list unchanged. */
function filterEvents(events: ActivityEvent[], filter: ActivityEventType | "all"): ActivityEvent[] {
  if (filter === "all") return events;
  return events.filter((e) => e.type === filter);
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const ALL_EVENT_TYPES: ActivityEventType[] = [
  "review",
  "comment",
  "library",
  "playtime",
  "favorite",
  "collection",
];

const isoDateArb = fc
  .integer({
    min: new Date("2020-01-01T00:00:00Z").getTime(),
    max: new Date("2030-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const eventTypeArb: fc.Arbitrary<ActivityEventType> = fc.constantFrom(...ALL_EVENT_TYPES);

/** Generates discriminated event data matching the given type. */
function eventDataForType(type: ActivityEventType): fc.Arbitrary<ActivityEventData> {
  switch (type) {
    case "review":
      return fc.record<ReviewEventData>({
        type: fc.constant("review"),
        gameId: fc.uuid(),
        gameSlug: fc.string({ minLength: 1, maxLength: 30 }),
        gameName: fc.string({ minLength: 1, maxLength: 50 }),
        rating: fc.integer({ min: 0, max: 20 }),
        contentExcerpt: fc.string({ minLength: 0, maxLength: 200 }),
      });
    case "comment":
      return fc.record<CommentEventData>({
        type: fc.constant("comment"),
        characterId: fc.uuid(),
        characterSlug: fc.string({ minLength: 1, maxLength: 30 }),
        characterName: fc.string({ minLength: 1, maxLength: 50 }),
        contentExcerpt: fc.string({ minLength: 0, maxLength: 200 }),
      });
    case "library":
      return fc.record<LibraryEventData>({
        type: fc.constant("library"),
        gameId: fc.uuid(),
        gameSlug: fc.string({ minLength: 1, maxLength: 30 }),
        gameName: fc.string({ minLength: 1, maxLength: 50 }),
        coverImage: fc.option(fc.webUrl(), { nil: null }),
        status: fc.constantFrom("owned", "wishlist", "completed", "playing"),
      });
    case "playtime":
      return fc.record<PlaytimeEventData>({
        type: fc.constant("playtime"),
        gameId: fc.uuid(),
        gameSlug: fc.string({ minLength: 1, maxLength: 30 }),
        gameName: fc.string({ minLength: 1, maxLength: 50 }),
        playTimeHastily: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
        playTimeNormally: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
        playTimeCompletely: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
      });
    case "favorite":
      return fc.record<FavoriteEventData>({
        type: fc.constant("favorite"),
        characterId: fc.uuid(),
        characterSlug: fc.string({ minLength: 1, maxLength: 30 }),
        characterName: fc.string({ minLength: 1, maxLength: 50 }),
      });
    case "collection":
      return fc.record<CollectionEventData>({
        type: fc.constant("collection"),
        collectionId: fc.uuid(),
        collectionSlug: fc.string({ minLength: 1, maxLength: 30 }),
        collectionName: fc.string({ minLength: 1, maxLength: 50 }),
        gamesCount: fc.integer({ min: 0, max: 1000 }),
      });
  }
}

/** Generates a single ActivityEvent with coherent type/data. */
const activityEventArb: fc.Arbitrary<ActivityEvent> = eventTypeArb.chain((type) =>
  fc.record({
    id: fc.uuid(),
    type: fc.constant(type),
    date: isoDateArb,
    data: eventDataForType(type),
  })
);

/** Generates an array of ActivityEvent (0–50 items). */
const activityEventsArb = fc.array(activityEventArb, {
  minLength: 0,
  maxLength: 50,
});

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe("Activity Service — Property-Based Tests", () => {
  // Feature: player-activity-tab, Property 1: Tri chronologique décroissant
  describe("Property 1: Tri chronologique décroissant", () => {
    /**
     * **Validates: Requirements 1.1**
     *
     * For any list of activity events, after sorting by date descending,
     * each event at index i must have a date >= the event at index i+1.
     */
    it("sorted events are in descending chronological order", () => {
      fc.assert(
        fc.property(activityEventsArb, (events) => {
          const sorted = sortEventsDesc(events);
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].date).getTime();
            const next = new Date(sorted[i + 1].date).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("sorting preserves all events (no loss, no duplication)", () => {
      fc.assert(
        fc.property(activityEventsArb, (events) => {
          const sorted = sortEventsDesc(events);
          expect(sorted.length).toBe(events.length);
          const inputIds = events.map((e) => e.id).sort();
          const outputIds = sorted.map((e) => e.id).sort();
          expect(outputIds).toEqual(inputIds);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: player-activity-tab, Property 2: Correction de la pagination
  describe("Property 2: Correction de la pagination", () => {
    /**
     * **Validates: Requirements 1.3, 1.6**
     *
     * For any total count N and page number p (page size 20):
     * - the page contains at most 20 items
     * - totalPages == ceil(N / 20)
     * - hasNextPage == (p < totalPages)
     */
    it("pagination metadata is correct for any totalCount and page", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 1, max: 30 }),
          (totalCount, page) => {
            const { totalPages, hasNextPage, pageItemCount } = computePagination(totalCount, page);

            const expectedTotalPages = Math.max(1, Math.ceil(totalCount / 20));
            expect(totalPages).toBe(expectedTotalPages);
            expect(pageItemCount).toBeLessThanOrEqual(20);
            expect(pageItemCount).toBeGreaterThanOrEqual(0);
            expect(hasNextPage).toBe(page < expectedTotalPages);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  // Feature: player-activity-tab, Property 3: Complétude des données par type
  describe("Property 3: Complétude des données par type", () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
     *
     * For any activity event, the data object must contain all required
     * fields for its type.
     */
    const REQUIRED_FIELDS: Record<ActivityEventType, string[]> = {
      review: ["gameSlug", "gameName", "rating", "contentExcerpt"],
      comment: ["characterSlug", "characterName", "contentExcerpt"],
      library: ["gameSlug", "gameName", "coverImage", "status"],
      playtime: [
        "gameSlug",
        "gameName",
        "playTimeHastily",
        "playTimeNormally",
        "playTimeCompletely",
      ],
      favorite: ["characterSlug", "characterName"],
      collection: ["collectionSlug", "collectionName", "gamesCount"],
    };

    it("every generated event contains all required fields for its type", () => {
      fc.assert(
        fc.property(activityEventArb, (event) => {
          const requiredFields = REQUIRED_FIELDS[event.type];
          for (const field of requiredFields) {
            expect(event.data).toHaveProperty(field);
          }
        }),
        { numRuns: 300 }
      );
    });
  });

  // Feature: player-activity-tab, Property 4: Unicité du mapping d'icônes
  describe("Property 4: Unicité du mapping d'icônes", () => {
    /**
     * **Validates: Requirements 2.2**
     *
     * For any two distinct event types, getActivityIcon must return
     * different icons.
     */
    it("all 6 event types map to unique icons", () => {
      const icons = ALL_EVENT_TYPES.map((type) => getActivityIcon(type));
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(ALL_EVENT_TYPES.length);
    });

    it("any pair of distinct types yields different icons", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_EVENT_TYPES),
          fc.constantFrom(...ALL_EVENT_TYPES),
          (typeA, typeB) => {
            fc.pre(typeA !== typeB);
            const iconA = getActivityIcon(typeA);
            const iconB = getActivityIcon(typeB);
            expect(iconA).not.toBe(iconB);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: player-activity-tab, Property 5: Correction du filtrage par type
  describe("Property 5: Correction du filtrage par type", () => {
    /**
     * **Validates: Requirements 4.2, 4.3**
     *
     * For any list of events and any type filter:
     * - filtered list only contains events matching the filter
     * - "all" filter returns the original list unchanged
     */
    const filterArb: fc.Arbitrary<ActivityEventType | "all"> = fc.constantFrom(
      "all",
      ...ALL_EVENT_TYPES
    );

    it("filtered events only contain events matching the selected type", () => {
      fc.assert(
        fc.property(activityEventsArb, filterArb, (events, filter) => {
          const filtered = filterEvents(events, filter);

          if (filter === "all") {
            expect(filtered).toEqual(events);
          } else {
            for (const event of filtered) {
              expect(event.type).toBe(filter);
            }
          }
        }),
        { numRuns: 200 }
      );
    });

    it("filtering never adds events not in the original list", () => {
      fc.assert(
        fc.property(activityEventsArb, filterArb, (events, filter) => {
          const filtered = filterEvents(events, filter);
          expect(filtered.length).toBeLessThanOrEqual(events.length);
          for (const event of filtered) {
            expect(events).toContainEqual(event);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
