# Suppression de compte (droit à l'effacement RGPD)

## Description

Un joueur peut supprimer son compte et ses données personnelles (issue #378). La
suppression se fait en deux temps :

1. **Demande** : le compte est désactivé immédiatement (profil masqué de la
   liste des joueurs, de la recherche et de `/players/[id]`). Le joueur connecté
   ne peut plus ouvrir que `/account-deletion` (annuler ou se déconnecter) et la
   politique de confidentialité. Rien n'est supprimé : annuler restaure tout.
2. **Purge** : après 30 jours, un job quotidien supprime définitivement le
   compte et les données personnelles. Les contenus créés par le joueur sont
   conservés mais anonymisés (« Utilisateur supprimé »).

E-mails (Resend, best-effort) envoyés à la demande et à la suppression.

## Accès

| Rôle   | Route                                           | Action                                              |
| ------ | ----------------------------------------------- | --------------------------------------------------- |
| Joueur | `/[locale]/settings` → « Supprimer mon compte » | Demande (ré-authentification + mot de confirmation) |
| Joueur | `/[locale]/account-deletion`                    | Annuler pendant le délai, se déconnecter            |
| Admin  | `/[locale]/admin/account-deletions`             | Liste, purge immédiate, annulation                  |

API :

- `GET | POST | DELETE /api/account/deletion` : statut, demande, annulation.
- `GET /api/admin/account-deletions`,
  `POST | DELETE /api/admin/account-deletions/[id]`.
- `GET /api/cron/purge-deleted-accounts` : cron Vercel quotidien (`30 4 * * *`).

## Prérequis

- Migration `20261020000004_account_deletion.sql`.
- `CRON_SECRET` (cron), `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (e-mails),
  `NEXT_PUBLIC_SITE_URL` (lien d'annulation).

## Utilisation

### Demande

- Ré-authentification : mot de passe (vérifié par un client jetable, la session
  ouverte est révoquée aussitôt) ; compte OAuth sans mot de passe : connexion de
  moins de 10 minutes.
- Mot de confirmation : `SUPPRIMER` (fr) / `DELETE` (en).
- Refus tant qu'un paiement de coaching est retenu (`payment_status = 'paid'`)
  ou qu'un litige est ouvert / en cours d'instruction.
- `profiles.deletion_requested_at` / `deletion_scheduled_for` sont écrits par le
  service role uniquement (trigger `protect_profile_deletion_state`).

### Purge (`public.purge_account_data`)

Fonction SQL atomique (service role uniquement), puis suppression des fichiers
Storage du dossier `{userId}/` (sauf images encore affichées) et e-mail de
confirmation.

Règle : **tout contenu créé par le joueur est conservé et anonymisé**. La
colonne auteur passe à `NULL` (FK `ON DELETE SET NULL`) : le contenu s'affiche «
Utilisateur supprimé » et n'est plus rattaché à aucune identité.

| Contenu                                                                                                                                                          | Règle                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Posts, commentaires de posts, avis de jeu, votes sur les avis, commentaires de personnage, posts de groupe / communauté, commentaires de match, avis de coaching | Anonymisés (auteur `NULL`)                                                                                                                                 |
| Messages privés                                                                                                                                                  | Anonymisés (`sender_id = NULL`, marqués lus). La conversation reste lisible par l'autre participant, sans nouvel envoi possible (`409 conversationClosed`) |
| Conversation dont les deux participants sont supprimés                                                                                                           | Supprimée (plus personne ne peut la lire)                                                                                                                  |
| Réactions sur les commentaires de match                                                                                                                          | Retirées du JSONB `reactions`                                                                                                                              |
| Groupe / communauté possédé                                                                                                                                      | Transmis au plus ancien modérateur, sinon au plus ancien membre ; supprimé s'il n'a pas d'autre membre                                                     |
| Images des posts et des groupes transmis                                                                                                                         | Conservées ; avatar, bannière et autres fichiers supprimés                                                                                                 |

Côté UI, le hook `useAuthorDisplayName` affiche `accountDeletion.deletedUser`
dès que l'identifiant d'auteur est `null`.

Données personnelles supprimées (cascade depuis `profiles` / `auth.users`) :
profil, bibliothèque (dont liste de souhaits), sessions de jeu, objectifs, XP,
succès, collections, favoris, notifications, plateformes liées et leurs jetons,
abonnements, amitiés, portefeuille et transactions GU Coins, pronostics, équipes
fantasy, profil coach (et les avis reçus en tant que coach), signalements émis,
auth (sessions, identités).

### Données conservées (obligation légale)

- `coaching_sessions` avec `payment_status` `paid` / `released` / `refunded` :
  conservées 10 ans (art. L123-22 Code de commerce) avec `student_id`,
  `coach_id`, `cancelled_by` et `cancellation_reason` vidés.
- `coaching_disputes.resolved_by` passe à `NULL` quand l'admin est supprimé.
- Les commandes en argent réel (#13) n'existent pas encore.
