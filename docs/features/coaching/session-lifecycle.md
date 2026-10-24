# Cycle de vie des sessions de coaching

## Description

Toutes les transitions d'une session de coaching (statut + statut de paiement) passent par un seul
module : `src/lib/services/coaching-lifecycle/`. Il possède les gardes, les claims atomiques
(compare-and-set sur `status` + `payment_status`), le remboursement Stripe et les effets de bord
(conversation, notifications). Les routes et le webhook Stripe ne sont que des adapters.

Interface (`getCoachingLifecycle()` en production, `createCoachingLifecycle(deps)` en test) :

| Opération              | Appelants                                    | Rôle                                            |
| ---------------------- | -------------------------------------------- | ----------------------------------------------- |
| `applyAction`          | `PATCH /api/coaching/sessions/[id]`          | confirm, decline, start, complete, cancel       |
| `recordPayment`        | `POST /api/coaching/stripe/verify`, webhook  | pending → paid (une seule notification au coach) |
| `recordExternalRefund` | webhook `charge.refunded`                    | paid / refund_pending → refunded                |

`isPayableSession` est réutilisé par `POST /api/coaching/stripe/checkout`.

## Machine à états

| Action   | Rôle          | Depuis                      | Vers          |
| -------- | ------------- | --------------------------- | ------------- |
| confirm  | coach         | requested                   | confirmed     |
| decline  | coach         | requested                   | cancelled     |
| start    | coach         | confirmed **et payée**      | in_progress   |
| complete | coach         | in_progress                 | completed     |
| cancel   | coach, élève  | requested, confirmed        | cancelled     |

Paiement : `pending → paid → (refund_pending →) refunded | released`.

- Annulation d'une session payée avec remboursement dû : un seul claim passe la session en
  `cancelled + refund_pending`, puis Stripe rembourse (clé `coaching-refund-<id>`), puis
  `refund_pending → refunded`. Si Stripe échoue, la session reste `refund_pending` ; le webhook
  `charge.refunded` la solde. La réponse PATCH contient `refund: "refunded" | "pending" | null`.
- Annulation sans remboursement dû (pas de politique, annulation tardive) : la session reste
  `cancelled + paid`.
- Paiement reçu sur une session déjà annulée : remboursement intégral automatique.
- Les montants viennent toujours de la session (prix) ou de Stripe (`amount_refunded`), jamais du
  client.

## Seams et adapters

| Port              | Production                 | Tests                           |
| ----------------- | -------------------------- | ------------------------------- |
| `SessionStore`    | `supabaseSessionStore.ts`  | in-memory (`src/test-helpers/coaching-lifecycle-fakes.ts`) |
| `PaymentGateway`  | `stripePaymentGateway.ts`  | fake idempotent                 |
| `LifecycleEffects`| `index.ts` (notifications, conversation) | enregistreur              |

Les écritures passent par le service role ; le trigger `enforce_coaching_session_write` reste une
défense pour les appels PostgREST directs (et exige aussi une session payée pour `start`).
Voir [ADR 0001](../../adr/0001-coaching-lifecycle-owns-session-writes.md).

## Prérequis

- Migrations `20261023000002_coaching_refund_pending.sql` et
  `20261023000003_purge_keeps_refund_pending_sessions.sql` appliquées.
- `STRIPE_WEBHOOK_SECRET` configuré, événements `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`, `charge.refunded`, `account.updated`.

## Utilisation

- Page `/coaching/sessions` : actions coach / élève, paiement, message de remboursement.
- Une session `refund_pending` bloque la suppression de compte comme une session `paid`, et la purge
  RGPD la conserve comme pièce comptable (migration `20261023000003`).
