# Plateformes gaming liées

## Description

Permet aux joueurs de connecter leurs comptes de plateformes gaming à leur profil GameUniverse. Trois modes selon la plateforme :

- **OAuth** (Steam, Xbox, Epic Games, Discord, Battle.net, itch.io) : connexion réelle via redirection OAuth, récupération automatique du profil (pseudo, avatar, métadonnées) et des tokens pour les appels API ultérieurs.
- **NPSSO** (PlayStation) : l'utilisateur fournit son token NPSSO, échangé côté serveur via `psn-api` pour obtenir les données PSN.
- **Manuel** (GOG, Nintendo, EA, Ubisoft) : saisie du pseudo uniquement, avec validation de format (Nintendo Friend Code) ou d'existence (GOG) selon la plateforme.

L'UI des paramètres est divisée en deux cartes distinctes :
- **Comptes connectés** (OAuth + NPSSO) : affiche l'avatar, un badge "Synced il y a Xh", un toggle de visibilité publique/privée, et un bouton de resync de bibliothèque pour Steam/Xbox.
- **Pseudos manuels** : UX minimale, éditeur de pseudo.

Quand un compte Discord est lié, une bannière de suggestions apparaît au-dessus des deux cartes : elle liste les plateformes présentes dans les connexions Discord de l'utilisateur mais pas encore liées dans GameUniverse, avec un bouton "Lier" qui pointe vers le flow OAuth correspondant.

## Accès

Profil joueur → onglet **Paramètres** → section **Plateformes gaming**.

## Sécurité

- **Chiffrement at-rest AES-256-GCM** : `access_token` / `refresh_token` sont chiffrés au niveau application (`src/lib/services/platformTokens.ts`) avant insertion. Format : `v1:<iv-base64>:<tag-base64>:<cipher-base64>`.
- **State CSRF** : chaque flux OAuth émet un cookie `oauth_state_<platform>` HttpOnly, Secure (en prod), SameSite=Lax, expiration 10 min (`src/lib/services/oauthState.ts`). Le state est vérifié et consommé au callback.
- **Refresh automatique** : `src/lib/services/platformTokenRefresh.ts` expose `getValidAccessToken(supabase, playerId, platform)` qui déchiffre, détecte l'expiration (grâce de 60s) et rafraîchit le token Xbox (login.live.com) ou PSN (`exchangeRefreshTokenForAuthTokens`) avant un appel API.
- **Visibilité par plateforme** : colonne `is_public` (défaut `true`). La policy RLS `SELECT` autorise : `is_public = true OR auth.uid() = player_id`. Le propriétaire voit toujours ses lignes privées.

## Variables d'environnement

| Var | Usage |
|---|---|
| `PLATFORM_TOKEN_ENCRYPTION_KEY` | Clé AES-256 (32 octets base64). **Identique entre dev et prod.** Générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `STEAM_API_KEY` | https://steamcommunity.com/dev/apikey |
| `XBOX_CLIENT_ID` / `XBOX_CLIENT_SECRET` | App Azure AD (personal Microsoft accounts). Scopes `XboxLive.signin XboxLive.offline_access`. |
| `EPIC_CLIENT_ID` / `EPIC_CLIENT_SECRET` | dev.epicgames.com → Product → Client, scope `basic_profile`. |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | discord.com/developers, scopes `identify connections`. |
| `BATTLENET_CLIENT_ID` / `BATTLENET_CLIENT_SECRET` | develop.battle.net, scope `openid` (BattleTag). |
| `ITCH_CLIENT_ID` | itch.io/user/settings/oauth-apps (implicit flow, pas de secret), scope `profile:me`. |
| `CRON_SECRET` | Shared secret pour les routes `/api/cron/*`. Envoyé en `Authorization: Bearer ...` par Vercel Cron. |

## Configuration des providers

Déclarer **les deux** redirect URIs (dev + prod) sur chaque console :
- `http://localhost:3000/api/auth/<platform>/callback`
- `https://<prod-domain>/api/auth/<platform>/callback`

Où `<platform>` ∈ `steam | xbox | epic | discord | battlenet | itch`.

### Steam
1. https://steamcommunity.com/dev/apikey — entrer un domaine, copier la clé → `STEAM_API_KEY`.
2. Pas de redirect URI à déclarer (OpenID dynamique).

### Xbox (Microsoft)
1. https://portal.azure.com → *App registrations* → *New registration*.
2. Supported accounts : **Personal Microsoft accounts only**.
3. Redirect URI (Web) : URL du callback.
4. *Overview* → **Application (client) ID** = `XBOX_CLIENT_ID`.
5. *Certificates & secrets* → *New client secret* → **Value** = `XBOX_CLIENT_SECRET`.

