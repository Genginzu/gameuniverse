import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { getUserRoleFromUser } from "@/lib/utils/userRole";
import type { UserRole } from "@/types/admin-auth";

export type { UserRole };
export { getUserRoleFromUser };

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
 * Check if the current user is an admin (`app_metadata.role === "admin"`).
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
