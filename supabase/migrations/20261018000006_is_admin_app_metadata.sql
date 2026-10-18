-- Derive the admin role from app_metadata only (issue #390).
--
-- Context:
--   is_admin() (20240210000001) granted admin rights when
--   raw_user_meta_data->>'role' = 'admin' or when the email ended with
--   @admin.gamesuniverse.com. raw_user_meta_data is user_metadata, which any
--   signed-in user can rewrite for their own account through
--   supabase.auth.updateUser(), so it must never grant privileges. The email
--   domain rule was unused and is removed.
--
-- Fix:
--   is_admin() now reads raw_app_meta_data->>'role', which only the service
--   role can write. The signature is unchanged, so the RLS policies that call
--   is_admin() keep working without being recreated. Existing admins must have
--   app_metadata.role = 'admin' set (service role) before this migration runs.
--   Keep in sync with getUserRoleFromUser() in src/lib/utils/userRole.ts.

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = user_id
      AND u.raw_app_meta_data->>'role' = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS
  'True when auth.users.raw_app_meta_data->>''role'' = ''admin''. app_metadata is '
  'writable by the service role only; user_metadata is never trusted (issue #390).';
