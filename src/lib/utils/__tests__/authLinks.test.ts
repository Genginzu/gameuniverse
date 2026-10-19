import { describe, it, expect } from "vitest";
import {
  isAllowedOtpType,
  isSafeRelativePath,
  isSameOriginSubmission,
} from "@/lib/utils/authLinks";

describe("isSafeRelativePath", () => {
  it.each(["/profile", "/players/abc?tab=settings", "/@evil.com"])("accepts %s", (path) => {
    expect(isSafeRelativePath(path)).toBe(true);
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "profile", "", null, undefined])(
    "rejects %s",
    (path) => {
      expect(isSafeRelativePath(path)).toBe(false);
    }
  );
});

describe("isAllowedOtpType", () => {
  it("accepts email link types only", () => {
    expect(isAllowedOtpType("magiclink")).toBe(true);
    expect(isAllowedOtpType("recovery")).toBe(true);
    expect(isAllowedOtpType("sms")).toBe(false);
    expect(isAllowedOtpType(null)).toBe(false);
  });
});

describe("isSameOriginSubmission", () => {
  const allowed = ["https://gameuniverse.example"];

  it("trusts Sec-Fetch-Site when present", () => {
    expect(isSameOriginSubmission(new Headers({ "sec-fetch-site": "same-origin" }), allowed)).toBe(
      true
    );
    expect(
      isSameOriginSubmission(
        new Headers({ "sec-fetch-site": "cross-site", origin: "https://gameuniverse.example" }),
        allowed
      )
    ).toBe(false);
  });

  it("falls back to an allowlisted Origin, and refuses when both are missing", () => {
    expect(isSameOriginSubmission(new Headers({ origin: "https://gameuniverse.example" }), allowed)).toBe(
      true
    );
    expect(isSameOriginSubmission(new Headers({ origin: "https://evil.example" }), allowed)).toBe(
      false
    );
    expect(isSameOriginSubmission(new Headers(), allowed)).toBe(false);
  });
});
