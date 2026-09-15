import { describe, it, expect } from "vitest";
import { estimateGameHours, computeRemainingHours } from "@/lib/services/backlog/estimatePlaytime";

describe("estimateGameHours", () => {
  it("returns null for null/undefined input", () => {
    expect(estimateGameHours(null)).toBeNull();
    expect(estimateGameHours(undefined)).toBeNull();
  });

  it("returns null when no usable data", () => {
    expect(estimateGameHours({})).toBeNull();
    expect(estimateGameHours({ hastily: 0, normally: null, completely: 0 })).toBeNull();
    expect(estimateGameHours({ normally: -5 })).toBeNull();
  });

  it("prefers the normal playthrough length", () => {
    expect(estimateGameHours({ hastily: 5, normally: 12, completely: 40 })).toBe(12);
  });

  it("averages hastily and completely when normally is missing", () => {
    expect(estimateGameHours({ hastily: 10, completely: 30 })).toBe(20);
  });

  it("falls back to hastily alone", () => {
    expect(estimateGameHours({ hastily: 8 })).toBe(8);
  });

  it("falls back to completely alone", () => {
    expect(estimateGameHours({ completely: 50 })).toBe(50);
  });

  it("rounds to one decimal", () => {
    expect(estimateGameHours({ hastily: 5, completely: 8 })).toBe(6.5);
    expect(estimateGameHours({ normally: 12.34 })).toBe(12.3);
  });
});

describe("computeRemainingHours", () => {
  it("returns null when there is no estimate", () => {
    expect(computeRemainingHours(null, 5)).toBeNull();
  });

  it("subtracts played hours from the estimate", () => {
    expect(computeRemainingHours(20, 8)).toBe(12);
  });

  it("clamps to 0 when played exceeds the estimate", () => {
    expect(computeRemainingHours(10, 25)).toBe(0);
  });

  it("returns the full estimate when nothing is played", () => {
    expect(computeRemainingHours(20, 0)).toBe(20);
  });

  it("ignores negative played hours", () => {
    expect(computeRemainingHours(20, -5)).toBe(20);
  });

  it("rounds to one decimal", () => {
    expect(computeRemainingHours(12.34, 0)).toBe(12.3);
  });
});
