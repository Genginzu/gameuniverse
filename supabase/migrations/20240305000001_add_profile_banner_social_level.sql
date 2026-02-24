-- Migration: Add banner_url, social_links and level to profiles
-- Permet aux joueurs d'avoir une image de couverture, des liens sociaux et un niveau affiché

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

COMMENT ON COLUMN profiles.banner_url IS 'URL de l''image de couverture/bannière du profil';
COMMENT ON COLUMN profiles.social_links IS 'Liens vers les réseaux sociaux (facebook, twitter, twitch, etc.)';
COMMENT ON COLUMN profiles.level IS 'Niveau du joueur affiché sur le profil';
