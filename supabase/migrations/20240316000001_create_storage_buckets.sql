-- Migration: Création des buckets Supabase Storage pour avatars et bannières
-- Objectif: Créer les buckets `avatars` et `banners` (publics) avec politiques RLS,
-- contraintes MIME types (image/jpeg, image/png, image/webp, image/gif) et taille max 5 Mo.
-- Requirements: 1.1, 1.2, 10.1, 10.2, 10.3, 10.4, 10.5

-- =============================================================================
-- 1. Création des buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880, -- 5 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Politiques RLS pour le bucket `avatars`
-- =============================================================================

-- Lecture publique (anon + authenticated)
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Upload réservé aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Suppression réservée au propriétaire du fichier
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- 3. Politiques RLS pour le bucket `banners`
-- =============================================================================

-- Lecture publique (anon + authenticated)
CREATE POLICY "Banners are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Upload réservé aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners');

-- Suppression réservée au propriétaire du fichier
CREATE POLICY "Users can delete their own banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'banners'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
