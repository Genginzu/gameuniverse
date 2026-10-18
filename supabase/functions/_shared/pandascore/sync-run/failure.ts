export type SyncFailureReason = "rate_limited" | "transient" | "fatal";

export class PandaScoreApiError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`PandaScore API error: ${status} ${statusText}`);
    this.name = "PandaScoreApiError";
    this.status = status;
  }
}

export class PandaScoreConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PandaScoreConfigError";
  }
}

export function classifyFetchError(error: unknown): SyncFailureReason {
  if (error instanceof PandaScoreConfigError) return "fatal";
  if (!(error instanceof PandaScoreApiError)) return "transient";
  if (error.status === 429) return "rate_limited";
  if (error.status === 408 || error.status >= 500) return "transient";
  return "fatal";
}
