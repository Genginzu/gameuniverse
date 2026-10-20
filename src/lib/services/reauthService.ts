import { createClient, type User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { hasPasswordLogin, isRecentSignIn } from "@/lib/utils/accountDeletion";

export type ReauthResult = "ok" | "invalidPassword" | "reauthRequired";

/**
 * Checks the password with a throwaway client so the caller's session cookies
 * are untouched, then revokes the extra session that sign-in created.
 */
async function verifyPassword(email: string, password: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase environment variables");

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;

  const { error: signOutError } = await client.auth.signOut({ scope: "local" });
  if (signOutError) {
    logger.warn("Could not revoke the re-authentication session", { error: signOutError.message });
  }
  return true;
}

/**
 * Re-authentication before a destructive action: password accounts must type
 * their password; OAuth-only accounts must have signed in within minutes.
 */
export async function reauthenticate(user: User, password?: string): Promise<ReauthResult> {
  if (hasPasswordLogin(user) && user.email) {
    if (!password) return "reauthRequired";
    return (await verifyPassword(user.email, password)) ? "ok" : "invalidPassword";
  }
  return isRecentSignIn(user.last_sign_in_at) ? "ok" : "reauthRequired";
}
