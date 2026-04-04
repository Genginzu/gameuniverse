-- Migration 001: Tables principales
-- Création des tables principales pour Game Universe

-- Table des utilisateurs (étendue de auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_locale TEXT DEFAULT 'fr',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Table des langues supportées
CREATE TABLE public.languages (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);
-- Table principale des jeux
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  developer VARCHAR(255) NOT NULL,
  publisher VARCHAR(255) NOT NULL,
  release_date DATE,
  launch_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  metascore INTEGER,
  pegi_rating INTEGER,
  esrb_rating VARCHAR(10),
  system_requirements JSONB,
  media JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Table des traductions de jeux
CREATE TABLE public.game_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  language_code VARCHAR(2) REFERENCES languages(code),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  UNIQUE(game_id, language_code)
);
-- Table des genres
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Table des traductions de genres
CREATE TABLE public.genre_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  language_code VARCHAR(2) REFERENCES languages(code),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(genre_id, language_code)
);
-- Table de liaison jeux-genres
CREATE TABLE public.game_genres (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);
-- Index pour les performances
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_release_date ON games(release_date);
CREATE INDEX idx_game_translations_game_id ON game_translations(game_id);
CREATE INDEX idx_game_translations_language ON game_translations(language_code);
CREATE INDEX idx_genre_translations_genre_id ON genre_translations(genre_id);
CREATE INDEX idx_genre_translations_language ON genre_translations(language_code);
CREATE INDEX idx_game_genres_game_id ON game_genres(game_id);
-- Recherche full-text multilingue
CREATE INDEX idx_game_translations_title_search ON game_translations
  USING gin(to_tsvector('french', title));
CREATE INDEX idx_game_translations_title_search_en ON game_translations
  USING gin(to_tsvector('english', title));
-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
