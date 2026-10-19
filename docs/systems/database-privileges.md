# Privilèges base de données (Supabase)

## Description

La clé anon et le JWT utilisateur sont publics : n'importe quel client peut
appeler PostgREST directement (`/rest/v1/<table>`, `/rest/v1/rpc/<fonction>`)
sans passer par les routes API. Les **grants**, les **policies RLS** et les
**triggers de garde** constituent donc le vrai périmètre de sécurité.

Depuis la migration `20261018000017_revoke_default_privileges.sql`, les
nouveaux objets du schéma `public` ne sont **plus** accordés automatiquement à
`anon` / `authenticated` :

| Objet créé                 | `anon` | `authenticated` | `service_role` |
| -------------------------- | ------ | --------------- | -------------- |
| Table / séquence           | aucun  | aucun           | tout           |
| Fonction (`PUBLIC` inclus) | aucun  | aucun           | `EXECUTE`      |

Les objets existants avant cette migration gardent leurs droits. Les RPC
historiques dangereuses ont été retirées des clients au cas par cas
(`20261018000013`, `20261019000002`) : magasins (`create_store`,
`update_store`), nettoyage (`cleanup_orphaned_*`), traductions, compteurs de
vues. Les RPC de bibliothèque (`get_common_games`, `get_user_library_stats`…)
sont `SECURITY INVOKER` pour respecter `stats_private`.

## Données écrites par le serveur uniquement

Ces tables n'ont pas de policy d'insertion client ; elles sont écrites via
`getSupabaseAdmin()` :

| Table / colonne                 | Écrit par                                   |
| ------------------------------- | ------------------------------------------- |
| `player_achievements`           | `AchievementEngine`, routes admin           |
| `coin_transactions` / wallets   | `ensure_player_wallet`, `award_activity_reward` (verrou par joueur, une récompense par référence) |
| `content_reports`               | `ReportServerService`                       |
| `game_price_history`            | trigger sur `game_prices`, admins           |
| `match_comments.reactions`      | RPC `toggle_match_comment_reaction`         |
| `coaching_sessions.conversation_id` | `coachingConversationService`           |

Gardes par trigger pour les données saisies par les joueurs (`20261019000001`,
`20261019000003`) : amitiés (seul `status` change, création en `pending`),
invitations de groupe (seul `status` change, invitation en attente et non
expirée), groupes / communautés (`owner_id` figé, visibilité réservée au
propriétaire), sessions de jeu (24 h max par session et par jour).

## Utilisation

Pour toute nouvelle migration :

```sql
-- Table lue/écrite par les clients
CREATE TABLE public.ma_table (...);
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON public.ma_table FOR SELECT USING (...);
GRANT SELECT ON public.ma_table TO anon, authenticated;
GRANT INSERT, UPDATE ON public.ma_table TO authenticated;

-- RPC appelée par un utilisateur connecté
CREATE FUNCTION public.ma_rpc(...) ... SECURITY INVOKER ...;
GRANT EXECUTE ON FUNCTION public.ma_rpc(...) TO authenticated;
```

- Objet réservé au serveur : aucun `GRANT` client, RLS activé sans policy,
  accès via `getSupabaseAdmin()`.
- `SECURITY DEFINER` seulement si nécessaire, avec `SET search_path` et un
  contrôle `auth.uid()` / `public.is_admin()` dans le corps.
- Colonnes sensibles (prix, paiement, soldes, notes, rôles, ids Stripe,
  tokens) : trigger `BEFORE INSERT OR UPDATE` qui les fige pour
  `authenticated` / `anon` (voir `enforce_coaching_session_write`,
  `enforce_coach_profile_write`).
- Le rôle admin se lit dans `app_metadata` (`public.is_admin()`), jamais dans
  `user_metadata`.

## Vérification

```sql
-- Droits par défaut restants pour postgres dans public
SELECT defaclobjtype, defaclacl FROM pg_default_acl
WHERE defaclrole = 'postgres'::regrole AND defaclnamespace = 'public'::regnamespace;

-- Un objet est-il accessible ?
SELECT has_table_privilege('anon', 'public.ma_table', 'SELECT');
SELECT has_function_privilege('authenticated', 'public.ma_rpc(uuid)', 'EXECUTE');
```

> En local, appeler depuis `psql` une fonction révoquée pour le rôle courant
> fait planter l'image `supabase/postgres:17.6.1.104` (segfault) ; utiliser
> `has_function_privilege` pour les tests. Via PostgREST, l'appel renvoie bien
> une 401.
