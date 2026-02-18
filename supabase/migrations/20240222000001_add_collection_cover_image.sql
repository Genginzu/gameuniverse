-- Ajout d'une image de couverture optionnelle aux collections de jeux.
-- Si renseignée, elle remplace la grille de couvertures auto-générée.

ALTER TABLE public.game_collections
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.game_collections.cover_image_url
  IS 'URL d''une image de couverture personnalisée. Si NULL, la grille des couvertures des jeux est affichée.';
