-- Seeds des magasins
-- Insertion des magasins principaux pour les prix

-- Insertion des magasins de référence
INSERT INTO public.stores (name, website_url, logo_url, is_active) VALUES
  ('Steam', 'https://store.steampowered.com', 'https://store.steampowered.com/favicon.ico', true),
  ('Epic Games Store', 'https://store.epicgames.com', 'https://static-assets-prod.epicgames.com/epic-store/static/favicon.ico', true),
  ('PlayStation Store', 'https://store.playstation.com', 'https://store.playstation.com/favicon.ico', true),
  ('Xbox Store', 'https://www.microsoft.com/store', 'https://www.microsoft.com/favicon.ico', true),
  ('Nintendo eShop', 'https://www.nintendo.com/store', 'https://www.nintendo.com/favicon.ico', true),
  ('GOG', 'https://www.gog.com', 'https://www.gog.com/favicon.ico', true),
  ('Ubisoft Store', 'https://store.ubisoft.com', 'https://store.ubisoft.com/favicon.ico', true),
  ('Origin', 'https://www.origin.com', 'https://www.origin.com/favicon.ico', true),
  ('Battle.net', 'https://shop.battle.net', 'https://www.blizzard.com/favicon.ico', true),
  ('Humble Store', 'https://www.humblebundle.com/store', 'https://www.humblebundle.com/favicon.ico', true),
  ('Green Man Gaming', 'https://www.greenmangaming.com', 'https://www.greenmangaming.com/favicon.ico', true),
  ('Magasin Générique', NULL, NULL, true)
ON CONFLICT (name) DO NOTHING;