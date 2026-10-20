import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { getUserRoleFromUser } from "@/lib/utils/userRole";
import type { User } from "@supabase/supabase-js";
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

/**
 * Return the current user when they are an admin.
 * Throws "Authentication required" (401) when signed out and
 * "Admin access required" (403) for a signed-in non-admin.
 */
export async function requireAdminUser(): Promise<User> {
  const user = await getCurrentUser();
  if (getUserRoleFromUser(user) !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

/**
 * Map an error thrown by requireAdminUser() to its HTTP status, or null when
 * the error is unrelated to authentication.
 */
export function adminAuthErrorStatus(error: unknown): 401 | 403 | null {
  if (!(error instanceof Error)) return null;
  if (error.message === "Authentication required") return 401;
  if (error.message === "Admin access required") return 403;
  return null;
}

/**
 * Route guard: returns a 401/403 JSON response when the caller is not an
 * admin, or null when the handler may proceed. Call it before reading the body
 * or touching any external API.
 */
export async function adminGuardResponse(): Promise<NextResponse | null> {
  try {
    await requireAdminUser();
    return null;
  } catch (error) {
    const status = adminAuthErrorStatus(error);
    if (!status) throw error;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
