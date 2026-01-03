-- Seeds pour les prix de jeux
-- Création des prix pour les jeux d'exemple sur différents magasins

-- Prix pour The Witcher 3
INSERT INTO game_prices (game_id, store_id, price, currency, platform, store_url, is_available) VALUES
-- Steam
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM stores WHERE name = 'Steam'), 29.99, 'EUR', 'PC', 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/', true),
-- Epic Games Store
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM stores WHERE name = 'Epic Games Store'), 29.99, 'EUR', 'PC', 'https://store.epicgames.com/en-US/p/the-witcher-3-wild-hunt', true),
-- GOG
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM stores WHERE name = 'GOG'), 29.99, 'EUR', 'PC', 'https://www.gog.com/game/the_witcher_3_wild_hunt', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 39.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP4497-CUSA00527_00-WLDHRNT000000000', true),

-- Prix pour Cyberpunk 2077
-- Steam
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM stores WHERE name = 'Steam'), 39.99, 'EUR', 'PC', 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/', true),
-- Epic Games Store
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM stores WHERE name = 'Epic Games Store'), 39.99, 'EUR', 'PC', 'https://store.epicgames.com/en-US/p/cyberpunk-2077', true),
-- GOG
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM stores WHERE name = 'GOG'), 39.99, 'EUR', 'PC', 'https://www.gog.com/game/cyberpunk_2077', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 49.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP4497-PPSA01330_00-CYBERPUNK2077000', true),

-- Prix pour Minecraft
-- Magasin Générique (prix officiel)
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM stores WHERE name = 'Magasin Générique'), 26.95, 'EUR', 'PC', 'https://www.minecraft.net/en-us/store/minecraft-java-bedrock-edition-pc', true),
-- Xbox Store
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM stores WHERE name = 'Xbox Store'), 26.95, 'EUR', 'Xbox', 'https://www.xbox.com/en-us/games/store/minecraft/9nblggh2jhxj', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 26.95, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP4433-PPSA01538_00-MCCE000000000001', true),
-- Nintendo eShop
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM stores WHERE name = 'Nintendo eShop'), 29.99, 'EUR', 'Nintendo Switch', 'https://www.nintendo.com/us/store/products/minecraft-switch/', true),

-- Prix pour Grand Theft Auto V
-- Steam
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM stores WHERE name = 'Steam'), 29.99, 'EUR', 'PC', 'https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/', true),
-- Epic Games Store
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM stores WHERE name = 'Epic Games Store'), 29.99, 'EUR', 'PC', 'https://store.epicgames.com/en-US/p/grand-theft-auto-v', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 29.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP1004-PPSA03419_00-GTAVCOLLECTION00', true),
-- Xbox Store
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM stores WHERE name = 'Xbox Store'), 29.99, 'EUR', 'Xbox', 'https://www.xbox.com/en-us/games/store/grand-theft-auto-v/bpj686w6s0nh', true),

-- Prix pour Red Dead Redemption 2
-- Steam
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM stores WHERE name = 'Steam'), 49.99, 'EUR', 'PC', 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/', true),
-- Epic Games Store
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM stores WHERE name = 'Epic Games Store'), 49.99, 'EUR', 'PC', 'https://store.epicgames.com/en-US/p/red-dead-redemption-2', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 49.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP1004-PPSA02406_00-RDR2ULTIMATE0001', true),
-- Xbox Store
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM stores WHERE name = 'Xbox Store'), 49.99, 'EUR', 'Xbox', 'https://www.xbox.com/en-us/games/store/red-dead-redemption-2/9n2zdn7nwqkv', true),

-- Prix pour Elden Ring
-- Steam
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM stores WHERE name = 'Steam'), 59.99, 'EUR', 'PC', 'https://store.steampowered.com/app/1245620/ELDEN_RING/', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 59.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP0700-PPSA03548_00-ELDENRING0000000', true),
-- Xbox Store
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM stores WHERE name = 'Xbox Store'), 59.99, 'EUR', 'Xbox', 'https://www.xbox.com/en-us/games/store/elden-ring/9p3j32ctxlrz', true),

-- Prix pour God of War
-- Steam
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM stores WHERE name = 'Steam'), 19.99, 'EUR', 'PC', 'https://store.steampowered.com/app/1593500/God_of_War/', true),
-- Epic Games Store
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM stores WHERE name = 'Epic Games Store'), 19.99, 'EUR', 'PC', 'https://store.epicgames.com/en-US/p/god-of-war', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 19.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP9000-PPSA07408_00-0000000GODOFWAR4', true),

-- Prix pour Horizon Zero Dawn
-- Steam
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM stores WHERE name = 'Steam'), 19.99, 'EUR', 'PC', 'https://store.steampowered.com/app/1151640/Horizon_Zero_Dawn_Complete_Edition/', true),
-- Epic Games Store
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM stores WHERE name = 'Epic Games Store'), 19.99, 'EUR', 'PC', 'https://store.epicgames.com/en-US/p/horizon-zero-dawn-complete-edition', true),
-- PlayStation Store
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM stores WHERE name = 'PlayStation Store'), 19.99, 'EUR', 'PlayStation', 'https://store.playstation.com/en-us/product/UP9000-PPSA01967_00-HRZCE00000000000', true)

ON CONFLICT (game_id, store_id, platform) DO NOTHING;