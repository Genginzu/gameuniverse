-- Migration: Game Reviews System
-- Table pour les avis des joueurs sur les jeux

CREATE TABLE public.game_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 20),
  content TEXT NOT NULL,
  positive_points TEXT[] NOT NULL DEFAULT '{}',
  negative_points TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Index pour les performances
CREATE INDEX idx_game_reviews_game_id ON game_reviews(game_id);
CREATE INDEX idx_game_reviews_user_id ON game_reviews(user_id);
CREATE INDEX idx_game_reviews_created_at ON game_reviews(created_at DESC);

-- RLS
ALTER TABLE game_reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Reviews are publicly readable"
  ON game_reviews FOR SELECT USING (true);

-- Insertion par l'auteur authentifié
CREATE POLICY "Users can insert their own reviews"
  ON game_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour par l'auteur
CREATE POLICY "Users can update their own reviews"
  ON game_reviews FOR UPDATE
  USING (auth.uid() = user_id);
