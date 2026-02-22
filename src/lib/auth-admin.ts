import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "contributor" | "user";

const ADMIN_DOMAIN = "@admin.gamesuniverse.com";
const CONTRIBUTOR_DOMAIN = "@contributor.gamesuniverse.com";

/**
 * Determine the role of a Supabase user based on email domain or metadata.
 */
export function getUserRoleFromUser(user: User | null): UserRole {
  if (!user || !user.email) return "user";

  if (user.email.endsWith(ADMIN_DOMAIN)) return "admin";
  if (user.email.endsWith(CONTRIBUTOR_DOMAIN)) return "contributor";

  const metadataRole = user.user_metadata?.role as string | undefined;
  if (metadataRole === "admin") return "admin";
  if (metadataRole === "contributor") return "contributor";

  return "user";
}

/**
 * Get the role of the currently authenticated user (server-side).
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const user = await getCurrentUser();
    return getUserRoleFromUser(user);
  } catch {
    return "user";
  }
}

/**
 * Check if the current user is an admin
 * Admin users are identified by having an email ending with @admin.gamesuniverse.com
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return getUserRoleFromUser(user) === "admin";
  } catch (error) {
    logger.error("Error checking admin status", { error });
    return false;
  }
}

/**
 * Middleware to check admin access for API routes
 */
export async function requireAdmin() {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    throw new Error("Admin access required");
  }

  return true;
}

/**
 * Middleware to check admin or contributor access for API routes.
 */
export async function requireAdminOrContributor() {
  const role = await getUserRole();

  if (role !== "admin" && role !== "contributor") {
    throw new Error("Admin or contributor access required");
  }

  return role;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createRouteHandlerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return user;
}