### Epic Games
1. https://dev.epicgames.com/portal → compte dev, accepter le Developer Agreement.
2. *Create Product* → nom + image (visibles lors du consent).
3. *Clients* → *Create Client* type **Game Client** ou **Web**.
4. Redirect URI + scope **Basic Profile** coché.
5. Copier Client ID / Secret.
6. ⚠️ Tant que le product n'est pas publié, seuls les comptes "Owner" peuvent se connecter.

### Discord
1. https://discord.com/developers/applications → *New Application*.
2. Onglet *OAuth2* → ajouter la redirect URI, copier Client ID, *Reset Secret* → Client Secret.

### Battle.net
1. https://develop.battle.net → se connecter, accepter l'EULA.
2. *Create Client* : nom, redirect URLs, Service URL, intended use.
3. Copier Client ID / Secret. L'endpoint `oauth.battle.net` est global (4 régions).

### itch.io
1. https://itch.io/user/settings/oauth-apps → *Create an OAuth application*.
2. Redirect URI, copier Client ID. Pas de secret (implicit flow).

### Obtenir un token NPSSO (PlayStation)
1. Se connecter sur https://www.playstation.com/.
2. Dans le même navigateur, ouvrir https://ca.account.sony.com/api/v1/ssocookie.
3. Copier la valeur du champ `npsso` et la coller dans l'UI.

## Synchronisation des bibliothèques

Deux plateformes font de l'import automatique de la bibliothèque dans la table `user_library` :

- **Steam** (`POST /api/profile/steam/sync-library`) : appelle `IPlayerService/GetOwnedGames`, résout les Steam appids en `games.id` via la colonne de cache `games.steam_appid` puis (pour les inconnus) via IGDB `external_games` (category=1). Les correspondances résolues back-fill `games.steam_appid` pour la prochaine fois.
- **Xbox** (`POST /api/profile/xbox/sync-library`) : rafraîchit l'access_token Microsoft → user token XBL → XSTS via `src/lib/services/xboxAuth.ts`, appelle `titlehub.xboxlive.com/users/xuid(XUID)/titles/titleHistory`, résout les `titleId` via IGDB `external_games` category=31 (Xbox Marketplace).

