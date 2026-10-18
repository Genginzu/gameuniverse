import { describe, it, expect } from "vitest";
import { isDuplicateErrorMessage } from "../duplicateError";

describe("isDuplicateErrorMessage", () => {
  it.each([
    "duplicate key value violates unique constraint",
    "A game with this slug already exists",
    "Ce slug existe déjà",
    "ALREADY EXISTS",
  ])("detects %j", (message) => {
    expect(isDuplicateErrorMessage(message)).toBe(true);
  });

  it.each(["Network error", "Invalid input data", ""])("ignores %j", (message) => {
    expect(isDuplicateErrorMessage(message)).toBe(false);
  });
});
