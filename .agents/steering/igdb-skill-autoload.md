---
inclusion: always
---

# Auto-chargement du skill IGDB

## Règle

Dès que l'utilisateur pose une question ou fait une demande liée à **IGDB**
(import de données, synchronisation, API IGDB, endpoints IGDB, requêtes
APICalypse, PopScore, webhooks IGDB, personnages IGDB, scripts d'import IGDB,
`igdbService`, types IGDB, etc.), tu **dois** activer le skill `igdb-api-expert`
via `#igdb-api-expert` avant de répondre.

## Déclencheurs

Activer le skill si le message contient l'un de ces sujets :

- IGDB (en tant que mot ou partie d'un identifiant)
- Import de jeux / personnages depuis une source externe
- Synchronisation de données de jeux
- APICalypse / Apicalypse
- PopScore / popularity primitives
- Webhooks IGDB
- Référence à `igdbService`, `igdb-fetcher`, `igdb-sync`, `igdb-import`
- Référence à des endpoints IGDB (`/games`, `/characters`, `/platforms`, etc.)
- Travail sur les fichiers `scripts/igdb-import/**`
- Travail sur `src/lib/services/igdbService.ts` ou `src/types/igdb.ts`

## Pourquoi

Le skill `igdb-api-expert` contient la documentation complète de l'API IGDB (78
endpoints, champs, enums, images, filtres, pagination, multi-query, PopScore,
webhooks) ainsi que l'intégration spécifique au projet. Sans ce contexte, les
réponses sur IGDB risquent d'être incomplètes ou incorrectes.
