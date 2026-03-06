/**
 * Resolves the display name for a user.
 *
 * Priority: username from user_metadata > email prefix (before @) > fallback.
 * The result is guaranteed to be a non-empty string.
 */
export function resolveDisplayName(
  user: { user_metadata?: { username?: string }; email?: string | null } | null | undefined,
  fallback = "User"
): string {
  const username = user?.user_metadata?.username;
  if (username && typeof username === "string" && username.trim().length > 0) {
    return username.trim();
  }

  const email = user?.email;
  if (email && typeof email === "string" && email.includes("@")) {
    const prefix = email.split("@")[0];
    if (prefix && prefix.trim().length > 0) {
      return prefix.trim();
    }
  }

  return fallback;
}
