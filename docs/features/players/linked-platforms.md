# Plateformes gaming liées

## Description

Permet aux joueurs de connecter leurs comptes de plateformes gaming à leur
profil GameUniverse. Trois modes selon la plateforme :

- **OAuth** (Steam, Xbox, Epic Games, Discord, Battle.net, itch.io) : connexion
  réelle via redirection OAuth, récupération automatique du profil (pseudo,
  avatar, métadonnées) et des tokens pour les appels API ultérieurs.
- **NPSSO** (PlayStation) : l'utilisateur fournit son token NPSSO, échangé côté
  serveur via `psn-api` pour obtenir les données PSN.
- **Manuel** (GOG, Nintendo, EA, Ubisoft) : saisie du pseudo uniquement, avec
  validation de format (Nintendo Friend Code) ou d'existence (GOG) selon la
  plateforme.

L'UI des paramètres est divisée en deux cartes distinctes :

- **Comptes connectés** (OAuth + NPSSO) : affiche l'avatar, un badge "Synced il
  y a Xh", un toggle de visibilité publique/privée, et un bouton de resync de
  bibliothèque pour Steam/Xbox.
- **Pseudos manuels** : UX minimale, éditeur de pseudo.

Quand un compte Discord est lié, une bannière de suggestions apparaît au-dessus
des deux cartes : elle liste les plateformes présentes dans les connexions
Discord de l'utilisateur mais pas encore liées dans GameUniverse, avec un bouton
"Lier" qui pointe vers le flow OAuth correspondant.

## Accès

Profil joueur → onglet **Paramètres** → section **Plateformes gaming**.

## Sécurité

- **Chiffrement at-rest AES-256-GCM** : `access_token` / `refresh_token` sont
  chiffrés au niveau application (`src/lib/services/platformTokens.ts`) avant
  insertion. Format : `v1:<iv-base64>:<tag-base64>:<cipher-base64>`.
- **State CSRF** : chaque flux OAuth émet un cookie `oauth_state_<platform>`
  HttpOnly, Secure (en prod), SameSite=Lax, expiration 10 min
  (`src/lib/services/oauthState.ts`). Le state est vérifié et consommé au
  callback.
- **Refresh automatique** : `getValidAccessToken(supabase, playerId, platform)`
  (`src/lib/services/platform-connection/refresh.ts`) déchiffre, détecte
  l'expiration (grâce de 60s) et délègue le refresh à l'adaptateur de la
  plateforme : Xbox (login.live.com), Epic et Discord (grant OAuth
  `refresh_token`), PSN (`exchangeRefreshTokenForAuthTokens`). Battle.net, Steam
  et itch.io n'ont pas de refresh.
- **Visibilité par plateforme** : colonne `is_public` (défaut `true`). La policy
  RLS `SELECT` autorise : `is_public = true OR auth.uid() = player_id`. Le
  propriétaire voit toujours ses lignes privées.

## Variables d'environnement

| Var                                               | Usage                                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PLATFORM_TOKEN_ENCRYPTION_KEY`                   | Clé AES-256 (32 octets base64). **Identique entre dev et prod.** Générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `STEAM_API_KEY`                                   | https://steamcommunity.com/dev/apikey                                                                                                                        |
| `XBOX_CLIENT_ID` / `XBOX_CLIENT_SECRET`           | App Azure AD (personal Microsoft accounts). Scopes `XboxLive.signin XboxLive.offline_access`.                                                                |
| `EPIC_CLIENT_ID` / `EPIC_CLIENT_SECRET`           | dev.epicgames.com → Product → Client, scope `basic_profile`.                                                                                                 |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`     | discord.com/developers, scopes `identify connections`.                                                                                                       |
| `BATTLENET_CLIENT_ID` / `BATTLENET_CLIENT_SECRET` | develop.battle.net, scope `openid` (BattleTag).                                                                                                              |
| `ITCH_CLIENT_ID`                                  | itch.io/user/settings/oauth-apps (implicit flow, pas de secret), scope `profile:me`.                                                                         |
| `CRON_SECRET`                                     | Shared secret pour les routes `/api/cron/*`. Envoyé en `Authorization: Bearer ...` par Vercel Cron.                                                          |

## Configuration des providers

Déclarer **les deux** redirect URIs (dev + prod) sur chaque console :

