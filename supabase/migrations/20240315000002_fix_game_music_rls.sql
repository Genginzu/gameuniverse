-- Fix: Replace broken game_music RLS policy that directly queries auth.users
-- The old policy caused "permission denied for table users" (code 42501)
-- because the anon/authenticated role cannot SELECT from auth.users.
-- Use public.is_admin() (SECURITY DEFINER) instead, consistent with all other tables.

-- Drop the broken policy (may not exist if migration was re-applied)
DROP POLICY IF EXISTS "game_music_admin_write" ON public.game_music;

-- Recreate with the correct function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'game_music' AND policyname = 'Admins can manage game_music'
  ) THEN
    CREATE POLICY "Admins can manage game_music"
      ON public.game_music
      FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- Add development insert/update policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'game_music' AND policyname = 'Allow insert game_music for development'
  ) THEN
    CREATE POLICY "Allow insert game_music for development"
      ON public.game_music
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'game_music' AND policyname = 'Allow update game_music for development'
  ) THEN
    CREATE POLICY "Allow update game_music for development"
      ON public.game_music
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
