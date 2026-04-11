# Plateformes gaming liées

## Description

Permet aux joueurs de lier leurs comptes de plateformes gaming (Steam, Epic Games, Xbox, PlayStation, GOG, Nintendo, Battle.net, EA, Ubisoft Connect, itch.io) à leur profil GameUniverse. Chaque plateforme stocke un nom d'utilisateur/gamertag.

## Accès

- Aller sur son profil joueur → onglet **Paramètres** (icône engrenage)
- La section **Plateformes gaming** se trouve entre Apparence et Sécurité

## Prérequis

- Être connecté à son compte
- Migration `20260405000001_player_linked_platforms.sql` appliquée

## Utilisation

- Cliquer sur le bouton **+** à côté d'une plateforme pour ajouter son pseudo
- Cliquer sur le crayon pour modifier un pseudo existant
- Cliquer sur la corbeille pour supprimer un lien
- Les données sont sauvegardées immédiatement via l'API

## Architecture

| Couche | Fichier |
|--------|---------|
| Migration | `supabase/migrations/20260405000001_player_linked_platforms.sql` |
| Types | `src/types/linked-platforms.ts` |
| Service | `src/lib/services/linkedPlatformService.ts` |
| Route API | `src/app/api/profile/linked-platforms/route.ts` |
| Hook | `src/hooks/useLinkedPlatforms.ts` |
| Composant | `src/components/settings/LinkedPlatformsSection.tsx` |
| Traductions | `src/messages/fr.json` / `en.json` → `settings.platforms` |

## Plateformes supportées

Steam, Epic Games, Xbox, PlayStation, GOG, Nintendo, Battle.net, EA, Ubisoft Connect, itch.io