- `http://localhost:3000/api/auth/<platform>/callback`
- `https://<prod-domain>/api/auth/<platform>/callback`

Où `<platform>` ∈ `steam | xbox | epic | discord | battlenet | itch`.

### Steam

1. https://steamcommunity.com/dev/apikey — entrer un domaine, copier la clé →
   `STEAM_API_KEY`.
2. Pas de redirect URI à déclarer (OpenID dynamique).

### Xbox (Microsoft)

1. https://portal.azure.com → _App registrations_ → _New registration_.
2. Supported accounts : **Personal Microsoft accounts only**.
3. Redirect URI (Web) : URL du callback.
4. _Overview_ → **Application (client) ID** = `XBOX_CLIENT_ID`.
5. _Certificates & secrets_ → _New client secret_ → **Value** =
   `XBOX_CLIENT_SECRET`.

### Epic Games

1. https://dev.epicgames.com/portal → compte dev, accepter le Developer
   Agreement.
2. _Create Product_ → nom + image (visibles lors du consent).
3. _Clients_ → _Create Client_ type **Game Client** ou **Web**.
4. Redirect URI + scope **Basic Profile** coché.
5. Copier Client ID / Secret.
6. ⚠️ Tant que le product n'est pas publié, seuls les comptes "Owner" peuvent se
   connecter.

### Discord

1. https://discord.com/developers/applications → _New Application_.
2. Onglet _OAuth2_ → ajouter la redirect URI, copier Client ID, _Reset Secret_ →
   Client Secret.

### Battle.net

1. https://develop.battle.net → se connecter, accepter l'EULA.
2. _Create Client_ : nom, redirect URLs, Service URL, intended use.
3. Copier Client ID / Secret. L'endpoint `oauth.battle.net` est global (4
   régions).

### itch.io

1. https://itch.io/user/settings/oauth-apps → _Create an OAuth application_.
2. Redirect URI, copier Client ID. Pas de secret (implicit flow).

### Obtenir un token NPSSO (PlayStation)

1. Se connecter sur https://www.playstation.com/.
2. Dans le même navigateur, ouvrir https://ca.account.sony.com/api/v1/ssocookie.
3. Copier la valeur du champ `npsso` et la coller dans l'UI.

## Synchronisation des bibliothèques

Deux plateformes font de l'import automatique de la bibliothèque dans la table
`user_library` :

- **Steam** (`POST /api/profile/steam/sync-library`) : appelle
  `IPlayerService/GetOwnedGames`, résout les Steam appids en `games.id` via la
  colonne de cache `games.steam_appid` puis (pour les inconnus) via IGDB
  `external_games` (category=1). Les correspondances résolues back-fill
  `games.steam_appid` pour la prochaine fois.
- **Xbox** (`POST /api/profile/xbox/sync-library`) : rafraîchit l'access_token
  Microsoft → user token XBL → XSTS via `getXboxAuthForPlayer`
  (`src/lib/services/platform-connection/xboxPlayerAuth.ts`), appelle
  `titlehub.xboxlive.com/users/xuid(XUID)/titles/titleHistory`, résout les
  `titleId` via IGDB `external_games` category=31 (Xbox Marketplace).

Chaque ligne insérée dans `user_library` porte :

