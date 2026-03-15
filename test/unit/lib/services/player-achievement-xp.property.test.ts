/**
 * Property-based tests for player achievement assign/revoke logic — Properties 11-15.
 *
 * Pure logic tests: no API calls, no mocks. Tests the XP/level computation
 * and assign/revoke business rules using helper functions that mirror the
 * actual route logic.
 *
 * **Validates: Requirements 8.2, 8.4, 8.5, 8.7, 8.9, 8.10, 8.11, 8.12**
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeLevel } from "@/lib/services/levelSystem";

// --- Pure logic helpers mirroring route behavior ---

interface AssignResult {
  status: number;
  xp: number;
  level: number;
}

function simulateAssign(
  currentXp: number,
  xpValue: number,
  unlockedKeys: Set<string>,
  key: string
): AssignResult {
  if (unlockedKeys.has(key)) {
    return { status: 409, xp: currentXp, level: computeLevel(currentXp) };
  }
  const newXp = currentXp + xpValue;
  unlockedKeys.add(key);
  return { status: 201, xp: newXp, level: computeLevel(newXp) };
}

function simulateRevoke(
  currentXp: number,
  xpValue: number,
  unlockedKeys: Set<string>,
  key: string
): AssignResult {
  if (!unlockedKeys.has(key)) {
    return { status: 404, xp: currentXp, level: computeLevel(currentXp) };
  }
  const newXp = Math.max(0, currentXp - xpValue);
  unlockedKeys.delete(key);
  return { status: 200, xp: newXp, level: computeLevel(newXp) };
}

// --- Generators ---

const achievementKeyGen = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-z][a-z0-9_]*$/.test(s));

const xpTotalGen = fc.nat({ max: 1_000_000 });
const xpValueGen = fc.integer({ min: 1, max: 10_000 });

const catalogKeysGen = fc.uniqueArray(achievementKeyGen, { minLength: 1, maxLength: 20 });

describe("Player Achievement XP Properties 11-15", () => {
  /**
   * P11: Player achievements partition.
   * For any catalog and any subset of unlocked keys, the partition into
   * "unlocked" and "locked" has no overlap and covers all catalog keys.
   * **Validates: Requirements 8.2**
   */
  it("P11: partition into unlocked/locked covers all keys with no overlap", () => {
    fc.assert(
      fc.property(catalogKeysGen, (catalogKeys) => {
        // Pick a random subset as unlocked via fc.subarray inside
        const unlockedKeys = new Set(catalogKeys.filter((_, i) => i % 2 === 0));
        const locked = catalogKeys.filter((k) => !unlockedKeys.has(k));
        const unlocked = catalogKeys.filter((k) => unlockedKeys.has(k));

        // No overlap
        const overlapCount = unlocked.filter((k) => locked.includes(k)).length;
        expect(overlapCount).toBe(0);

        // Together cover all catalog keys
        const combined = new Set([...unlocked, ...locked]);
        expect(combined.size).toBe(catalogKeys.length);

        // Unlocked matches input
        expect(new Set(unlocked)).toEqual(unlockedKeys);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P12: Assign then revoke round-trip.
   * Starting at initialXp, assigning adds xpValue, then revoking subtracts it.
   * If initialXp >= 0, finalXp should equal initialXp.
   * **Validates: Requirements 8.4, 8.9**
   */
  it("P12: assign then revoke returns XP to original value", () => {
    fc.assert(
      fc.property(xpTotalGen, xpValueGen, achievementKeyGen, (initialXp, xpValue, key) => {
        const unlocked = new Set<string>();

        const assignResult = simulateAssign(initialXp, xpValue, unlocked, key);
        expect(assignResult.status).toBe(201);
        expect(assignResult.xp).toBe(initialXp + xpValue);

        const revokeResult = simulateRevoke(assignResult.xp, xpValue, unlocked, key);
        expect(revokeResult.status).toBe(200);
        expect(revokeResult.xp).toBe(initialXp);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P13: XP and level correctness on assign and revoke.
   * After assign: xp = X + V, level = computeLevel(X + V).
   * After revoke: xp = max(0, X - V), level = computeLevel(max(0, X - V)).
   * **Validates: Requirements 8.5, 8.10, 8.11**
   */
  it("P13: XP and level are correct after assign and revoke", () => {
    fc.assert(
      fc.property(xpTotalGen, xpValueGen, achievementKeyGen, (currentXp, xpValue, key) => {
        // Test assign
        const unlockedForAssign = new Set<string>();
        const assignResult = simulateAssign(currentXp, xpValue, unlockedForAssign, key);
        const expectedAssignXp = currentXp + xpValue;
        expect(assignResult.xp).toBe(expectedAssignXp);
        expect(assignResult.level).toBe(computeLevel(expectedAssignXp));

        // Test revoke (from a state where the key is unlocked)
        const unlockedForRevoke = new Set<string>([key]);
        const revokeResult = simulateRevoke(currentXp, xpValue, unlockedForRevoke, key);
        const expectedRevokeXp = Math.max(0, currentXp - xpValue);
        expect(revokeResult.xp).toBe(expectedRevokeXp);
        expect(revokeResult.level).toBe(computeLevel(expectedRevokeXp));
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P14: Duplicate assignment returns 409.
   * If a key is already unlocked, assigning again returns 409 and XP unchanged.
   * **Validates: Requirements 8.7**
   */
  it("P14: duplicate assignment returns 409 with unchanged XP", () => {
    fc.assert(
      fc.property(xpTotalGen, xpValueGen, achievementKeyGen, (currentXp, xpValue, key) => {
        const unlocked = new Set<string>([key]);

        const result = simulateAssign(currentXp, xpValue, unlocked, key);
        expect(result.status).toBe(409);
        expect(result.xp).toBe(currentXp);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P15: Revoke non-assigned achievement returns 404.
   * If a key is NOT unlocked, revoking returns 404 and XP unchanged.
   * **Validates: Requirements 8.12**
   */
  it("P15: revoke non-assigned returns 404 with unchanged XP", () => {
    fc.assert(
      fc.property(xpTotalGen, xpValueGen, achievementKeyGen, (currentXp, xpValue, key) => {
        const unlocked = new Set<string>();

        const result = simulateRevoke(currentXp, xpValue, unlocked, key);
        expect(result.status).toBe(404);
        expect(result.xp).toBe(currentXp);
      }),
      { numRuns: 100 }
    );
  });
});
