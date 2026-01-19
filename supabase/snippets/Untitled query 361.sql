-- Vérifier les données dans user_library pour Genginzu et The Witcher 3

-- 1. Trouver l'ID de l'utilisateur Genginzu
SELECT id, email, raw_user_meta_data->>'username' as username
FROM auth.users
WHERE raw_user_meta_data->>'Display name' = 'Genginzu';