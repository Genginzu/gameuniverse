/** Days between a deletion request and the permanent purge. */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

/** OAuth-only accounts re-authenticate by signing in again within this window. */
export const REAUTH_MAX_AGE_MS = 10 * 60 * 1000;

const CONFIRMATION_WORDS: Record<string, string> = {
  fr: "SUPPRIMER",
  en: "DELETE",
};

/** Word the user must type to confirm, in their interface language. */
export function confirmationWordFor(locale: string): string {
  return CONFIRMATION_WORDS[locale] ?? CONFIRMATION_WORDS.fr;
}

/** Case-insensitive, whitespace-tolerant match against the locale's word. */
export function isValidConfirmation(input: string | undefined, locale: string): boolean {
  if (!input) return false;
  return input.trim().toUpperCase() === confirmationWordFor(locale);
}

export function computeDeletionSchedule(now: Date = new Date()): Date {
  return new Date(now.getTime() + ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

interface AuthIdentityLike {
  app_metadata?: { provider?: string; providers?: string[] };
  identities?: Array<{ provider?: string }> | null;
}

/** True when the account can sign in with an email + password. */
export function hasPasswordLogin(user: AuthIdentityLike): boolean {
  const providers = new Set<string>([
    ...(user.app_metadata?.providers ?? []),
    ...(user.app_metadata?.provider ? [user.app_metadata.provider] : []),
    ...(user.identities ?? []).map((identity) => identity.provider ?? ""),
  ]);
  return providers.has("email") || providers.size === 0;
}

/** True when the last sign-in is recent enough to count as a fresh login. */
export function isRecentSignIn(lastSignInAt: string | undefined, now: Date = new Date()): boolean {
  if (!lastSignInAt) return false;
  const elapsed = now.getTime() - new Date(lastSignInAt).getTime();
  return elapsed >= 0 && elapsed <= REAUTH_MAX_AGE_MS;
}
