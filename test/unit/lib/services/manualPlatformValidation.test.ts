import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeFriendCode,
  validateManualUsername,
  ManualPlatformValidationError,
} from "@/lib/services/manualPlatformValidation";

describe("normalizeFriendCode", () => {
  it.each([
    ["SW-1234-5678-9012", "SW-1234-5678-9012"],
    ["sw-1234-5678-9012", "SW-1234-5678-9012"],
    ["  SW-0000-0000-0000  ", "SW-0000-0000-0000"],
  ])("accepts and upper-cases %s", (input, expected) => {
    expect(normalizeFriendCode(input)).toBe(expected);
  });

  it.each([
    "",
    "SW-1234-5678",
    "SW-1234-5678-90123",
    "AB-1234-5678-9012",
    "SW-12A4-5678-9012",
    "1234-5678-9012",
  ])("rejects %s", (input) => {
    expect(normalizeFriendCode(input)).toBeNull();
  });
});

describe("validateManualUsername", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("throws 'empty' when the input is blank", async () => {
    await expect(validateManualUsername("gog", "   ")).rejects.toMatchObject({
      code: "empty",
    });
  });

  it("normalizes valid Nintendo friend codes", async () => {
    await expect(
      validateManualUsername("nintendo", "sw-1234-5678-9012")
    ).resolves.toBe("SW-1234-5678-9012");
  });

  it("throws 'format' on invalid friend codes", async () => {
    await expect(
      validateManualUsername("nintendo", "1234-5678-9012")
    ).rejects.toMatchObject({ code: "format" });
  });

  describe("gog", () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    it("accepts an existing profile (HTTP 200)", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 200,
      } as Response);
      await expect(validateManualUsername("gog", "someuser")).resolves.toBe(
        "someuser"
      );
    });

    it("rejects a missing profile (HTTP 302)", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 302,
      } as Response);
      await expect(validateManualUsername("gog", "missing")).rejects.toMatchObject({
        code: "not_found",
      });
    });

    it("surfaces 'unreachable' when fetch throws", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("network")
      );
      await expect(
        validateManualUsername("gog", "someuser")
      ).rejects.toBeInstanceOf(ManualPlatformValidationError);
    });
  });

  it("returns trimmed input for free-text platforms", async () => {
    await expect(validateManualUsername("ubisoft", "  CoolGamer  ")).resolves.toBe(
      "CoolGamer"
    );
  });
});
