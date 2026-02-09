"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "contributor" | "user";

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface UseAdminAuthReturn {
  user: AdminUser | null;
  isAdmin: boolean;
  isContributor: boolean;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  loading: boolean;
  error: Error | null;
}

const ADMIN_DOMAIN = "@admin.gamesuniverse.com";
const CONTRIBUTOR_DOMAIN = "@contributor.gamesuniverse.com";

/**
 * Determine user role based on email domain or user metadata.
 */
export function getUserRoleFromUser(user: User | null): UserRole {
  if (!user || !user.email) return "user";

  if (user.email.endsWith(ADMIN_DOMAIN)) return "admin";
  if (user.email.endsWith(CONTRIBUTOR_DOMAIN)) return "contributor";

  // Check user metadata for role override
  const metadataRole = user.user_metadata?.role as string | undefined;
  if (metadataRole === "admin") return "admin";
  if (metadataRole === "contributor") return "contributor";

  return "user";
}

const ROLE_PERMISSIONS: Record<
  UserRole,
  { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }
> = {
  admin: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  contributor: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  user: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
};

export function getPermissionsForRole(role: UserRole) {
  return ROLE_PERMISSIONS[role];
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const {
          data: { user: supabaseUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authError || !supabaseUser) {
          setUser(null);
          setLoading(false);
          if (authError) setError(new Error(authError.message));
          return;
        }

        const role = getUserRoleFromUser(supabaseUser);
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          role,
        });
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error("Failed to load user"));
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const role = user?.role ?? "user";
  const permissions = getPermissionsForRole(role);

  return {
    user,
    isAdmin: role === "admin",
    isContributor: role === "contributor",
    ...permissions,
    loading,
    error,
  };
}