- `source_platform` (`steam` | `xbox`)
- `source_id` (Steam appid ou Xbox titleId)
- `external_playtime_seconds` (Steam uniquement pour l'instant)
- `synced_at`

L'agrégat `MAX(synced_at)` par plateforme est exposé en `lastSyncedAt` dans
`LinkedPlatform`, affiché sous le pseudo dans l'UI.

### Cron

`POST /api/cron/sync-libraries` (protégée par header
`Authorization: Bearer $CRON_SECRET` ou `x-cron-secret`) traite jusqu'à 50
comptes liés synchronisables par exécution et lance leur sync via le système de
jobs. Rotation : les comptes sont triés par
`player_linked_platforms.last_library_sync_at` (NULLs en premier, puis `id`),
colonne horodatée par le service role à la fin de chaque job (succès ou échec,
pas pendant une continuation). Les comptes jamais synchronisés passent donc en
premier, puis les moins récemment synchronisés. Colonne serveur uniquement :
non sélectionnable par `anon`/`authenticated` et figée par trigger pour eux
(migration `20261020000003`). Planifiée quotidiennement à 04h00 UTC via
`vercel.json`.

## Enrichissement et métadonnées

Les callbacks OAuth alimentent `platform_avatar_url` et `platform_metadata`
(JSONB) :

| Plateforme        | Avatar                                              | Metadata                                                       |
| ----------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Steam             | `avatarfull`                                        | `{ country, profile_url, created_at }`                         |
| Xbox              | `GameDisplayPicRaw`                                 | `{ gamerscore, account_tier }`                                 |
| Discord           | `cdn.discordapp.com/avatars/<id>/<avatar>.png\|gif` | `{ connections: [...] }` (liste des comptes liés côté Discord) |
| itch.io           | `cover_url`                                         | —                                                              |
| Epic / Battle.net | — (à enrichir)                                      | — (Battle.net : `platform_region`)                             |

## Suggestions Discord

`GET /api/profile/linked-platforms/suggestions` :

1. Lit les lignes `player_linked_platforms` du joueur courant.
2. Extrait `platform_metadata.connections` de la ligne Discord (si présente).
3. Mappe les types Discord → `GamingPlatform` via `discordConnectionToPlatform`
   (`src/lib/services/discordConnections.ts`).
4. Filtre ceux déjà liés localement et dédoublonne.
5. Retourne `{ suggestions: [{ platform, username, verified }] }`.

Le composant `SuggestionsBanner.tsx` consomme cette API via SWR (uniquement si
Discord est déjà lié) et affiche une bannière avec bouton "Lier" vers le flow
OAuth natif pour chaque suggestion.

## Validation manuelle

`src/lib/services/manualPlatformValidation.ts` :

- `nintendo` : regex `/^SW-\d{4}-\d{4}-\d{4}$/`, normalisée en upper-case.
  Erreur `format` si invalide.
- `gog` : `HEAD https://www.gog.com/u/<username>` avec `redirect: "manual"`.
  `status === 200` → existe ; `302` → erreur `not_found` ; exception → erreur
  `unreachable`.
- `ubisoft` / `ea` / autres : trim simple, pas de vérification (API absente ou
  peu fiable). L'UI affiche une icône info ⚠️ sur ces lignes.

Les erreurs sont renvoyées avec un champ `code`
(`empty | format | not_found | unreachable`) traduit côté client en message
toast.

## Migrations

| Fichier                                                        | Contenu                                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `20260405000001_player_linked_platforms.sql`                   | Table initiale (`platform` + `platform_username`), RLS, index.                                                                  |
| `20260411000001_linked_platforms_oauth_support.sql`            | `auth_type`, `external_id`, `access_token`, `refresh_token`, `token_expires_at`.                                                |
| `20260417000001_document_linked_platform_token_encryption.sql` | Commentaires des colonnes token (chiffrement applicatif).                                                                       |
| `20260417000002_linked_platforms_region_avatar.sql`            | `platform_region` (Battle.net) + `platform_avatar_url`.                                                                         |
| `20260417000003_library_platform_sync.sql`                     | `user_library.{source_platform, source_id, external_playtime_seconds, synced_at}` + `games.steam_appid` (unique partial index). |
| `20260417000004_linked_platforms_metadata.sql`                 | Colonne `platform_metadata JSONB`.                                                                                              |
| `20260417000005_linked_platforms_visibility.sql`               | Colonne `is_public BOOLEAN DEFAULT true` + nouvelle policy `SELECT` (public OR owner).                                          |

## Architecture

### Types

| Fichier                         | Contenu                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/linked-platforms.ts` | `GAMING_PLATFORMS` (ordre d'affichage), `CONNECTED_PLATFORMS` (non-manuels), `PLATFORM_META` (icône/couleur/authType), `LinkedPlatform` interface. |

### Services

| Fichier                              | Rôle                                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `linkedPlatformService.ts`           | CRUD côté serveur : `getLinkedPlatforms`, `upsertManualPlatform`, `deleteLinkedPlatform`, `setPlatformVisibility`. Agrège `lastSyncedAt`.       |
| `platformTokens.ts`                  | Chiffrement AES-256-GCM des tokens.                                                                                                             |
| `oauthState.ts`                      | `issueOauthState` / `consumeOauthState` (cookie HttpOnly).                                                                                      |
| `oauthReturn.ts`                     | `issueOauthReturn` / `consumeOauthReturn` (page de retour, cookie HttpOnly).                                                                    |
| `platform-connection/`               | Module unique des 7 flux de connexion : flux commun + adaptateurs `adapters/{xbox,epic,battlenet,discord,steam,itch,psn}.ts` (voir ci-dessous). |
| `manualPlatformValidation.ts`        | `validateManualUsername(platform, raw)` — Nintendo / GOG / passthrough.                                                                         |
| `library-sync/`                      | Module unique : `syncPlatformLibrary(supabase, userId, platform)` + adaptateurs `adapters/{steam,xbox,playstation}.ts`, `runLibrarySyncJob`.    |
| `igdb-external-games.ts`             | `resolveIgdbIdsByExternalUids(uids, category)` + table `EXTERNAL_GAME_CATEGORY`.                                                                |
| `discordConnections.ts`              | `discordConnectionToPlatform`, `buildSuggestionsFromDiscord`.                                                                                   |

### API routes

| Route                                       | Méthode                    | Rôle                                                                                                  |
| ------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/api/profile/linked-platforms`             | GET / PUT / PATCH / DELETE | Lire / sauver un pseudo manuel (validé) / toggle `is_public` / supprimer.                             |
| `/api/profile/linked-platforms/suggestions` | GET                        | Liste les plateformes suggérées via Discord.                                                          |
| `/api/profile/steam/sync-library`           | POST                       | Sync bibliothèque Steam (user courant).                                                               |
| `/api/profile/xbox/sync-library`            | POST                       | Sync bibliothèque Xbox.                                                                               |
| `/api/auth/steam` + `/callback`             | GET                        | OpenID Steam.                                                                                         |
| `/api/auth/xbox` + `/callback`              | GET                        | OAuth Microsoft → Xbox Live.                                                                          |
| `/api/auth/epic` + `/callback`              | GET                        | OAuth Epic Account Services.                                                                          |
| `/api/auth/discord` + `/callback`           | GET                        | OAuth Discord (+ connections).                                                                        |
| `/api/auth/battlenet` + `/callback`         | GET                        | OAuth Battle.net.                                                                                     |
| `/api/auth/itch` + `/callback`              | GET + POST                 | OAuth itch.io (implicit via bootstrap HTML).                                                          |
| `/api/auth/psn`                             | POST                       | Exchange NPSSO → tokens PSN.                                                                          |
| `/api/cron/sync-libraries`                  | POST                       | Cron : crée un job par compte lié (rotation `last_library_sync_at` NULLs en premier, verrou job actif respecté). Protégé par `CRON_SECRET`. |

### UI

| Fichier                                              | Rôle                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useLinkedPlatforms.ts`                    | SWR sur `/api/profile/linked-platforms`, expose `savePlatform`, `connectPsn`, `syncLibrary(platform)`, `setVisibility`, `removePlatform`. |
| `src/components/settings/LinkedPlatformsSection.tsx` | Deux cartes (connected / manual) + `SuggestionsBanner`.                                                                                   |
| `src/components/settings/PlatformRow.tsx`            | Avatar, pseudo, badge `lastSyncedAt`, boutons sync/edit/visibility/delete.                                                                |
| `src/components/settings/SuggestionsBanner.tsx`      | SWR sur `/suggestions` (uniquement si Discord lié), chips "Lier" vers l'OAuth.                                                            |

## Flux typiques

Toutes les routes `/api/auth/<provider>` et `/callback` sont des fichiers d'une
ligne qui lient un adaptateur à un handler de
`src/lib/services/platform-connection/routeHandlers.ts`. Le flux commun
(`connectPlatform.ts`) : authentifie le joueur, vérifie le state, lit le grant
(`code`, assertion OpenID, token implicite ou NPSSO), appelle l'adaptateur
(credentials puis profil), normalise la durée de vie du token (`expires_in` ou
défaut de l'adaptateur), chiffre et upsert la ligne `player_linked_platforms`
(`onConflict: player_id,platform`) en vérifiant l'erreur d'écriture.

Un adaptateur (`PlatformConnectionAdapter`, `src/types/platform-connection.ts`)
fournit uniquement : `buildAuthorizeUrl`, `obtainCredentials`, `readProfile` et
optionnellement `refresh`. La chaîne XBL → XSTS vit une seule fois dans
`xboxLive.ts` (connexion, refresh et sync bibliothèque).

**Redirections de sortie** (succès et erreur) : le cookie `oauth_return_to` est
toujours consommé ; destination = page de retour, sinon
`/players/<id>?tab=settings`.

- Succès : `?platform=<provider>&success=true`.
- Erreur : `?error=<provider>_callback_failed&reason=<raison>[&detail=...]` avec
  `reason` ∈
  `state_mismatch | no_code | auth_failed | token_failed | profile_failed | persist_failed | unexpected`
  ; `detail` (≤ 160 caractères) porte l'erreur du provider (ex :
  `invalid_grant: ...`).
- Non connecté : `/auth?error=unauthorized`. Crash avant identification du
  joueur : `/?error=<provider>_callback_failed`.

**OAuth code flow (Xbox / Epic / Discord / Battle.net) et OpenID (Steam)**

1. UI → `GET /api/auth/<platform>` → cookies `oauth_state_<platform>` +
   `oauth_return_to` (+ `oauth_region_battlenet`) puis redirect vers le
   provider.
2. Provider → `GET /api/auth/<platform>/callback?code=...&state=...`.
3. Flux commun ci-dessus (+ connections Discord, + métadonnées Xbox/Steam).

**itch.io (implicit flow)**

1. UI → `GET /api/auth/itch` → redirect vers itch.
2. itch → `GET /api/auth/itch/callback#access_token=...` → retour d'un HTML qui
   extrait le token du fragment et `POST` au même endpoint.
3. `POST /api/auth/itch/callback` : flux commun, réponse `{ redirect }`.

**PSN (NPSSO)**

1. UI → `POST /api/auth/psn` avec `{ npsso }` (pas de state).
2. `psn-api` : `exchangeNpssoForAccessCode` → `exchangeAccessCodeForAuthTokens`.
   `accountId` extrait du `sub` JWT `idToken`.
3. Profil via `getProfileFromAccountId`, tokens chiffrés et persistés. Réponse
   JSON `{ success, username, accountId }` ou `{ error }` (400 / 401).

**Sync bibliothèque (Steam / Xbox / PlayStation)**

1. UI bouton refresh → `POST /api/profile/<platform>/sync-library` → job
   `player_library_sync_jobs` exécuté en `after()` par `runLibrarySyncJob`.
2. `syncPlatformLibrary` charge l'adaptateur de la plateforme, qui lit ses
   propres identifiants et normalise la bibliothèque en items communs
   (`sourceId`, `name`, `uids`, `playtimeMinutes?`) :
   - Steam : `external_id` (steamid64) depuis `player_linked_platforms`,
     `IPlayerService/GetOwnedGames`, tri par temps de jeu, pré-résolution via
     `games.steam_appid`.
   - Xbox : `getXboxAuthForPlayer` (XSTS + XUID) puis `titleHistory`, filtre
     `type !== "Application"`.
   - PlayStation : trophy titles paginés (`getUserTitles`).
3. Pipeline commun : enregistrement des titres (`user_platform_titles`),
   résolution via `libraryGameResolver` (cache `platform_game_matches`,
   `external_games`, fallback par nom, import IGDB budgété, backfill),
   dédoublonnage par jeu (Steam garde le plus joué), upsert `user_library` par
   chunks de 200.
4. Le job se termine quand plus aucun titre n'est en attente (`pending === 0`),
   sinon une continuation serveur relance une passe.

## Limitations / à venir

- **Riot Sign-On** : nécessite approbation Riot (tickets production). Stub à
  préparer quand l'accès est validé.
- **PSN library** : `getRecentlyPlayedGames` existe mais le mapping `conceptId`
  → IGDB est moins direct que Steam/Xbox (IGDB n'a pas de catégorie dédiée
  évidente). À creuser via `EXTERNAL_GAME_CATEGORY.PLAYSTATION_STORE_US` ou
  matching par titre normalisé.
- **EA / Ubisoft** : profils publics scrappables mais instables — décision
  explicite de garder manuel.
- **Discord connections stale** : snapshot fait au moment de la connexion
  Discord. Si l'utilisateur ajoute un compte Steam côté Discord plus tard, il
  doit refaire le flow OAuth Discord pour que la suggestion apparaisse.
- **Cron limit** : 50 comptes par run. À augmenter ou à paginer quand la base
  grossit.
