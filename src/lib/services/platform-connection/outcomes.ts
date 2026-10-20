import { withParams } from "@/lib/services/oauthReturn";
import type { ConnectionOutcome, ConnectionProvider } from "@/types/platform-connection";

const MAX_DETAIL_LENGTH = 160;

export function callbackUrl(baseUrl: string, provider: ConnectionProvider): string {
  return `${baseUrl}/api/auth/${provider}/callback`;
}

export function callbackFailedCode(provider: ConnectionProvider): string {
  return `${provider}_callback_failed`;
}

export function unauthorizedLocation(baseUrl: string): string {
  return `${baseUrl}/auth?error=unauthorized`;
}

export function fallbackFailureLocation(baseUrl: string, provider: ConnectionProvider): string {
  return `${baseUrl}/?error=${callbackFailedCode(provider)}`;
}

function outcomeParams(
  provider: ConnectionProvider,
  outcome: Exclude<ConnectionOutcome, { status: "unauthorized" }>
): Record<string, string> {
  if (outcome.status === "linked") return { platform: provider, success: "true" };
  return {
    error: callbackFailedCode(provider),
    reason: outcome.reason,
    ...(outcome.detail ? { detail: outcome.detail.slice(0, MAX_DETAIL_LENGTH) } : {}),
  };
}

export function outcomeLocation(
  baseUrl: string,
  provider: ConnectionProvider,
  outcome: ConnectionOutcome,
  returnTo: string | null
): string {
  if (outcome.status === "unauthorized") return unauthorizedLocation(baseUrl);
  const destination = returnTo ?? `/players/${outcome.playerId}?tab=settings`;
  return `${baseUrl}${withParams(destination, outcomeParams(provider, outcome))}`;
}
