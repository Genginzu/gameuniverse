-- Scope direct avatar / banner uploads to the uploader's own folder.
--
-- Context:
--   "Authenticated users can upload avatars" / "... banners" (20240316000001)
--   only checked bucket_id, so any signed-in user could write objects into
--   another user's folder (avatars/<victim-id>/...) or use the public buckets
--   as free file hosting. post-images, group-images and community-images
--   already require the first path segment to be auth.uid().
--
-- Fix:
--   Recreate both INSERT policies with the same folder check. The app uploads
--   through signed URLs generated server-side under `${userId}/...`, so it is
--   unaffected.

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
CREATE POLICY "Authenticated users can upload banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
