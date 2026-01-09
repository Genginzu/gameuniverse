-- Modify background_color column type and add default values
-- This migration changes the background_color column from TEXT to VARCHAR(7) for hex colors

-- Modify the existing background_color column to have proper type and default
ALTER TABLE public.games ALTER COLUMN background_color TYPE VARCHAR(7);
ALTER TABLE public.games ALTER COLUMN background_color SET DEFAULT '#000000';

-- Update comment to explain the column
COMMENT ON COLUMN public.games.background_color IS 'Hex color code for game background theme (e.g., #FF5733)';

-- Update existing games with some default colors based on their genre or randomly
-- This is optional - you can remove this section if you prefer to set colors manually
UPDATE public.games 
SET background_color = CASE 
  WHEN id IN (
    SELECT DISTINCT g.id 
    FROM games g 
    JOIN game_genres gg ON g.id = gg.game_id 
    JOIN genres gen ON gg.genre_id = gen.id 
    WHERE gen.slug = 'action'
  ) THEN '#DC2626'  -- Red for action games
  WHEN id IN (
    SELECT DISTINCT g.id 
    FROM games g 
    JOIN game_genres gg ON g.id = gg.game_id 
    JOIN genres gen ON gg.genre_id = gen.id 
    WHERE gen.slug = 'adventure'
  ) THEN '#059669'  -- Green for adventure games
  WHEN id IN (
    SELECT DISTINCT g.id 
    FROM games g 
    JOIN game_genres gg ON g.id = gg.game_id 
    JOIN genres gen ON gg.genre_id = gen.id 
    WHERE gen.slug = 'rpg'
  ) THEN '#7C3AED'  -- Purple for RPG games
  WHEN id IN (
    SELECT DISTINCT g.id 
    FROM games g 
    JOIN game_genres gg ON g.id = gg.game_id 
    JOIN genres gen ON gg.genre_id = gen.id 
    WHERE gen.slug = 'strategy'
  ) THEN '#DC2626'  -- Red for strategy games
  WHEN id IN (
    SELECT DISTINCT g.id 
    FROM games g 
    JOIN game_genres gg ON g.id = gg.game_id 
    JOIN genres gen ON gg.genre_id = gen.id 
    WHERE gen.slug = 'simulation'
  ) THEN '#0891B2'  -- Blue for simulation games
  ELSE '#6B7280'  -- Gray as default
END;