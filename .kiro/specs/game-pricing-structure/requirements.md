# Requirements Document - Structure des Prix de Jeux

## Introduction

La structure actuelle des prix dans la table `games` avec les champs
`launch_price`, `current_price` et `currency` est trop simpliste pour permettre
de comparer les prix d'un même jeu sur différents magasins et plateformes.

Cette spécification définit une nouvelle structure simple et efficace pour gérer
les prix de jeux sur différents magasins en ligne.

## Glossary

- **Game**: Un jeu vidéo dans le système
- **Store**: Un magasin en ligne où acheter des jeux (Steam, Epic Games Store,
  PlayStation Store, etc.)
- **Platform**: Une plateforme de jeu (PC, PlayStation, Xbox, Nintendo Switch,
  etc.)
- **Game_Price**: Un enregistrement de prix pour un jeu spécifique sur un
  magasin donné

## Requirements

### Requirement 1: Structure des Magasins

**User Story:** En tant qu'utilisateur, je veux voir les prix d'un jeu sur
différents magasins en ligne, afin de pouvoir comparer et choisir la meilleure
offre.

#### Acceptance Criteria

1. THE System SHALL store store information including name, website URL, and
   logo
2. WHEN a store is created, THE System SHALL ensure the store name is unique
3. THE System SHALL support major gaming stores (Steam, Epic Games Store,
   PlayStation Store, Xbox Store, Nintendo eShop, GOG, etc.)
4. THE System SHALL allow stores to be marked as active or inactive
5. THE System SHALL maintain store metadata including website URL and logo

### Requirement 2: Structure des Prix de Jeux

**User Story:** En tant qu'utilisateur, je veux voir le prix actuel d'un jeu sur
chaque magasin, afin de trouver la meilleure offre disponible.

#### Acceptance Criteria

1. THE System SHALL store prices for each game/store combination
2. WHEN a price is stored, THE System SHALL include the store, platform, and
   direct URL
3. THE System SHALL track price currency and availability status
4. THE System SHALL support different platforms (PC, PlayStation, Xbox, Nintendo
   Switch, etc.)
5. THE System SHALL maintain price update timestamps for freshness tracking

### Requirement 3: Fonctions de Base de Données pour les Prix

**User Story:** En tant que développeur, je veux des fonctions de base de
données pour récupérer les prix, afin d'interroger efficacement les données de
prix.

#### Acceptance Criteria

1. THE System SHALL provide database functions to get current prices for a
   specific game
2. WHEN querying prices, THE System SHALL support filtering by store and
   platform
3. THE System SHALL return prices sorted by best offer
4. THE System SHALL include store information and direct purchase links
5. THE System SHALL support efficient queries for multiple games

### Requirement 4: Fonctions de Comparaison de Prix

**User Story:** En tant que développeur, je veux des fonctions de base de
données pour comparer les prix, afin d'identifier facilement la meilleure offre.

#### Acceptance Criteria

1. THE System SHALL provide database functions for price comparison across
   stores
2. WHEN comparing prices, THE System SHALL identify the best current offer
3. THE System SHALL return direct links to purchase on each store
4. THE System SHALL include platform information for each price
5. THE System SHALL handle cases where games are not available on certain stores

### Requirement 5: Migration des Données Existantes

**User Story:** En tant qu'administrateur système, je veux migrer les données de
prix existantes vers la nouvelle structure, afin de préserver l'historique sans
perte de données.

#### Acceptance Criteria

1. THE System SHALL migrate existing launch_price and current_price data to the
   new structure
2. WHEN migrating, THE System SHALL create default store entries if needed
3. THE System SHALL preserve existing currency information
4. THE System SHALL validate data integrity after migration
5. THE System SHALL clean up old price columns after successful migration

### Requirement 6: Performance et Indexation

**User Story:** En tant que système, je veux que les requêtes de prix soient
rapides et efficaces, même avec une grande quantité de données.

#### Acceptance Criteria

1. THE System SHALL create appropriate indexes for price queries
2. WHEN querying prices, THE System SHALL respond within 200ms for single game
   queries
3. THE System SHALL optimize queries for common use cases (current prices, best
   offers)
4. THE System SHALL maintain a simple and intuitive data structure
5. THE System SHALL support efficient joins between games, stores, and prices
