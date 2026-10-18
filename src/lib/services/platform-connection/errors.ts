import type { ConnectionFailureReason } from "@/types/platform-connection";

export class PlatformConnectionError extends Error {
  readonly reason: ConnectionFailureReason;
  readonly detail?: string;

  constructor(reason: ConnectionFailureReason, detail?: string, message?: string) {
    super(message ?? detail ?? reason);
    this.name = "PlatformConnectionError";
    this.reason = reason;
    this.detail = detail;
  }
}

export function toConnectionError(
  error: unknown,
  fallback: ConnectionFailureReason
): PlatformConnectionError {
  if (error instanceof PlatformConnectionError) return error;
  const message = error instanceof Error ? error.message : undefined;
  return new PlatformConnectionError(fallback, undefined, message);
}
