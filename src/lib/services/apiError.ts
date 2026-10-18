import { mutate } from "swr";

/** SWR key of the signed-in user's suspension status. */
export const MY_SUSPENSION_KEY = "/api/players/me/suspension";

export interface ApiError extends Error {
  code?: string;
  status?: number;
  suspendedUntil?: string | null;
}

/**
 * Build an Error from a failed API response, keeping the machine-readable `code`.
 * A "suspended" answer also refreshes the suspension status so every
 * SuspensionGate on the page switches to the suspension notice.
 */
export async function createApiError(response: Response, fallback: string): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  const error: ApiError = new Error(body?.error || fallback);
  error.status = response.status;
  if (body?.code) error.code = body.code;

  if (body?.code === "suspended") {
    error.suspendedUntil = body.suspendedUntil ?? null;
    void mutate(MY_SUSPENSION_KEY);
  }
  return error;
}

/** True when the error comes from a write rejected because the account is suspended. */
export function isSuspendedError(error: unknown): boolean {
  return (error as ApiError | null)?.code === "suspended";
}
