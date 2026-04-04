-- Migration: achievement_catalog table
-- Objective: Create the achievement_catalog reference table containing all
-- available achievements with their definitions, thresholds, XP values,
-- icons, and bilingual translations (FR/EN).
-- Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.achievement_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) NOT NULL,
  category VARCHAR(30) NOT NULL,
  tier VARCHAR(10) NOT NULL,
  threshold INTEGER NOT NULL,
  xp_value INTEGER NOT NULL,
  icon VARCHAR(50) NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT achievement_catalog_key_unique UNIQUE (key)
);
-- 2. Index on category for filtered queries
CREATE INDEX IF NOT EXISTS idx_achievement_catalog_category
  ON public.achievement_catalog(category);
-- 3. Enable RLS
ALTER TABLE public.achievement_catalog ENABLE ROW LEVEL SECURITY;
-- 4. RLS policy: public read (anyone can see the catalog)
CREATE POLICY achievement_catalog_select_all
  ON public.achievement_catalog
  FOR SELECT
  USING (true);
-- 5. Documentation
COMMENT ON TABLE public.achievement_catalog IS 'Reference table of all available achievements with thresholds, XP values, and translations';
COMMENT ON COLUMN public.achievement_catalog.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.achievement_catalog.key IS 'Unique key identifying the achievement (e.g. library_5, playtime_100h)';
COMMENT ON COLUMN public.achievement_catalog.category IS 'Achievement category: library, playtime, reviews, social, collections';
COMMENT ON COLUMN public.achievement_catalog.tier IS 'Difficulty tier: bronze, silver, gold';
COMMENT ON COLUMN public.achievement_catalog.threshold IS 'Numeric threshold to unlock the achievement';
COMMENT ON COLUMN public.achievement_catalog.xp_value IS 'XP points awarded when the achievement is unlocked';
COMMENT ON COLUMN public.achievement_catalog.icon IS 'Lucide-react icon name for display';
COMMENT ON COLUMN public.achievement_catalog.name_fr IS 'Achievement name in French';
COMMENT ON COLUMN public.achievement_catalog.name_en IS 'Achievement name in English';
COMMENT ON COLUMN public.achievement_catalog.description_fr IS 'Achievement description in French';
COMMENT ON COLUMN public.achievement_catalog.description_en IS 'Achievement description in English';
COMMENT ON COLUMN public.achievement_catalog.sort_order IS 'Display order within the category';
COMMENT ON COLUMN public.achievement_catalog.created_at IS 'Timestamp when the catalog entry was created';
-- 6. Seed data: 24 predefined achievements across 5 categories

-- Category: library (6 achievements)
INSERT INTO public.achievement_catalog (key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order) VALUES
  ('library_1',   'library', 'bronze', 1,   10,  'BookOpen',    'Premier Jeu',           'First Game',            'Ajoutez votre premier jeu à la bibliothèque',                'Add your first game to the library',                  1),
  ('library_5',   'library', 'bronze', 5,   25,  'BookOpen',    'Petit Collectionneur',  'Small Collector',       'Ajoutez 5 jeux à votre bibliothèque',                        'Add 5 games to your library',                         2),
  ('library_10',  'library', 'silver', 10,  50,  'Library',     'Bibliophile',           'Bookworm',              'Ajoutez 10 jeux à votre bibliothèque',                       'Add 10 games to your library',                        3),
  ('library_25',  'library', 'silver', 25,  100, 'Library',     'Collectionneur Averti',  'Seasoned Collector',   'Ajoutez 25 jeux à votre bibliothèque',                       'Add 25 games to your library',                        4),
  ('library_50',  'library', 'gold',   50,  200, 'BookMarked',  'Grand Collectionneur',  'Grand Collector',       'Ajoutez 50 jeux à votre bibliothèque',                       'Add 50 games to your library',                        5),
  ('library_100', 'library', 'gold',   100, 500, 'BookMarked',  'Maître Bibliothécaire', 'Master Librarian',      'Ajoutez 100 jeux à votre bibliothèque',                      'Add 100 games to your library',                       6);
