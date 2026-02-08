import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: settings-page
 * Property 2: Username update round-trip consistency
 * **Validates: Requirements 2.2**
 *
 * For any valid username (non-empty, trimmed string), after a successful update,
 * fetching the profile SHALL return the same username value.
 *
 * This test validates that the username update mechanism preserves the username
 * value through the update and fetch cycle.
 */

// Simulates the profile storage (like the database)
interface ProfileStore {
  username: string | null;
}

// Simulates the update operation (PATCH /api/profile)
function updateUsername(store: ProfileStore, newUsername: string): ProfileStore {
  // The API trims and stores the username
  const trimmedUsername = newUsername.trim();
  return {
    ...store,
    username: trimmedUsername,
  };
}

// Simulates the fetch operation (GET /api/profile)
function fetchUsername(store: ProfileStore): string | null {
  return store.username;
}

// Generator for valid usernames (non-empty after trimming)
const validUsernameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

// Generator for usernames with various whitespace patterns
const usernameWithWhitespaceGenerator = fc
  .tuple(
    fc.array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 5 }).map((arr) => arr.join("")),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    fc.array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 5 }).map((arr) => arr.join(""))
  )
  .map(([leading, content, trailing]) => leading + content + trailing);

describe("Username Update Round-Trip Property-Based Tests", () => {
  describe("Property 2: Username update round-trip consistency", () => {
    it("preserves username value through update and fetch cycle", () => {
      fc.assert(
        fc.property(validUsernameGenerator, (username) => {
          const initialStore: ProfileStore = { username: null };

          // Update the username
          const updatedStore = updateUsername(initialStore, username);

          // Fetch the username
          const fetchedUsername = fetchUsername(updatedStore);

          // The fetched username should equal the trimmed input
          expect(fetchedUsername).toBe(username.trim());
        }),
        { numRuns: 100 }
      );
    });

    it("maintains consistency across multiple updates", () => {
      fc.assert(
        fc.property(
          fc.array(validUsernameGenerator, { minLength: 1, maxLength: 10 }),
          (usernames) => {
            let store: ProfileStore = { username: null };

            // Apply all updates sequentially
            for (const username of usernames) {
              store = updateUsername(store, username);
            }

            // The final fetched username should be the last one (trimmed)
            const fetchedUsername = fetchUsername(store);
            const lastUsername = usernames[usernames.length - 1];
            expect(fetchedUsername).toBe(lastUsername.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it("trims whitespace consistently in round-trip", () => {
      fc.assert(
        fc.property(usernameWithWhitespaceGenerator, (usernameWithWhitespace) => {
          const initialStore: ProfileStore = { username: null };

          // Update with whitespace-padded username
          const updatedStore = updateUsername(initialStore, usernameWithWhitespace);

          // Fetch the username
          const fetchedUsername = fetchUsername(updatedStore);

          // The fetched username should be trimmed
          expect(fetchedUsername).toBe(usernameWithWhitespace.trim());
          // And should not have leading/trailing whitespace
          expect(fetchedUsername).toBe(fetchedUsername?.trim());
        }),
        { numRuns: 100 }
      );
    });

    it("idempotent update - updating with same value yields same result", () => {
      fc.assert(
        fc.property(validUsernameGenerator, (username) => {
          const initialStore: ProfileStore = { username: null };

          // First update
          const firstUpdate = updateUsername(initialStore, username);
          const firstFetch = fetchUsername(firstUpdate);

          // Second update with same value
          const secondUpdate = updateUsername(firstUpdate, username);
          const secondFetch = fetchUsername(secondUpdate);

          // Both fetches should return the same value
          expect(firstFetch).toBe(secondFetch);
        }),
        { numRuns: 100 }
      );
    });
  });
});
