# Implementation Plan: Historique de Prix

## Overview

Implémentation incrémentale de l'historique de prix : d'abord la couche données (migration SQL + trigger + fonctions), puis la couche API, puis les types et le service, et enfin les composants UI avec intégration dans la page de détail du jeu.

## Tasks

- [x] 1. Créer la migration SQL pour la table `game_price_history` et le trigger
  - [x] 1.1 Créer le fichier de migration `supabase/migrations/20240221000001_game_price_history.sql`
    - Créer la table `game_price_history` avec colonnes : id, game_id, store_id, price, currency, platform, recorded_at
    - Ajouter les contraintes : FK vers games et stores avec ON DELETE CASCADE, CHECK price >= 0, currency 3 lettres majuscules
    - Créer les index : `idx_price_history_game_id`, `idx_price_history_game_date` (game_id, recorded_at DESC), `idx_price_history_game_store` (game_id, store_id)
    - Activer RLS avec politique de lecture publique et écriture restreinte aux authentifiés
    - Ajouter les COMMENT ON pour documenter la table et les colonnes
    - _Requirements: 1.3, 1.4, 6.1, 6.2, 6.3_

  - [x] 1.2 Créer le trigger `record_price_history` sur `game_prices`
    - Créer la fonction `record_price_history()` avec bloc EXCEPTION pour résilience
    - Sur INSERT : enregistrer un snapshot initial avec le prix de création
    - Sur UPDATE : enregistrer un snapshot seulement si `OLD.price IS DISTINCT FROM NEW.price`
    - Journaliser les erreurs via RAISE WARNING sans bloquer la transaction
    - Attacher le trigger AFTER INSERT OR UPDATE sur `game_prices`
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Créer les fonctions SQL de récupération d'historique
  - [x] 2.1 Créer le fichier de migration `supabase/migrations/20240221000002_price_history_functions.sql`
    - Implémenter `get_price_history(game_uuid, start_date, end_date, store_filter, platform_filter)` avec jointure sur stores, tri par recorded_at ASC, et période par défaut de 12 mois
    - Implémenter `get_price_history_stats(game_uuid)` retournant min_price, max_price, avg_price, currency, total_snapshots
    - Accorder les permissions EXECUTE aux rôles anon et authenticated
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Créer les types TypeScript et le service d'historique de prix
  - [x] 3.1 Créer le fichier de types `src/types/price-history.ts`
    - Définir les interfaces : PriceSnapshot, PriceHistoryStats, PriceHistoryFilters, PriceHistoryPeriod, PriceHistoryResponse, PriceChartDataPoint
    - Exporter depuis `src/types/index.ts`
    - _Requirements: 2.1_

  - [x] 3.2 Créer le service `src/lib/services/priceHistoryService.ts`
    - Implémenter `fetchPriceHistory(gameSlug, filters)` qui appelle l'API route
    - Implémenter `formatChartData(snapshots)` qui transforme les snapshots en PriceChartDataPoint[] groupés par magasin
    - Implémenter `computePriceIndicators(currentPrice, stats)` qui détermine les indicateurs "prix au plus bas" et "en dessous de la moyenne"
    - Implémenter `getDateRangeForPeriod(period)` qui calcule les dates de début/fin pour chaque période prédéfinie
    - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3_

  - [x] 3.3 Écrire les tests property-based pour le service d'historique
    - **Property 2: Filtrage par magasin** — Pour tout ensemble de snapshots et tout filtre magasin, les résultats filtrés ne contiennent que des snapshots du magasin spécifié
    - **Validates: Requirements 2.2**
    - **Property 3: Tri chronologique** — Pour tout ensemble de snapshots retournés, les timestamps recorded_at sont en ordre croissant
    - **Validates: Requirements 2.3**
    - **Property 5: Exactitude des statistiques** — Pour tout ensemble non-vide de prix, min <= tous les prix, max >= tous les prix, avg = moyenne arithmétique
    - **Validates: Requirements 2.5, 5.1**
    - **Property 6: Filtrage par période** — Pour toute période sélectionnée, tous les snapshots retournés ont un recorded_at dans la période
    - **Validates: Requirements 4.2**
    - **Property 7: Indicateurs de prix** — Pour tout prix courant et stats historiques, les indicateurs sont affichés si et seulement si les conditions sont remplies
    - **Validates: Requirements 5.2, 5.3**

  - [x] 3.4 Écrire les tests unitaires pour le service d'historique
    - Tester `formatChartData` avec des cas spécifiques : un seul magasin, plusieurs magasins, données vides
    - Tester `getDateRangeForPeriod` pour chaque période prédéfinie
    - Tester `computePriceIndicators` avec des cas limites : prix = min, prix = avg, prix > max
    - _Requirements: 2.1, 4.2, 5.1, 5.2, 5.3_

