-- Migration: Review Votes
-- Système de votes « utile / pas utile » sur les avis de jeux.
-- Permet aux joueurs authentifiés d'indiquer si un avis est pertinent.

-- ========================================
-- TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES game_reviews(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id)
);
COMMENT ON TABLE public.review_votes IS 'Votes « utile / pas utile » émis par les joueurs sur les avis de jeux';
COMMENT ON COLUMN public.review_votes.id IS 'Identifiant unique du vote';
COMMENT ON COLUMN public.review_votes.user_id IS 'Identifiant du joueur ayant émis le vote';
COMMENT ON COLUMN public.review_votes.review_id IS 'Identifiant de l''avis concerné';
COMMENT ON COLUMN public.review_votes.vote_type IS 'Type de vote : helpful ou not_helpful';
COMMENT ON COLUMN public.review_votes.created_at IS 'Date de création du vote';
-- ========================================
-- INDEX
-- ========================================

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);
-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
-- Lecture publique (nécessaire pour l'agrégation des compteurs)
CREATE POLICY "Review votes are publicly readable"
  ON review_votes FOR SELECT
  USING (true);
-- Insertion par le propriétaire du vote
CREATE POLICY "Users can insert their own votes"
  ON review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Mise à jour par le propriétaire du vote
CREATE POLICY "Users can update their own votes"
  ON review_votes FOR UPDATE
  USING (auth.uid() = user_id);
-- Suppression par le propriétaire du vote
CREATE POLICY "Users can delete their own votes"
  ON review_votes FOR DELETE
  USING (auth.uid() = user_id);
