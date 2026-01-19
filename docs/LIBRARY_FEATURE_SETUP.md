# Configuration de la fonctionnalité Bibliothèque Utilisateur

## Vue d'ensemble

La fonctionnalité "Ajouter à ma bibliothèque" permet aux utilisateurs de gérer
leur collection personnelle de jeux. Cette fonctionnalité nécessite
l'application d'une migration de base de données.

## Prérequis

- Docker Desktop installé et en cours d'exécution
- Supabase CLI installé
- Base de données Supabase configurée

## Migration de la base de données

### Fichier de migration

La migration se trouve dans :
`supabase/migrations/20240111000001_user_library.sql`

Cette migration crée :

- La table `user_library` pour stocker les jeux de chaque utilisateur
- Les politiques RLS (Row Level Security) pour sécuriser l'accès
- Les fonctions de base de données pour les statistiques
- Les index pour optimiser les performances

### Application de la migration

#### Option 1 : Environnement local avec Docker

```bash
# Démarrer Docker Desktop

# Réinitialiser la base de données locale (applique toutes les migrations)
cd supabase
supabase db reset

# Ou appliquer uniquement les nouvelles migrations
supabase db push
```

#### Option 2 : Environnement de production (Supabase Cloud)

```bash
# Se connecter à votre projet Supabase
supabase link --project-ref your-project-ref

# Appliquer les migrations
supabase db push
```

#### Option 3 : Application manuelle via Supabase Dashboard

1. Ouvrez le Supabase Dashboard
2. Allez dans "SQL Editor"
3. Copiez le contenu de `supabase/migrations/20240111000001_user_library.sql`
4. Exécutez le script SQL

## Structure de la table user_library

```sql
CREATE TABLE public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'owned',
  play_time_hours INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  UNIQUE(user_id, game_id)
);
```

## Fonctionnalités

### Pour les utilisateurs

- **Ajouter un jeu à la bibliothèque** : Bouton sur chaque carte de jeu
- **Voir sa bibliothèque** : Page `/library` avec tous les jeux ajoutés
- **Statistiques** : Nombre de jeux, jeux terminés, temps de jeu total
- **Retirer un jeu** : Possibilité de supprimer un jeu de sa bibliothèque

### API Endpoints

- `GET /api/library` - Récupérer la bibliothèque de l'utilisateur
- `POST /api/library` - Ajouter un jeu à la bibliothèque
- `GET /api/library/[gameId]` - Vérifier si un jeu est dans la bibliothèque
- `DELETE /api/library/[gameId]` - Retirer un jeu de la bibliothèque
- `GET /api/library/stats` - Obtenir les statistiques de la bibliothèque

## Gestion des erreurs

Si la migration n'est pas appliquée, l'application gère gracieusement les
erreurs :

- Les boutons "Ajouter à ma bibliothèque" ne s'affichent pas
- La page `/library` affiche un état vide
- Les erreurs sont loggées dans la console mais n'affectent pas l'expérience
  utilisateur

## Vérification

Pour vérifier que la migration est appliquée :

```sql
-- Dans le SQL Editor de Supabase
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_library'
);
```

Si le résultat est `true`, la migration est appliquée avec succès.

## Rollback

Pour annuler la migration (si nécessaire) :

```sql
-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_user_library_stats(UUID);
DROP FUNCTION IF EXISTS is_game_in_user_library(UUID, UUID);

-- Supprimer la table
DROP TABLE IF EXISTS public.user_library CASCADE;
```

## Support

En cas de problème :

1. Vérifiez que Docker Desktop est en cours d'exécution
2. Vérifiez les logs de Supabase : `supabase logs`
3. Consultez la documentation Supabase : https://supabase.com/docs
