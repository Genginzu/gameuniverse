-- Seeds pour les jeux d'exemple
-- Jeux populaires pour tester et démontrer la plateforme
-- Images provenant d'IGDB.com

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
('660e8400-e29b-41d4-a716-446655440016', 'fall-guys', '2020-08-04', 79, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lct.webp')
ON CONFLICT (id) DO NOTHING;