-- Seeds pour les relations entre personnages
-- Relations: ally, enemy, rival, family, romantic, mentor, friend

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description) VALUES
-- The Witcher 3 relationships
-- Geralt
('770e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'romantic', 'Relation tumultueuse liée par un djinn'),
('770e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'family', 'Fille adoptive par la Loi de la Surprise'),

-- Yennefer
('770e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'romantic', 'Amant de longue date'),
('770e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 'family', 'Considère Ciri comme sa fille'),

-- Ciri
('770e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'family', 'Père adoptif et mentor'),
('770e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 'family', 'Mère adoptive'),

-- Cyberpunk 2077 relationships
-- V et Johnny
('770e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440005', 'ally', 'Partagent le même corps, alliance forcée'),
('770e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440004', 'ally', 'Colocataire cérébral involontaire'),

-- God of War relationships
-- Kratos et Atreus
('770e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440007', 'family', 'Son fils, qu''il entraîne et protège'),
('770e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440006', 'family', 'Son père, qu''il cherche à rendre fier'),

-- Red Dead Redemption 2 relationships
-- Arthur et John
('770e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440010', 'friend', 'Frères d''armes dans le gang Van der Linde'),
('770e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440009', 'friend', 'Mentor et figure fraternelle'),

-- Elden Ring relationships
-- Melina et Ranni
('770e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440012', 'rival', 'Objectifs divergents concernant l''Entre-Terre'),
('770e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440011', 'rival', 'Visions opposées de l''avenir'),

-- Hades relationships
-- Zagreus et Megaera
('770e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440014', 'romantic', 'Anciens amants, relation complexe'),
('770e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440013', 'romantic', 'Ex-petit ami qu''elle doit combattre'),

-- The Last of Us relationships
-- Ellie et Joel
('770e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440017', 'family', 'Figure paternelle de substitution'),
('770e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440016', 'family', 'Fille de cœur qu''il protège à tout prix')

ON CONFLICT (character_id, related_character_id) DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  description = EXCLUDED.description;
