-- Migration: Politiques RLS admin pour character_comments
-- Permet aux administrateurs de modifier et supprimer tout commentaire,
-- indépendamment de l'auteur original.

-- Supprimer l'ancienne politique de mise à jour (limitée à l'auteur)
-- pour la remplacer par une version incluant les admins
DROP POLICY IF EXISTS "Users can update their own comments" ON character_comments;
-- Mise à jour : auteur OU administrateur
CREATE POLICY "Users can update their own comments or admins can update any"
  ON character_comments FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
-- Suppression par un administrateur uniquement
CREATE POLICY "Admins can delete any comment"
  ON character_comments FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
