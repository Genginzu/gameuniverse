# Document de Requirements

## Introduction

Ce document définit les exigences pour un script d'import en masse des jeux
depuis l'API IGDB vers la base de données Supabase. Le script permettra de
récupérer tous les jeux des 10 dernières années et de les injecter dans la base
de données existante. Il sera conçu pour être réutilisable et exécutable à la
demande.

## Glossaire

- **Script_Import** : Le script TypeScript standalone qui orchestre l'import en
  masse des jeux
- **IGDB_API** : L'API Internet Game Database utilisée comme source de données
- **Supabase_DB** : La base de données PostgreSQL hébergée sur Supabase
- **Jeu** : Une entrée de jeu vidéo avec ses métadonnées (titre, date de sortie,
  genres, etc.)
- **Import_Batch** : Un lot de jeux traités ensemble lors d'une requête IGDB
- **Rate_Limiter** : Mécanisme de contrôle du débit des requêtes API

## Requirements

### Requirement 1 : Configuration et Authentification

**User Story:** En tant que développeur, je veux que le script gère
automatiquement l'authentification IGDB, afin de pouvoir l'exécuter sans
configuration manuelle supplémentaire.

#### Critères d'Acceptation

1. WHEN le Script_Import démarre, THE Script_Import SHALL charger les
   credentials IGDB depuis les variables d'environnement existantes
   (IGDB_CLIENT_ID, IGDB_CLIENT_SECRET)
2. WHEN les credentials sont manquants, THE Script_Import SHALL afficher un
   message d'erreur explicite et terminer l'exécution
3. WHEN le Script_Import s'authentifie auprès de l'API Twitch, THE Script_Import
   SHALL obtenir et mettre en cache le token d'accès
4. WHEN le token expire pendant l'exécution, THE Script_Import SHALL renouveler
   automatiquement le token

### Requirement 2 : Récupération des Jeux IGDB

**User Story:** En tant que développeur, je veux récupérer tous les jeux des 10
dernières années depuis IGDB, afin d'avoir une base de données complète des jeux
récents.

#### Critères d'Acceptation

1. WHEN le Script_Import interroge IGDB, THE Script_Import SHALL filtrer les
   jeux ayant une date de sortie dans les 10 dernières années
2. WHEN le Script_Import récupère les jeux, THE Script_Import SHALL inclure tous
   les champs nécessaires (nom, slug, summary, cover, screenshots, artworks,
   genres, companies, age_ratings, language_supports)
3. WHEN l'API IGDB retourne des résultats paginés, THE Script_Import SHALL
   parcourir toutes les pages jusqu'à épuisement des résultats
4. WHEN le Script_Import effectue des requêtes, THE Script_Import SHALL
   respecter les limites de rate limiting de l'API IGDB (4 requêtes par seconde)
5. WHEN une requête IGDB échoue, THE Script_Import SHALL réessayer jusqu'à 3
   fois avec un délai exponentiel

### Requirement 3 : Insertion dans la Base de Données

**User Story:** En tant que développeur, je veux que les jeux soient insérés
dans Supabase avec toutes leurs données associées, afin de maintenir la
cohérence avec le schéma existant.

#### Critères d'Acceptation

1. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer l'entrée
   principale dans la table games avec tous les champs requis
2. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer les
   traductions (FR et EN) dans game_translations
3. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer ou
   réutiliser les genres existants et les lier via game_genres
4. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer ou
   réutiliser les companies existantes et les lier via game_companies
5. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer les
   entrées media (screenshots, artworks)
6. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer les
   entrées de support linguistique dans game_languages
7. WHEN le Script_Import insère un jeu, THE Script_Import SHALL créer les age
   ratings avec leurs content descriptors
8. WHEN un jeu existe déjà (même igdb_id), THE Script_Import SHALL ignorer ce
   jeu et continuer avec le suivant

### Requirement 4 : Gestion des Erreurs et Résilience

**User Story:** En tant que développeur, je veux que le script soit résilient
aux erreurs, afin de pouvoir traiter un grand volume de données sans
interruption.

#### Critères d'Acceptation

1. IF une erreur survient lors de l'insertion d'un jeu, THEN THE Script_Import
   SHALL logger l'erreur et continuer avec le jeu suivant
2. WHEN le Script_Import traite les jeux, THE Script_Import SHALL utiliser des
   transactions pour garantir l'intégrité des données par jeu
3. IF le script est interrompu, THEN THE Script_Import SHALL pouvoir reprendre
   depuis le dernier point de sauvegarde
4. WHEN le Script_Import termine, THE Script_Import SHALL afficher un résumé
   (jeux importés, ignorés, erreurs)

### Requirement 5 : Logging et Progression

**User Story:** En tant que développeur, je veux suivre la progression de
l'import, afin de monitorer l'exécution et diagnostiquer les problèmes.

#### Critères d'Acceptation

1. WHILE le Script_Import s'exécute, THE Script_Import SHALL afficher la
   progression (nombre de jeux traités / total estimé)
2. WHEN le Script_Import traite un batch, THE Script_Import SHALL logger le
   nombre de jeux importés, ignorés et en erreur
3. WHEN une erreur survient, THE Script_Import SHALL logger les détails de
   l'erreur avec le contexte (igdb_id, nom du jeu)
4. WHEN le Script_Import termine, THE Script_Import SHALL afficher le temps
   total d'exécution et les statistiques finales

### Requirement 6 : Exécution et Réutilisabilité

**User Story:** En tant que développeur, je veux pouvoir exécuter le script
facilement et à la demande, afin de mettre à jour la base de données quand
nécessaire.

#### Critères d'Acceptation

1. THE Script_Import SHALL être exécutable via la commande
   `bun run scripts/import-igdb-games.ts`
2. WHERE l'option --dry-run est spécifiée, THE Script_Import SHALL simuler
   l'import sans écrire dans la base de données
3. WHERE l'option --limit est spécifiée, THE Script_Import SHALL limiter le
   nombre de jeux à importer
4. WHERE l'option --offset est spécifiée, THE Script_Import SHALL commencer
   l'import à partir d'un offset donné
5. THE Script_Import SHALL être documenté avec des instructions d'utilisation
   dans le fichier lui-même
