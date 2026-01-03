-- Seeds pour les traductions des jeux d'exemple
-- Traductions en français et anglais pour tous les jeux de démonstration

-- Traductions françaises
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
('660e8400-e29b-41d4-a716-446655440008', 'en', 'Horizon Zero Dawn', 'In a post-apocalyptic world dominated by machines, follow Aloy in her quest to discover the secrets of the past.')
ON CONFLICT (game_id, language_code) DO NOTHING;