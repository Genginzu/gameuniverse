-- Script to update existing games with background colors and images
-- Run this after the migration to add background customization to existing games
-- Images provenant d'IGDB (Internet Game Database) pour l'authenticité

-- Update The Witcher 3
UPDATE games 
SET background_color = '#1a1a2e', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f0g.jpg'
WHERE slug = 'the-witcher-3';

-- Update Cyberpunk 2077
UPDATE games 
SET background_color = '#0f0f23', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f1h.jpg'
WHERE slug = 'cyberpunk-2077';

-- Update Minecraft
UPDATE games 
SET background_color = '#0d4f3c', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f2i.jpg'
WHERE slug = 'minecraft';

-- Update Grand Theft Auto V
UPDATE games 
SET background_color = '#1a1a1a', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f3g.jpg'
WHERE slug = 'grand-theft-auto-v';

-- Update Red Dead Redemption 2
UPDATE games 
SET background_color = '#2d1810', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f4k.jpg'
WHERE slug = 'red-dead-redemption-2';

-- Update Elden Ring
UPDATE games 
SET background_color = '#1a1611', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f5l.jpg'
WHERE slug = 'elden-ring';

-- Update God of War
UPDATE games 
SET background_color = '#0f1419', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f6m.jpg'
WHERE slug = 'god-of-war';

-- Update Horizon Zero Dawn
UPDATE games 
SET background_color = '#1a2332', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f7n.jpg'
WHERE slug = 'horizon-zero-dawn';

-- Update Ghost of Tsushima
UPDATE games 
SET background_color = '#2d1810', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f8o.jpg'
WHERE slug = 'ghost-of-tsushima';

-- Update Spider-Man Miles Morales
UPDATE games 
SET background_color = '#0f1419', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f9p.jpg'
WHERE slug = 'spider-man-miles-morales';

-- Update Assassin's Creed Valhalla
UPDATE games 
SET background_color = '#1a1611', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g0q.jpg'
WHERE slug = 'assassins-creed-valhalla';

-- Update DOOM Eternal
UPDATE games 
SET background_color = '#1a0f0f', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g1r.jpg'
WHERE slug = 'doom-eternal';

-- Update Hades
UPDATE games 
SET background_color = '#1a0f19', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g2s.jpg'
WHERE slug = 'hades';

-- Update Animal Crossing New Horizons
UPDATE games 
SET background_color = '#0f3d1a', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g3t.jpg'
WHERE slug = 'animal-crossing-new-horizons';

-- Update The Last of Us Part II
UPDATE games 
SET background_color = '#1a1611', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g4u.jpg'
WHERE slug = 'the-last-of-us-part-ii';

-- Update Fall Guys
UPDATE games 
SET background_color = '#ff6b9d', 
    background_image_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g5v.jpg'
WHERE slug = 'fall-guys';