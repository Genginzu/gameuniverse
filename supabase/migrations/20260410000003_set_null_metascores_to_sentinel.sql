-- Migration: Set all NULL metascores to -1 sentinel
-- Games with NULL metascore have already been checked via IGDB bulk import.
-- Setting them to -1 removes them from the "missing metascore" list.

UPDATE public.games
SET metascore = -1
WHERE metascore IS NULL;
