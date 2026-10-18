import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/admin-auth";

/**
 * Resolve a user's role from `app_metadata.role`.
 *
 * Only `app_metadata` is trusted: it can be written by the service role alone,
 * whereas `user_metadata` is editable by the user through `auth.updateUser()`
 * and must never grant privileges (issue #390). Keep in sync with the SQL
 * `public.is_admin()` function.
 */
export function getUserRoleFromUser(user: User | null): UserRole {
  const appRole = user?.app_metadata?.role;
  if (appRole === "admin" || appRole === "contributor") return appRole;
  return "user";
}
