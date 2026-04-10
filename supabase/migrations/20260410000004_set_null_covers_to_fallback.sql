-- Migration: Set all NULL cover images to the no-cover fallback
-- Games without a cover from IGDB get the default placeholder.

UPDATE public.games
SET cover_image_url = '/assets/no-cover.png'
WHERE cover_image_url IS NULL;