- [x] 4. Checkpoint — Vérifier que la couche données et service fonctionne
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Créer l'API route d'historique de prix
  - [x] 5.1 Créer `src/app/api/games/[slug]/price-history/route.ts`
    - Implémenter le handler GET avec query params : period, store, platform
    - Résoudre le game_id à partir du slug
    - Appeler les fonctions SQL via Supabase RPC
    - Retourner 404 si jeu inexistant, 400 si paramètres invalides, 200 avec { history, stats }
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 5.2 Écrire les tests unitaires pour l'API route
    - Tester la réponse 200 avec données valides
    - Tester la réponse 404 pour un slug inexistant
    - Tester la réponse 400 pour une période invalide
    - Tester la réponse 200 avec tableau vide quand aucun historique
    - _Requirements: 2.1_

- [x] 6. Créer le hook et les composants UI
  - [x] 6.1 Créer le hook `src/hooks/usePriceHistory.ts`
    - Implémenter le fetch des données d'historique via le service
    - Gérer les états loading, error, et données
    - Refetch automatique quand les filtres changent
    - _Requirements: 2.1, 4.2_

  - [x] 6.2 Installer Recharts et créer le composant `src/components/games/details/PriceHistoryChart.tsx`
    - Installer `recharts` comme dépendance
    - Implémenter un LineChart responsive avec une courbe par magasin (couleurs distinctes)
    - Ajouter un Tooltip personnalisé affichant prix, magasin, plateforme et date
    - Formater l'axe X (dates) et l'axe Y (prix avec devise)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.3 Créer le composant `src/components/games/details/PriceHistoryStats.tsx`
    - Afficher 3 cartes : prix minimum, prix maximum, prix moyen
    - Afficher l'indicateur "prix au plus bas" quand prix courant = min historique
    - Afficher l'indicateur "en dessous de la moyenne" quand prix courant < moyenne
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.4 Créer le composant `src/components/games/details/PriceHistoryFilters.tsx`
    - Implémenter les boutons de sélection de période : 1m, 3m, 6m, 1y, tout
    - Implémenter le filtre par magasin (toggle par magasin disponible)
    - Conserver les préférences de filtre dans le state local du composant parent
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.5 Créer le composant orchestrateur `src/components/games/details/PriceHistoryTab.tsx`
    - Composer PriceHistoryFilters, PriceHistoryStats et PriceHistoryChart
    - Gérer le state des filtres et le passer au hook usePriceHistory
    - Afficher un skeleton loader pendant le chargement
    - Afficher un message d'état vide si aucun historique disponible
    - Afficher un message d'erreur avec bouton réessayer en cas d'échec
    - _Requirements: 3.1, 3.5, 4.1_

- [x] 7. Intégrer l'onglet historique de prix dans la page de détail du jeu
  - [x] 7.1 Modifier `GameDetailsTabs` pour ajouter l'onglet "Prix"
    - Ajouter `"priceHistory"` au type `TabType`
    - Ajouter le bouton d'onglet avec icône `TrendingUp` de lucide-react
    - Rendre `PriceHistoryTab` quand l'onglet est actif
    - Passer le `game.id`, `game.slug`, `game.pricing` (prix courants) et `colors` comme props
    - _Requirements: 3.1_

  - [x] 7.2 Ajouter les clés de traduction i18n pour l'onglet historique de prix
    - Ajouter les traductions FR et EN dans les fichiers de messages pour : nom de l'onglet, libellés des périodes, libellés des stats, messages d'état vide/erreur
    - _Requirements: 3.1, 3.5_

- [x] 8. Checkpoint final — Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Lint du code
  - [x] 9.1 Exécuter `bun run lint`
  - [x] 9.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 9.3 Corriger les erreurs de lint si nécessaire

- [x] 10. Build de production
  - [x] 10.1 Exécuter `bun run build`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 10.3 Corriger les erreurs de build si nécessaire

- [x] 11. README de la fonctionnalité
  - [x] 11.1 Créer `docs/README_PRICE_HISTORY.md`
  - [x] 11.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident des exemples spécifiques et des cas limites
- La bibliothèque `fast-check` est déjà installée dans le projet
- Les tests utilisent `bun:test` exclusivement et sont placés dans `test/unit/lib/services/`
