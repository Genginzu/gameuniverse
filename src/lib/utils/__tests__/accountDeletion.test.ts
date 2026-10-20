import { describe, it, expect } from "vitest";
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  computeDeletionSchedule,
  confirmationWordFor,
  hasPasswordLogin,
  isRecentSignIn,
  isValidConfirmation,
} from "@/lib/utils/accountDeletion";

describe("accountDeletion utils", () => {
  it("uses a localized confirmation word with a French fallback", () => {
    expect(confirmationWordFor("fr")).toBe("SUPPRIMER");
    expect(confirmationWordFor("en")).toBe("DELETE");
    expect(confirmationWordFor("de")).toBe("SUPPRIMER");
  });

  it("accepts the confirmation word case-insensitively and rejects others", () => {
    expect(isValidConfirmation(" delete ", "en")).toBe(true);
    expect(isValidConfirmation("SUPPRIMER", "en")).toBe(false);
    expect(isValidConfirmation(undefined, "fr")).toBe(false);
  });

  it("schedules the purge after the grace period", () => {
    const now = new Date("2026-10-20T10:00:00Z");
    const scheduled = computeDeletionSchedule(now);
    expect((scheduled.getTime() - now.getTime()) / 86_400_000).toBe(ACCOUNT_DELETION_GRACE_DAYS);
  });

  it("detects password accounts from provider metadata", () => {
    expect(hasPasswordLogin({ app_metadata: { provider: "email", providers: ["email"] } })).toBe(
      true
    );
    expect(hasPasswordLogin({ app_metadata: { provider: "google", providers: ["google"] } })).toBe(
      false
    );
    expect(hasPasswordLogin({ identities: [{ provider: "discord" }] })).toBe(false);
  });

  it("treats a sign-in older than ten minutes as stale", () => {
    const now = new Date("2026-10-20T10:00:00Z");
    expect(isRecentSignIn("2026-10-20T09:55:00Z", now)).toBe(true);
    expect(isRecentSignIn("2026-10-20T09:40:00Z", now)).toBe(false);
    expect(isRecentSignIn(undefined, now)).toBe(false);
  });
});
