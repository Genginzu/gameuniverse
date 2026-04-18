import type { GamingPlatform } from "@/types/linked-platforms";

export const FRIEND_CODE_REGEX = /^SW-\d{4}-\d{4}-\d{4}$/;

export type ValidationErrorCode =
  | "empty"
  | "format"
  | "not_found"
  | "unreachable";

export class ManualPlatformValidationError extends Error {
  code: ValidationErrorCode;
  constructor(code: ValidationErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/**
 * Normalize a Nintendo Friend Code to the canonical uppercase form.
 * Returns null when the input doesn't match SW-NNNN-NNNN-NNNN.
 */
export function normalizeFriendCode(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  return FRIEND_CODE_REGEX.test(upper) ? upper : null;
}

async function verifyGogProfile(username: string): Promise<boolean> {
  const url = `https://www.gog.com/u/${encodeURIComponent(username)}`;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      redirect: "manual",
    });
    // GOG returns 200 for existing profiles and 302 (to /) for missing ones.
    return res.status === 200;
  } catch {
    throw new ManualPlatformValidationError("unreachable");
  }
}

/**
 * Validate and normalize a manual platform username before persistence.
 * Throws ManualPlatformValidationError on invalid input.
 * Returns the canonical string to store.
 */
export async function validateManualUsername(
  platform: GamingPlatform,
  raw: string
): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) throw new ManualPlatformValidationError("empty");

  if (platform === "nintendo") {
    const normalized = normalizeFriendCode(trimmed);
    if (!normalized) throw new ManualPlatformValidationError("format");
    return normalized;
  }

  if (platform === "gog") {
    const exists = await verifyGogProfile(trimmed);
    if (!exists) throw new ManualPlatformValidationError("not_found");
    return trimmed;
  }

  return trimmed;
}
