# Plateformes gaming liées

## Description

Permet aux joueurs de connecter leurs comptes de plateformes gaming à leur profil GameUniverse. Trois modes de connexion selon la plateforme :

- **OAuth** (Steam, Xbox) : connexion réelle via redirection OAuth, récupération automatique du profil
- **NPSSO** (PlayStation) : l'utilisateur fournit son token NPSSO, échangé côté serveur via `psn-api` pour obtenir les données PSN
- **Manuel** (Epic, GOG, Nintendo, Battle.net, EA, Ubisoft, itch.io) : saisie du pseudo uniquement

## Accès

Profil joueur → onglet **Paramètres** → section **Plateformes gaming**

## Prérequis

- Être connecté à son compte
- Migrations appliquées : `20260405000001` + `20260411000001`
- Variables d'environnement :
  - `STEAM_API_KEY` — clé API Steam Web (https://steamcommunity.com/dev/apikey)
  - `XBOX_CLIENT_ID` — ID client Azure AD avec scope XboxLive.signin
  - `XBOX_CLIENT_SECRET` — secret client Azure AD

## Utilisation

| Plateforme | Action |
|---|---|
| Steam | Cliquer sur l'icône de connexion → redirection vers Steam → retour automatique |
| Xbox | Cliquer sur l'icône de connexion → redirection vers Microsoft → retour automatique |
| PlayStation | Cliquer sur l'icône clé → coller le token NPSSO → validation |
| Autres | Cliquer sur + → saisir le pseudo → valider |

### Obtenir un token NPSSO (PlayStation)

1. Se connecter sur https://www.playstation.com/
2. Dans le même navigateur, aller sur https://ca.account.sony.com/api/v1/ssocookie
3. Copier la valeur du champ `npsso`

## Architecture

| Couche | Fichier |
|--------|---------|
| Migrations | `supabase/migrations/20260405000001_*.sql` + `20260411000001_*.sql` |
| Types | `src/types/linked-platforms.ts` |
| Service | `src/lib/services/linkedPlatformService.ts` |
| Route API | `src/app/api/profile/linked-platforms/route.ts` |
| OAuth Steam | `src/app/api/auth/steam/route.ts` + `callback/route.ts` |
| OAuth Xbox | `src/app/api/auth/xbox/route.ts` + `callback/route.ts` |
| PSN | `src/app/api/auth/psn/route.ts` |
| Hook | `src/hooks/useLinkedPlatforms.ts` |
| Composants | `src/components/settings/LinkedPlatformsSection.tsx` + `PlatformRow.tsx` |
