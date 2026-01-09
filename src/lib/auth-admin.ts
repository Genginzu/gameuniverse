import { createRouteHandlerClient } from "@/lib/supabase-server";

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

    // Check if user email ends with admin domain
    return user.email?.endsWith("@admin.gamesuniverse.com") || false;
  } catch (error) {
    console.error("Error checking admin status:", error);
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
