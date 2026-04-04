-- Migration: Add RLS policies for rating tables
-- Allow API to manage age ratings (INSERT, UPDATE, DELETE)
-- Using DROP IF EXISTS + CREATE to avoid conflicts

-- rating_systems
DROP POLICY IF EXISTS "Allow insert for development" ON rating_systems;
DROP POLICY IF EXISTS "Allow update for development" ON rating_systems;
DROP POLICY IF EXISTS "Allow delete for development" ON rating_systems;
CREATE POLICY "Allow insert for development" ON rating_systems FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON rating_systems FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON rating_systems FOR DELETE USING (true);
-- ratings
DROP POLICY IF EXISTS "Allow insert for development" ON ratings;
DROP POLICY IF EXISTS "Allow update for development" ON ratings;
DROP POLICY IF EXISTS "Allow delete for development" ON ratings;
CREATE POLICY "Allow insert for development" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON ratings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON ratings FOR DELETE USING (true);
-- content_descriptors
DROP POLICY IF EXISTS "Allow insert for development" ON content_descriptors;
DROP POLICY IF EXISTS "Allow update for development" ON content_descriptors;
DROP POLICY IF EXISTS "Allow delete for development" ON content_descriptors;
CREATE POLICY "Allow insert for development" ON content_descriptors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON content_descriptors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON content_descriptors FOR DELETE USING (true);
-- content_descriptor_translations
DROP POLICY IF EXISTS "Allow insert for development" ON content_descriptor_translations;
DROP POLICY IF EXISTS "Allow update for development" ON content_descriptor_translations;
DROP POLICY IF EXISTS "Allow delete for development" ON content_descriptor_translations;
CREATE POLICY "Allow insert for development" ON content_descriptor_translations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON content_descriptor_translations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON content_descriptor_translations FOR DELETE USING (true);
-- game_ratings
DROP POLICY IF EXISTS "Allow insert for development" ON game_ratings;
DROP POLICY IF EXISTS "Allow update for development" ON game_ratings;
DROP POLICY IF EXISTS "Allow delete for development" ON game_ratings;
CREATE POLICY "Allow insert for development" ON game_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON game_ratings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON game_ratings FOR DELETE USING (true);
-- game_rating_descriptors
DROP POLICY IF EXISTS "Allow insert for development" ON game_rating_descriptors;
DROP POLICY IF EXISTS "Allow update for development" ON game_rating_descriptors;
DROP POLICY IF EXISTS "Allow delete for development" ON game_rating_descriptors;
CREATE POLICY "Allow insert for development" ON game_rating_descriptors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON game_rating_descriptors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON game_rating_descriptors FOR DELETE USING (true);