-- Category: playtime (5 achievements)
INSERT INTO public.achievement_catalog (key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order) VALUES
  ('playtime_10h',   'playtime', 'bronze', 10,   25,  'Clock',     'Premiers Pas',         'First Steps',           'Jouez pendant 10 heures au total',                           'Play for a total of 10 hours',                        1),
  ('playtime_50h',   'playtime', 'bronze', 50,   50,  'Clock',     'Joueur Régulier',      'Regular Player',        'Jouez pendant 50 heures au total',                           'Play for a total of 50 hours',                        2),
  ('playtime_100h',  'playtime', 'silver', 100,  100, 'Timer',     'Passionné',            'Enthusiast',            'Jouez pendant 100 heures au total',                          'Play for a total of 100 hours',                       3),
  ('playtime_500h',  'playtime', 'gold',   500,  250, 'Hourglass', 'Vétéran',              'Veteran',               'Jouez pendant 500 heures au total',                          'Play for a total of 500 hours',                       4),
  ('playtime_1000h', 'playtime', 'gold',   1000, 500, 'Hourglass', 'Légende Vivante',      'Living Legend',         'Jouez pendant 1000 heures au total',                         'Play for a total of 1000 hours',                      5);
-- Category: reviews (5 achievements)
INSERT INTO public.achievement_catalog (key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order) VALUES
  ('reviews_1',  'reviews', 'bronze', 1,  10,  'Star',          'Premier Avis',          'First Review',          'Rédigez votre premier avis',                                 'Write your first review',                             1),
  ('reviews_5',  'reviews', 'bronze', 5,  25,  'Star',          'Critique en Herbe',     'Budding Critic',        'Rédigez 5 avis',                                             'Write 5 reviews',                                     2),
  ('reviews_10', 'reviews', 'silver', 10, 50,  'MessageSquare', 'Critique Confirmé',     'Confirmed Critic',      'Rédigez 10 avis',                                            'Write 10 reviews',                                    3),
  ('reviews_25', 'reviews', 'silver', 25, 100, 'MessageSquare', 'Critique Expert',       'Expert Critic',         'Rédigez 25 avis',                                            'Write 25 reviews',                                    4),
  ('reviews_50', 'reviews', 'gold',   50, 250, 'PenLine',       'Critique Légendaire',   'Legendary Critic',      'Rédigez 50 avis',                                            'Write 50 reviews',                                    5);
-- Category: social (4 achievements)
INSERT INTO public.achievement_catalog (key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order) VALUES
  ('social_1',  'social', 'bronze', 1,  10,  'UserPlus', 'Premier Ami',          'First Friend',          'Ajoutez votre premier ami',                                  'Add your first friend',                               1),
  ('social_5',  'social', 'bronze', 5,  25,  'UserPlus', 'Sociable',             'Sociable',              'Ajoutez 5 amis',                                             'Add 5 friends',                                       2),
  ('social_10', 'social', 'silver', 10, 50,  'Users',    'Populaire',            'Popular',               'Ajoutez 10 amis',                                            'Add 10 friends',                                      3),
  ('social_25', 'social', 'gold',   25, 100, 'Users',    'Star Sociale',         'Social Star',           'Ajoutez 25 amis',                                            'Add 25 friends',                                      4);
-- Category: collections (4 achievements)
INSERT INTO public.achievement_catalog (key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order) VALUES
  ('collections_1',  'collections', 'bronze', 1,  10,  'FolderPlus', 'Première Collection',   'First Collection',      'Créez votre première collection',                            'Create your first collection',                        1),
  ('collections_3',  'collections', 'bronze', 3,  25,  'FolderPlus', 'Organisateur',          'Organizer',             'Créez 3 collections',                                        'Create 3 collections',                                2),
  ('collections_5',  'collections', 'silver', 5,  50,  'Layers',     'Curateur',              'Curator',               'Créez 5 collections',                                        'Create 5 collections',                                3),
  ('collections_10', 'collections', 'gold',   10, 100, 'Grid3X3',    'Maître Curateur',       'Master Curator',        'Créez 10 collections',                                       'Create 10 collections',                               4);
