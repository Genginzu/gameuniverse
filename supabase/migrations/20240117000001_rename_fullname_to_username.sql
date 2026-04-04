-- Migration: Rename full_name to username in profiles table
-- Plus cohérent avec le naming utilisé dans auth.users.raw_user_meta_data

-- Renommer la colonne
ALTER TABLE profiles RENAME COLUMN full_name TO username;
-- Mettre à jour l'index
DROP INDEX IF EXISTS idx_profiles_full_name;
CREATE INDEX idx_profiles_username ON profiles(username);
-- Mettre à jour le trigger de création de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, preferred_locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_locale', 'fr')
  );
  RETURN NEW;
END;
$$;
