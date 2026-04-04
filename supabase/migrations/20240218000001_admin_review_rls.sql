-- Migration: Politiques RLS admin pour game_reviews
-- Permet aux administrateurs de modifier et supprimer toute review,
-- indépendamment de l'auteur original.

-- Supprimer l'ancienne politique de mise à jour (limitée à l'auteur)
-- pour la remplacer par une version incluant les admins
DROP POLICY IF EXISTS "Users can update their own reviews" ON game_reviews;
-- Mise à jour : auteur OU administrateur
CREATE POLICY "Users can update their own reviews or admins can update any"
  ON game_reviews FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
-- Suppression par un administrateur uniquement
CREATE POLICY "Admins can delete any review"
  ON game_reviews FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
