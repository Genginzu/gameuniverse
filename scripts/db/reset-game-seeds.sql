-- Script pour réinitialiser et réappliquer les seeds de jeux avec les images IGDB
-- À exécuter dans Supabase SQL Editor ou via CLI

-- Supprimer les données existantes (dans l'ordre des dépendances)
DELETE FROM game_translations WHERE game_id IN (
  SELECT id FROM games WHERE id LIKE '660e8400-e29b-41d4-a716-44665544%'
);

DELETE FROM game_genres WHERE game_id IN (
  SELECT id FROM games WHERE id LIKE '660e8400-e29b-41d4-a716-44665544%'
);

DELETE FROM games WHERE id LIKE '660e8400-e29b-41d4-a716-44665544%';

-- Réinsérer les jeux avec les nouvelles images IGDB
INSERT INTO games (id, slug, release_date, metascore, cover_image_url) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'the-witcher-3', '2015-05-19', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.webp'),
('660e8400-e29b-41d4-a716-446655440002', 'cyberpunk-2077', '2020-12-10', 86, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.webp'),
('660e8400-e29b-41d4-a716-446655440003', 'minecraft', '2011-11-18', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp'),
('660e8400-e29b-41d4-a716-446655440004', 'grand-theft-auto-v', '2013-09-17', 97, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp'),
('660e8400-e29b-41d4-a716-446655440005', 'red-dead-redemption-2', '2018-10-26', 97, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp'),
('660e8400-e29b-41d4-a716-446655440006', 'elden-ring', '2022-02-25', 96, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp'),
('660e8400-e29b-41d4-a716-446655440007', 'god-of-war', '2018-04-20', 94, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp'),
('660e8400-e29b-41d4-a716-446655440008', 'horizon-zero-dawn', '2017-02-28', 89, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1u8x.webp'),
('660e8400-e29b-41d4-a716-446655440009', 'ghost-of-tsushima', '2020-07-17', 85, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2a2t.webp'),
('660e8400-e29b-41d4-a716-446655440010', 'spider-man-miles-morales', '2020-11-12', 85, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2om6.webp'),
('660e8400-e29b-41d4-a716-446655440011', 'assassins-creed-valhalla', '2020-11-10', 85, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2625.webp'),
('660e8400-e29b-41d4-a716-446655440012', 'doom-eternal', '2020-03-20', 88, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tg4.webp'),
('660e8400-e29b-41d4-a716-446655440013', 'hades', '2020-09-17', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2145.webp'),
('660e8400-e29b-41d4-a716-446655440014', 'animal-crossing-new-horizons', '2020-03-20', 90, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7w.webp'),
('660e8400-e29b-41d4-a716-446655440015', 'the-last-of-us-part-ii', '2020-06-19', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp'),
('660e8400-e29b-41d4-a716-446655440016', 'fall-guys', '2020-08-04', 79, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lct.webp');

-- Réinsérer les traductions
INSERT INTO game_translations (game_id, language_code, title, description) VALUES
-- The Witcher 3
('660e8400-e29b-41d4-a716-446655440001', 'fr', 'The Witcher 3: Wild Hunt', 'Un RPG épique dans un monde ouvert fantastique. Incarnez Geralt de Riv dans sa quête pour retrouver Ciri et affronter la Chasse Sauvage dans un univers riche et immersif.'),
('660e8400-e29b-41d4-a716-446655440001', 'en', 'The Witcher 3: Wild Hunt', 'An epic RPG in a fantasy open world. Play as Geralt of Rivia in his quest to find Ciri and face the Wild Hunt in a rich and immersive universe.'),

-- Cyberpunk 2077
('660e8400-e29b-41d4-a716-446655440002', 'fr', 'Cyberpunk 2077', 'Un RPG d''action futuriste dans la mégalopole de Night City. Personnalisez votre cyberpunk et façonnez votre destin dans un monde dystopique fascinant.'),
('660e8400-e29b-41d4-a716-446655440002', 'en', 'Cyberpunk 2077', 'A futuristic action RPG in the Night City megalopolis. Customize your cyberpunk and shape your destiny in a fascinating dystopian world.'),

-- Minecraft
('660e8400-e29b-41d4-a716-446655440003', 'fr', 'Minecraft', 'Le jeu de construction et d''aventure ultime. Construisez, explorez et survivez dans des mondes infinis générés procéduralement.'),
('660e8400-e29b-41d4-a716-446655440003', 'en', 'Minecraft', 'The ultimate building and adventure game. Build, explore and survive in infinite procedurally generated worlds.'),

-- Grand Theft Auto V
('660e8400-e29b-41d4-a716-446655440004', 'fr', 'Grand Theft Auto V', 'Un jeu d''action en monde ouvert dans la ville fictive de Los Santos. Vivez trois histoires entremêlées dans l''univers criminel de GTA.'),
('660e8400-e29b-41d4-a716-446655440004', 'en', 'Grand Theft Auto V', 'An open-world action game in the fictional city of Los Santos. Experience three intertwined stories in the criminal universe of GTA.'),

-- Red Dead Redemption 2
('660e8400-e29b-41d4-a716-446655440005', 'fr', 'Red Dead Redemption 2', 'Un western épique dans l''Amérique de 1899. Suivez Arthur Morgan et la bande de Dutch van der Linde dans leur lutte pour la survie.'),
('660e8400-e29b-41d4-a716-446655440005', 'en', 'Red Dead Redemption 2', 'An epic western set in 1899 America. Follow Arthur Morgan and Dutch van der Linde''s gang in their struggle for survival.'),

-- Elden Ring
('660e8400-e29b-41d4-a716-446655440006', 'fr', 'Elden Ring', 'Un action-RPG fantasy créé par FromSoftware et George R.R. Martin. Explorez l''Entre-terre et devenez le Seigneur de l''Anneau d''Elden.'),
('660e8400-e29b-41d4-a716-446655440006', 'en', 'Elden Ring', 'A fantasy action-RPG created by FromSoftware and George R.R. Martin. Explore the Lands Between and become the Elden Lord.'),

-- God of War
('660e8400-e29b-41d4-a716-446655440007', 'fr', 'God of War', 'Kratos et son fils Atreus partent en voyage dans les terres nordiques. Une aventure épique mêlant mythologie et émotion.'),
('660e8400-e29b-41d4-a716-446655440007', 'en', 'God of War', 'Kratos and his son Atreus embark on a journey through Norse lands. An epic adventure blending mythology and emotion.'),

-- Horizon Zero Dawn
('660e8400-e29b-41d4-a716-446655440008', 'fr', 'Horizon Zero Dawn', 'Dans un monde post-apocalyptique dominé par les machines, suivez Aloy dans sa quête pour découvrir les secrets du passé.'),
('660e8400-e29b-41d4-a716-446655440008', 'en', 'Horizon Zero Dawn', 'In a post-apocalyptic world dominated by machines, follow Aloy in her quest to discover the secrets of the past.'),

-- Ghost of Tsushima
('660e8400-e29b-41d4-a716-446655440009', 'fr', 'Ghost of Tsushima', 'Incarnez Jin Sakai, un samouraï qui doit abandonner ses traditions pour défendre l''île de Tsushima contre l''invasion mongole.'),
('660e8400-e29b-41d4-a716-446655440009', 'en', 'Ghost of Tsushima', 'Play as Jin Sakai, a samurai who must abandon his traditions to defend Tsushima Island against the Mongol invasion.'),

-- Spider-Man: Miles Morales
('660e8400-e29b-41d4-a716-446655440010', 'fr', 'Spider-Man: Miles Morales', 'Suivez Miles Morales dans ses débuts en tant que Spider-Man dans cette aventure autonome pleine d''action.'),
('660e8400-e29b-41d4-a716-446655440010', 'en', 'Spider-Man: Miles Morales', 'Follow Miles Morales in his beginnings as Spider-Man in this action-packed standalone adventure.'),

-- Assassin's Creed Valhalla
('660e8400-e29b-41d4-a716-446655440011', 'fr', 'Assassin''s Creed Valhalla', 'Menez les raids vikings en Angleterre et forgez votre légende en tant qu''Eivor dans cet épisode épique d''Assassin''s Creed.'),
('660e8400-e29b-41d4-a716-446655440011', 'en', 'Assassin''s Creed Valhalla', 'Lead Viking raids in England and forge your legend as Eivor in this epic Assassin''s Creed episode.'),

-- DOOM Eternal
('660e8400-e29b-41d4-a716-446655440012', 'fr', 'DOOM Eternal', 'Le FPS ultime avec une action intense et brutale. Incarnez le Doom Slayer et éliminez les démons de l''enfer.'),
('660e8400-e29b-41d4-a716-446655440012', 'en', 'DOOM Eternal', 'The ultimate FPS with intense and brutal action. Play as the Doom Slayer and eliminate the demons of hell.'),

-- Hades
('660e8400-e29b-41d4-a716-446655440013', 'fr', 'Hades', 'Un roguelike d''action avec une narration exceptionnelle. Incarnez Zagreus et tentez de vous échapper des Enfers grecs.'),
('660e8400-e29b-41d4-a716-446655440013', 'en', 'Hades', 'An action roguelike with exceptional storytelling. Play as Zagreus and try to escape from the Greek Underworld.'),

-- Animal Crossing: New Horizons
('660e8400-e29b-41d4-a716-446655440014', 'fr', 'Animal Crossing: New Horizons', 'Créez votre paradis insulaire dans ce jeu de simulation de vie relaxant et créatif.'),
('660e8400-e29b-41d4-a716-446655440014', 'en', 'Animal Crossing: New Horizons', 'Create your island paradise in this relaxing and creative life simulation game.'),

-- The Last of Us Part II
('660e8400-e29b-41d4-a716-446655440015', 'fr', 'The Last of Us Part II', 'Suivez Ellie dans sa quête de vengeance dans ce thriller post-apocalyptique émotionnellement intense.'),
('660e8400-e29b-41d4-a716-446655440015', 'en', 'The Last of Us Part II', 'Follow Ellie in her quest for revenge in this emotionally intense post-apocalyptic thriller.'),

-- Fall Guys
('660e8400-e29b-41d4-a716-446655440016', 'fr', 'Fall Guys', 'Un jeu de plateforme multijoueur délirant où 60 joueurs s''affrontent dans des mini-jeux colorés et amusants.'),
('660e8400-e29b-41d4-a716-446655440016', 'en', 'Fall Guys', 'A crazy multiplayer platform game where 60 players compete in colorful and fun mini-games.');