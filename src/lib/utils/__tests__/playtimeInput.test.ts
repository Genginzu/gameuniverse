import { describe, it, expect } from "vitest";

import { parsePlaytimeInput } from "@/lib/utils/playtimeInput";

describe("parsePlaytimeInput", () => {
  it.each([
    ["250.5", 250.5],
    ["250,5", 250.5],
    [" 12 ", 12],
    ["1 250,5", 1250.5],
    [",5", 0.5],
  ])("reads %j as %d hours", (input, expected) => {
    expect(parsePlaytimeInput(input)).toBe(expected);
  });

  it("treats an empty field as no value", () => {
    expect(parsePlaytimeInput("   ")).toBeNull();
  });

  it.each(["abc", "12h", "1.2.3", "-5", "1,2,3"])("rejects %j", (input) => {
    expect(parsePlaytimeInput(input)).toBeNaN();
  });
});
