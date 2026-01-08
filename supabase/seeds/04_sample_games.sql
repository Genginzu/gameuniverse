-- Seeds pour les jeux d'exemple
-- Jeux populaires pour tester et démontrer la plateforme
-- Images provenant d'IGDB (Internet Game Database) pour l'authenticité

INSERT INTO games (id, slug, release_date, metascore, cover_image_url, background_color, background_image_url) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'the-witcher-3', '2015-05-19', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.webp', '#1a1a2e', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f0g.jpg'),
('660e8400-e29b-41d4-a716-446655440002', 'cyberpunk-2077', '2020-12-10', 86, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.webp', '#0f0f23', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f1h.jpg'),
('660e8400-e29b-41d4-a716-446655440003', 'minecraft', '2011-11-18', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp', '#0d4f3c', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f2i.jpg'),
('660e8400-e29b-41d4-a716-446655440004', 'grand-theft-auto-v', '2013-09-17', 97, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp', '#1a1a1a', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f3j.jpg'),
('660e8400-e29b-41d4-a716-446655440005', 'red-dead-redemption-2', '2018-10-26', 97, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp', '#2d1810', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f4k.jpg'),
('660e8400-e29b-41d4-a716-446655440006', 'elden-ring', '2022-02-25', 96, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp', '#1a1611', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f5l.jpg'),
('660e8400-e29b-41d4-a716-446655440007', 'god-of-war', '2018-04-20', 94, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp', '#0f1419', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f6m.jpg'),
('660e8400-e29b-41d4-a716-446655440008', 'horizon-zero-dawn', '2017-02-28', 89, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1u8x.webp', '#1a2332', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f7n.jpg'),
('660e8400-e29b-41d4-a716-446655440009', 'ghost-of-tsushima', '2020-07-17', 85, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2a2t.webp', '#2d1810', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f8o.jpg'),
('660e8400-e29b-41d4-a716-446655440010', 'spider-man-miles-morales', '2020-11-12', 85, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2om6.webp', '#0f1419', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f9p.jpg'),
('660e8400-e29b-41d4-a716-446655440011', 'assassins-creed-valhalla', '2020-11-10', 85, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2625.webp', '#1a1611', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g0q.jpg'),
('660e8400-e29b-41d4-a716-446655440012', 'doom-eternal', '2020-03-20', 88, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tg4.webp', '#1a0f0f', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g1r.jpg'),
('660e8400-e29b-41d4-a716-446655440013', 'hades', '2020-09-17', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2145.webp', '#1a0f19', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g2s.jpg'),
('660e8400-e29b-41d4-a716-446655440014', 'animal-crossing-new-horizons', '2020-03-20', 90, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7w.webp', '#0f3d1a', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g3t.jpg'),
('660e8400-e29b-41d4-a716-446655440015', 'the-last-of-us-part-ii', '2020-06-19', 93, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp', '#1a1611', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g4u.jpg'),
('660e8400-e29b-41d4-a716-446655440016', 'fall-guys', '2020-08-04', 79, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lct.webp', '#ff6b9d', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g5v.jpg')
ON CONFLICT (id) DO NOTHING;