-- Update is_admin to also check user_metadata role
-- Previously only checked email domain @admin.gamesuniverse.com
-- Now also checks raw_user_meta_data->>'role' = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND (
      email LIKE '%@admin.gamesuniverse.com'
      OR raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
