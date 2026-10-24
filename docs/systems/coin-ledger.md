# Ledger GU Coins

## Description

Chaque mouvement de GU Coins (bonus d'inscription, récompense d'activité,
mise et gain de pronostic, ajustement admin) passe par une seule fonction SQL,
`post_coin_entry` (migration `20261023000001_atomic_coin_ledger.sql`). Sous un
verrou consultatif par joueur (`coins:<player>`), elle :

1. ignore l'écriture si la `ledger_key` existe déjà (no-op idempotent) ;
2. ouvre le wallet avec le bonus d'inscription (500) s'il n'existe pas ;
3. refuse un débit qui rendrait le solde négatif ;
4. insère l'entrée avec un `balance_after` cohérent.

Vocabulaire : voir `GLOSSARY.md` (ledger, ledger entry, ledger key, settlement).

## Fonctions SQL (EXECUTE réservé à `service_role`)

| Fonction                  | Rôle                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `post_coin_entry`         | Seul chemin d'écriture du ledger                             |
| `ensure_player_wallet`    | Ouvre le wallet (bonus d'inscription) une seule fois         |
| `award_activity_reward`   | Plafonds / cooldown / dédoublonnage, puis `post_coin_entry`  |
| `place_esport_prediction` | Mise (`prediction_bet:<id>`) + insertion du pronostic        |
| `settle_esport_match`     | Règle et paie tout un match en une transaction (tout ou rien)|

Toutes sont `SECURITY INVOKER` avec `search_path = ''`.

## Ledger keys

| Mouvement        | Clé                        |
| ---------------- | -------------------------- |
| Bonus            | `signup_bonus:<player_id>` |
| Mise pronostic   | `prediction_bet:<id>`      |
| Gain pronostic   | `prediction_win:<id>`      |
| Ajustement admin | `admin_grant:<nonce>`      |

Les récompenses d'activité gardent leur dédoublonnage par
`(activity_type, reference_id)` et n'ont pas de clé.

## Côté application

- `CoinService.grant({ adminId, playerId, amount, description, nonce })` :
  renvoie `{ posted: true, transaction }` ou `{ posted: false, reason }`
  (`duplicate` | `insufficient_balance`).
- `POST /api/admin/coins/grant` exige un `nonce` (uuid). Le formulaire admin en
  génère un par tentative : un double clic ou un retry ne crédite qu'une fois.
  Codes d'erreur : `invalid_request` (400), `insufficient_balance` (409),
  `grant_failed` (500).
- `resolvePredictionsForMatch(matchId, winnerId)` appelle
  `settle_esport_match` ; en cas d'échec rien n'est réglé et l'erreur remonte.

## Tests

- Unitaires (mapping) : `src/lib/services/__tests__/coinService*.test.ts`,
  `esportPredictionService.test.ts`, `src/app/api/admin/__tests__/coins-grant.test.ts`.
- Intégration (concurrence, idempotence, règlement) :
  `test/integration/coins/ledger.test.ts`, contre la base locale uniquement :

```bash
bun run supabase:start
bunx supabase db reset
# URL et service_role key affichées par `bunx supabase status`
$env:SUPABASE_LOCAL_URL = "http://127.0.0.1:54321"
$env:SUPABASE_LOCAL_SERVICE_ROLE_KEY = "<service_role key>"
bunx vitest run test/integration/coins/
```

Sans ces variables (ou avec une URL non locale), la suite est ignorée.
