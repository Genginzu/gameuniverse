import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { resolveDisplayName } from "@/lib/utils/user-display";

/**
 * Feature: navigation-sidebar
 * Propriété 3 : Résolution du nom d'affichage utilisateur
 *
 * Pour tout objet User, le résultat ne doit jamais être vide :
 * username si présent, sinon partie avant @ de l'email, sinon fallback.
 */
describe("Feature: navigation-sidebar — Propriété 3 : Résolution du nom d'affichage utilisateur", () => {
  const nonEmptyTrimmed = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

  const emailArb = fc
    .tuple(
      fc.stringMatching(/^[a-zA-Z0-9._-]{1,20}$/),
      fc.stringMatching(/^[a-zA-Z0-9.-]{1,15}\.[a-zA-Z]{2,4}$/)
    )
    .map(([local, domain]) => `${local}@${domain}`);

  const userArb = fc.record({
    user_metadata: fc.option(
      fc.record({
        username: fc.option(fc.oneof(fc.string(), fc.constant("")), { nil: undefined }),
      }),
      { nil: undefined }
    ),
    email: fc.option(fc.oneof(emailArb, fc.string(), fc.constant("")), { nil: undefined }),
  });

  it("should never return an empty string", () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const result = resolveDisplayName(user);
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });

  it("should return username when it is a non-empty string", () => {
    fc.assert(
      fc.property(
        nonEmptyTrimmed,
        fc.option(fc.string(), { nil: undefined }),
        (username, email) => {
          const user = { user_metadata: { username }, email };
          const result = resolveDisplayName(user);
          expect(result).toBe(username.trim());
        }
      ),
      { numRuns: 200 }
    );
  });

  it("should return email prefix when username is absent and email contains @", () => {
    fc.assert(
      fc.property(emailArb, (email) => {
        const user = { user_metadata: undefined, email };
        const result = resolveDisplayName(user);
        const expectedPrefix = email.split("@")[0].trim();
        expect(result).toBe(expectedPrefix);
      }),
      { numRuns: 200 }
    );
  });

  it("should return fallback when both username and email are missing", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, { user_metadata: undefined, email: undefined }),
        (user) => {
          const result = resolveDisplayName(user as Parameters<typeof resolveDisplayName>[0]);
          expect(result).toBe("User");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return custom fallback when provided and no username/email available", () => {
    fc.assert(
      fc.property(nonEmptyTrimmed, (fallback) => {
        const result = resolveDisplayName(undefined, fallback);
        expect(result).toBe(fallback);
      }),
      { numRuns: 100 }
    );
  });

  it("should prioritize username over email", () => {
    fc.assert(
      fc.property(nonEmptyTrimmed, emailArb, (username, email) => {
        const user = { user_metadata: { username }, email };
        const result = resolveDisplayName(user);
        expect(result).toBe(username.trim());
      }),
      { numRuns: 200 }
    );
  });
});
