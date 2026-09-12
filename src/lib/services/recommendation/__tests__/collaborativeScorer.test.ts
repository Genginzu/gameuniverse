import { describe, it, expect } from "vitest";
import {
  computeCollaborativeScore,
  type CollaborativeScoreInput,
} from "@/lib/services/recommendation/collaborativeScorer";

describe("computeCollaborativeScore", () => {
  it("returns normalized co-occurrence when data is sufficient", () => {
    const input: CollaborativeScoreInput = {
      sourceGameId: "game-1",
      candidateGameId: "game-2",
      coOccurrenceCount: 3,
      sourceGameLibraryCount: 10,
    };
    expect(computeCollaborativeScore(input)).toBeCloseTo(0.3);
  });

  it("returns 1 when all libraries containing source also contain candidate", () => {
    const input: CollaborativeScoreInput = {
      sourceGameId: "game-1",
      candidateGameId: "game-2",
      coOccurrenceCount: 5,
      sourceGameLibraryCount: 5,
    };
    expect(computeCollaborativeScore(input)).toBe(1);
  });

  it("returns 0 when sourceGameLibraryCount is 0", () => {
    const input: CollaborativeScoreInput = {
      sourceGameId: "game-1",
      candidateGameId: "game-2",
      coOccurrenceCount: 0,
      sourceGameLibraryCount: 0,
    };
    expect(computeCollaborativeScore(input)).toBe(0);
  });

  it("returns 0 when sourceGameLibraryCount is 1 (fewer than 2)", () => {
    const input: CollaborativeScoreInput = {
      sourceGameId: "game-1",
      candidateGameId: "game-2",
      coOccurrenceCount: 1,
      sourceGameLibraryCount: 1,
    };
    expect(computeCollaborativeScore(input)).toBe(0);
  });

  it("returns 0 when coOccurrenceCount is 0", () => {
    const input: CollaborativeScoreInput = {
      sourceGameId: "game-1",
      candidateGameId: "game-2",
      coOccurrenceCount: 0,
      sourceGameLibraryCount: 10,
    };
    expect(computeCollaborativeScore(input)).toBe(0);
  });

  it("returns correct ratio for partial co-occurrence", () => {
    const input: CollaborativeScoreInput = {
      sourceGameId: "game-1",
      candidateGameId: "game-2",
      coOccurrenceCount: 7,
      sourceGameLibraryCount: 20,
    };
    expect(computeCollaborativeScore(input)).toBeCloseTo(0.35);
  });
});
