-- Migration: Création du bucket Supabase Storage pour les images de posts
-- Objectif: Permettre aux joueurs d'uploader des images dans leurs posts
-- au lieu de coller des URLs externes (résout les erreurs next/image hostname).

-- =============================================================================
-- 1. Création du bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
-- =============================================================================
-- 2. Politiques RLS
-- =============================================================================

-- Lecture publique
CREATE POLICY "Post images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');
-- Upload réservé aux utilisateurs authentifiés, dans leur propre dossier
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
-- Suppression réservée au propriétaire du fichier
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