Chaque ligne insérée dans `user_library` porte :
- `source_platform` (`steam` | `xbox`)
- `source_id` (Steam appid ou Xbox titleId)
- `external_playtime_seconds` (Steam uniquement pour l'instant)
- `synced_at`

L'agrégat `MAX(synced_at)` par plateforme est exposé en `lastSyncedAt` dans `LinkedPlatform`, affiché sous le pseudo dans l'UI.

### Cron

`POST /api/cron/sync-libraries` (protégée par header `Authorization: Bearer $CRON_SECRET` ou `x-cron-secret`) itère jusqu'à 50 comptes steam+xbox et exécute leur sync. Planifiée quotidiennement à 04h00 UTC via `vercel.json`.

## Enrichissement et métadonnées

Les callbacks OAuth alimentent `platform_avatar_url` et `platform_metadata` (JSONB) :

| Plateforme | Avatar | Metadata |
|---|---|---|
| Steam | `avatarfull` | `{ country, profile_url, created_at }` |
| Xbox | `GameDisplayPicRaw` | `{ gamerscore, account_tier }` |
| Discord | `cdn.discordapp.com/avatars/<id>/<avatar>.png\|gif` | `{ connections: [...] }` (liste des comptes liés côté Discord) |
| Epic / Battle.net / itch.io | — (à enrichir) | — |

## Recommandations

`src/lib/services/recommendation/ownershipOverlap.ts` expose :
- `computeOwnershipOverlap({ aGames, bGames })` — pure, calcule la similarité de Jaccard entre deux sets de `game_id`.
- `getOwnershipOverlap(supabase, aId, bId)` — charge les bibliothèques synchronisées (`source_platform IS NOT NULL`) des deux joueurs et renvoie `{ jaccard, intersection, union }`.

Exposé depuis `src/lib/services/recommendation/index.ts`. Pas encore câblé dans `scoreCombiner` — à pondérer lors de la prochaine itération du moteur de reco.

## Suggestions Discord

`GET /api/profile/linked-platforms/suggestions` :
1. Lit les lignes `player_linked_platforms` du joueur courant.
2. Extrait `platform_metadata.connections` de la ligne Discord (si présente).
3. Mappe les types Discord → `GamingPlatform` via `discordConnectionToPlatform` (`src/lib/services/discordConnections.ts`).
4. Filtre ceux déjà liés localement et dédoublonne.
5. Retourne `{ suggestions: [{ platform, username, verified }] }`.

Le composant `SuggestionsBanner.tsx` consomme cette API via SWR (uniquement si Discord est déjà lié) et affiche une bannière avec bouton "Lier" vers le flow OAuth natif pour chaque suggestion.

## Validation manuelle

`src/lib/services/manualPlatformValidation.ts` :
- `nintendo` : regex `/^SW-\d{4}-\d{4}-\d{4}$/`, normalisée en upper-case. Erreur `format` si invalide.
- `gog` : `HEAD https://www.gog.com/u/<username>` avec `redirect: "manual"`. `status === 200` → existe ; `302` → erreur `not_found` ; exception → erreur `unreachable`.
- `ubisoft` / `ea` / autres : trim simple, pas de vérification (API absente ou peu fiable). L'UI affiche une icône info ⚠️ sur ces lignes.

Les erreurs sont renvoyées avec un champ `code` (`empty | format | not_found | unreachable`) traduit côté client en message toast.

## Migrations

| Fichier | Contenu |
|---|---|
| `20260405000001_player_linked_platforms.sql` | Table initiale (`platform` + `platform_username`), RLS, index. |
| `20260411000001_linked_platforms_oauth_support.sql` | `auth_type`, `external_id`, `access_token`, `refresh_token`, `token_expires_at`. |
| `20260417000001_document_linked_platform_token_encryption.sql` | Commentaires des colonnes token (chiffrement applicatif). |
| `20260417000002_linked_platforms_region_avatar.sql` | `platform_region` (Battle.net) + `platform_avatar_url`. |
| `20260417000003_library_platform_sync.sql` | `user_library.{source_platform, source_id, external_playtime_seconds, synced_at}` + `games.steam_appid` (unique partial index). |
| `20260417000004_linked_platforms_metadata.sql` | Colonne `platform_metadata JSONB`. |
| `20260417000005_linked_platforms_visibility.sql` | Colonne `is_public BOOLEAN DEFAULT true` + nouvelle policy `SELECT` (public OR owner). |

## Architecture

### Types

| Fichier | Contenu |
|---|---|
| `src/types/linked-platforms.ts` | `GAMING_PLATFORMS` (ordre d'affichage), `CONNECTED_PLATFORMS` (non-manuels), `PLATFORM_META` (icône/couleur/authType), `LinkedPlatform` interface. |

### Services

| Fichier | Rôle |
|---|---|
| `linkedPlatformService.ts` | CRUD côté serveur : `getLinkedPlatforms`, `upsertManualPlatform`, `deleteLinkedPlatform`, `setPlatformVisibility`. Agrège `lastSyncedAt`. |
| `platformTokens.ts` | Chiffrement AES-256-GCM des tokens. |
| `oauthState.ts` | `issueOauthState` / `consumeOauthState` (cookie HttpOnly). |
| `platformTokenRefresh.ts` | `getValidAccessToken(supabase, playerId, platform)` — déchiffre / refresh Xbox / refresh PSN. |
| `manualPlatformValidation.ts` | `validateManualUsername(platform, raw)` — Nintendo / GOG / passthrough. |
| `xboxAuth.ts` | `getXboxAuthForPlayer` — XSTS + XUID à partir de l'access_token MS stocké. |
| `steamLibrarySync.ts` | Sync Steam + back-fill `games.steam_appid`. |
| `xboxLibrarySync.ts` | Sync Xbox via `titleHistory` + résolution IGDB. |
| `igdb-external-games.ts` | `resolveIgdbIdsByExternalUids(uids, category)` + table `EXTERNAL_GAME_CATEGORY`. |
| `discordConnections.ts` | `discordConnectionToPlatform`, `buildSuggestionsFromDiscord`. |
| `recommendation/ownershipOverlap.ts` | Jaccard overlap entre deux bibliothèques. |

### API routes

| Route | Méthode | Rôle |
|---|---|---|
| `/api/profile/linked-platforms` | GET / PUT / PATCH / DELETE | Lire / sauver un pseudo manuel (validé) / toggle `is_public` / supprimer. |
| `/api/profile/linked-platforms/suggestions` | GET | Liste les plateformes suggérées via Discord. |
| `/api/profile/steam/sync-library` | POST | Sync bibliothèque Steam (user courant). |
| `/api/profile/xbox/sync-library` | POST | Sync bibliothèque Xbox. |
| `/api/auth/steam` + `/callback` | GET | OpenID Steam. |
| `/api/auth/xbox` + `/callback` | GET | OAuth Microsoft → Xbox Live. |
| `/api/auth/epic` + `/callback` | GET | OAuth Epic Account Services. |
| `/api/auth/discord` + `/callback` | GET | OAuth Discord (+ connections). |
| `/api/auth/battlenet` + `/callback` | GET | OAuth Battle.net. |
| `/api/auth/itch` + `/callback` | GET + POST | OAuth itch.io (implicit via bootstrap HTML). |
| `/api/auth/psn` | POST | Exchange NPSSO → tokens PSN. |
| `/api/cron/sync-libraries` | POST | Cron : sync batch steam+xbox. Protégé par `CRON_SECRET`. |

### UI

| Fichier | Rôle |
|---|---|
| `src/hooks/useLinkedPlatforms.ts` | SWR sur `/api/profile/linked-platforms`, expose `savePlatform`, `connectPsn`, `syncLibrary(platform)`, `setVisibility`, `removePlatform`. |
| `src/components/settings/LinkedPlatformsSection.tsx` | Deux cartes (connected / manual) + `SuggestionsBanner`. |
| `src/components/settings/PlatformRow.tsx` | Avatar, pseudo, badge `lastSyncedAt`, boutons sync/edit/visibility/delete. |
| `src/components/settings/SuggestionsBanner.tsx` | SWR sur `/suggestions` (uniquement si Discord lié), chips "Lier" vers l'OAuth. |

## Flux typiques

**OAuth code flow (Steam / Xbox / Epic / Discord / Battle.net)**
1. UI → `GET /api/auth/<platform>` → cookie `oauth_state_<platform>` + redirect vers l'authorize URL du provider.
2. Provider → `GET /api/auth/<platform>/callback?code=...&state=...`.
3. Callback : vérifie le state cookie, échange code → tokens, fetch profil (+ connections Discord, + métadonnées Xbox/Steam), chiffre et upsert dans `player_linked_platforms`.
4. Redirect vers `/players/<id>?tab=settings&platform=<platform>&success=true`.

**itch.io (implicit flow)**
1. UI → `GET /api/auth/itch` → redirect vers itch.
2. itch → `GET /api/auth/itch/callback#access_token=...` → retour d'un HTML qui extrait le token du fragment et `POST` au même endpoint.
3. `POST /api/auth/itch/callback` : vérifie state, appelle `/api/1/key/me`, upsert.

**PSN (NPSSO)**
1. UI → `POST /api/auth/psn` avec `{ npsso }`.
2. `psn-api` : `exchangeNpssoForAccessCode` → `exchangeAccessCodeForAuthTokens`. `accountId` extrait du `sub` JWT `idToken`.
3. Profil via `getProfileFromAccountId`, tokens chiffrés et persistés.

**Sync bibliothèque Steam**
1. UI bouton refresh → `POST /api/profile/steam/sync-library`.
2. Lecture de `external_id` (steamid64) depuis `player_linked_platforms`.
3. `IPlayerService/GetOwnedGames` → liste d'appids.
4. Résolution : `SELECT id FROM games WHERE steam_appid IN (…)` puis pour les manquants, IGDB `external_games` (category=1) → `SELECT id FROM games WHERE igdb_id IN (…)` → back-fill `games.steam_appid`.
5. Upsert `user_library` par chunks de 200 avec `source_platform='steam'`, `source_id=appid`, `external_playtime_seconds`, `synced_at=now()`.

**Sync bibliothèque Xbox**
1. UI bouton refresh → `POST /api/profile/xbox/sync-library`.
2. `getXboxAuthForPlayer` : rafraîchit le MS access_token si expiré → user token XBL → XSTS → `{ xstsToken, userHash, xuid }`.
3. `GET titlehub.xboxlive.com/users/xuid(XUID)/titles/titleHistory/decoration/detail` avec `Authorization: XBL3.0 x=<uhs>;<xsts>`.
4. Filtre `type !== "Application"`, résolution IGDB (category=31), upsert `user_library`.

## Limitations / à venir

- **Riot Sign-On** : nécessite approbation Riot (tickets production). Stub à préparer quand l'accès est validé.
- **PSN library** : `getRecentlyPlayedGames` existe mais le mapping `conceptId` → IGDB est moins direct que Steam/Xbox (IGDB n'a pas de catégorie dédiée évidente). À creuser via `EXTERNAL_GAME_CATEGORY.PLAYSTATION_STORE_US` ou matching par titre normalisé.
- **EA / Ubisoft** : profils publics scrappables mais instables — décision explicite de garder manuel.
- **Discord connections stale** : snapshot fait au moment de la connexion Discord. Si l'utilisateur ajoute un compte Steam côté Discord plus tard, il doit refaire le flow OAuth Discord pour que la suggestion apparaisse.
- **`ownershipOverlap`** : exposé mais pas encore pondéré dans `scoreCombiner`.
- **Cron limit** : 50 comptes par run. À augmenter ou à paginer quand la base grossit.
