# Implementation Plan: Structure des Prix de Jeux

## Overview

Ce plan transforme la structure simpliste des prix actuels en un système simple
et efficace capable de gérer les prix de jeux sur différents magasins en ligne.
L'implémentation se concentre uniquement sur la base de données : création du
schéma → migration des données → fonctions utilitaires → tests.

## Tasks

- [ ] 1. Création du schéma de base de données
  - [ ] 1.1 Créer la table stores
    - Créer la table `stores` avec nom unique, URL du site, logo
    - Ajouter les contraintes de validation (nom unique)
    - Ajouter les indexes appropriés pour les performances
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 1.2 Créer la table game_prices
    - Créer la table `game_prices` avec référence vers games et stores
    - Ajouter les champs prix, devise, plateforme, URL du magasin
    - Ajouter les contraintes de validation (prix positifs, unicité)
    - Implémenter les indexes pour les performances
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 1.3 Configurer les politiques RLS et sécurité
    - Activer RLS sur les nouvelles tables
    - Créer les politiques de lecture publique
    - Créer les politiques d'administration
    - Ajouter les politiques de développement temporaires
    - _Requirements: 6.1, 6.2_

- [ ] 2. Migration des données existantes
  - [ ] 2.1 Créer les données de référence des magasins
    - Insérer les magasins principaux (Steam, Epic Games, PlayStation Store,
      etc.)
    - Valider l'intégrité des données de référence
    - _Requirements: 5.2_

  - [ ] 2.2 Migrer les prix existants
    - Migrer `launch_price` et `current_price` vers `game_prices`
    - Préserver les informations de devise existantes
    - Assigner les prix à un magasin par défaut
    - Valider la cohérence des données migrées
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 2.3 Nettoyer l'ancien schéma
    - Supprimer les colonnes `launch_price`, `current_price`, `currency`
    - Mettre à jour les contraintes de la table `games`
    - Vérifier l'intégrité après suppression
    - _Requirements: 5.5_

- [ ] 3. Fonctions utilitaires de base de données
  - [ ] 3.1 Créer les fonctions de récupération de prix
    - Implémenter `get_game_prices(game_id, store?, platform?)`
    - Implémenter `get_best_price(game_id)`
    - Implémenter `compare_game_prices(game_id)`
    - Optimiser les requêtes avec les indexes appropriés
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_

  - [ ] 3.2 Créer les fonctions de gestion des magasins
    - Implémenter des fonctions pour gérer les magasins
    - Implémenter la validation des données de magasin
    - Ajouter les fonctions de recherche de magasins
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Mise à jour des types TypeScript
  - [ ] 4.1 Générer les nouveaux types de base de données
    - Exécuter `supabase gen types` pour les nouvelles tables
    - Vérifier la cohérence des types générés
    - Mettre à jour les imports dans les fichiers existants
    - _Requirements: 3.4_

  - [ ] 4.2 Créer les types d'interface personnalisés
    - Définir les interfaces pour les prix enrichis
    - Créer les types pour les réponses de fonctions de prix
    - Ajouter les types pour les comparaisons de prix
    - Documenter les nouveaux types avec JSDoc
    - _Requirements: 3.1, 3.2, 4.1_

- [ ] 5. Tests de propriété et validation
  - [ ] 5.1 Écrire les tests de propriété pour l'unicité des magasins
    - **Property 1: Store Name Uniqueness**
    - **Validates: Requirements 1.2**

  - [ ] 5.2 Écrire les tests de propriété pour la validation des prix
    - **Property 2: Price Non-Negativity**
    - **Property 3: Game-Store-Platform Uniqueness**
    - **Validates: Requirements 2.1, 2.3**

  - [ ] 5.3 Écrire les tests de propriété pour l'intégrité relationnelle
    - **Property 4: Store Reference Integrity**
    - **Validates: Requirements 1.4, 2.2**

  - [ ] 5.4 Écrire les tests de propriété pour la comparaison de prix
    - **Property 5: Price Comparison Accuracy**
    - **Validates: Requirements 4.2**

- [ ] 6. Tests unitaires et d'intégration
  - [ ] 6.1 Tester les fonctions de récupération de prix
    - Tester `get_game_prices` avec différents filtres
    - Tester `get_best_price` avec plusieurs magasins
    - Tester la gestion des cas où aucun prix n'existe
    - Vérifier les performances des requêtes
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 6.2 Tester la gestion des magasins
    - Tester la création et modification de magasins
    - Tester les contraintes d'unicité des noms
    - Tester la validation des URLs
    - Vérifier la cohérence des données
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 6.3 Tester la migration des données
    - Vérifier la migration complète des prix existants
    - Tester la création des magasins par défaut
    - Valider l'intégrité après migration
    - Tester le rollback en cas d'erreur
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 7. Documentation et finalisation
  - [ ] 7.1 Documenter la nouvelle structure
    - Créer la documentation technique des nouvelles tables
    - Documenter les fonctions de base de données
    - Créer des exemples d'utilisation pour les développeurs
    - Mettre à jour le guide de migration
    - _Requirements: Tous_

  - [ ] 7.2 Checkpoint final - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles
- Les tests unitaires valident les exemples spécifiques et cas limites
- La migration préserve toutes les données existantes
- L'approche privilégie la simplicité et la performance de la base de données
- Tous les tests sont obligatoires pour garantir la qualité du système

## Avantages de cette nouvelle structure

- **Simplicité** : Structure facile à comprendre et maintenir
- **Flexibilité** : Support de multiples magasins et plateformes
- **Performance** : Optimisé pour les requêtes de comparaison fréquentes
- **Intégrité** : Contraintes relationnelles garantissent la cohérence des
  données
- **Évolutivité** : Architecture capable de gérer de nombreux prix
- **Focus base de données** : Concentration sur l'essentiel sans complexité
  front-end
