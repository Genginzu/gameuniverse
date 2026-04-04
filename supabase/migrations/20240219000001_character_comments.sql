-- Migration: Character Comments System
-- Table pour les commentaires des joueurs sur les personnages.
-- Un joueur peut laisser un seul commentaire par personnage (texte simple, max 1000 caractères).

CREATE TABLE public.character_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, character_id)
);
-- Index pour les performances
CREATE INDEX idx_character_comments_character_id ON character_comments(character_id);
CREATE INDEX idx_character_comments_user_id ON character_comments(user_id);
CREATE INDEX idx_character_comments_created_at ON character_comments(created_at DESC);
-- RLS
ALTER TABLE character_comments ENABLE ROW LEVEL SECURITY;
-- Lecture publique
CREATE POLICY "Comments are publicly readable"
  ON character_comments FOR SELECT USING (true);
-- Insertion par l'auteur authentifié
CREATE POLICY "Users can insert their own comments"
  ON character_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Mise à jour par l'auteur
CREATE POLICY "Users can update their own comments"
  ON character_comments FOR UPDATE
  USING (auth.uid() = user_id);
