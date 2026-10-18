-- Migration: Storage buckets for group and community logos/images
-- Two distinct buckets keep group and community assets separated. Buckets are
-- public (served via direct URL, no SELECT policy — consistent with the
-- security hardening in 20260425000005). Writes are scoped to the uploader's
-- own folder ({userId}/...), matching generateStoragePath().

-- =============================================================================
-- 1. Buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-images',
  'group-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. RLS policies (INSERT / UPDATE / DELETE scoped to the uploader's folder)
-- =============================================================================

-- ---- group-images ----
CREATE POLICY "Authenticated users can upload group images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'group-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own group images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'group-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own group images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'group-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---- community-images ----
CREATE POLICY "Authenticated users can upload community images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own community images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'community-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own community images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'community-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
