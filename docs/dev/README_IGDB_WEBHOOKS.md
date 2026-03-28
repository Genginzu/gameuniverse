# Webhooks IGDB

Système de réception et traitement des webhooks IGDB pour maintenir les données
du site synchronisées avec la base IGDB.

## Principe

IGDB envoie un POST à notre endpoint quand une entité est créée, modifiée ou
supprimée. Chaque événement est loggé dans `igdb_webhook_events` et traité selon
son type.

## Comportement par type d'événement

| Événement | Games                             | Characters     |
| --------- | --------------------------------- | -------------- |
| `create`  | Auto-import via GameImportService | Log uniquement |
| `update`  | Log pour traitement manuel        | Log uniquement |
| `delete`  | Log uniquement                    | Log uniquement |

## Architecture

```
src/
├── app/api/webhooks/igdb/route.ts              # Endpoint de réception
├── app/api/admin/webhooks/
│   ├── events/route.ts                         # API listing événements
│   └── registrations/
│       ├── route.ts                            # GET/POST webhooks IGDB
│       └── [id]/route.ts                       # DELETE webhook IGDB
├── lib/
│   ├── supabase-admin.ts                       # Client service role
│   └── services/igdbWebhookService.ts          # Logique de traitement
├── hooks/
│   ├── useWebhookEvents.ts                     # SWR hook événements
│   └── useWebhookRegistrations.ts              # SWR hook registrations
├── components/admin/webhooks/
│   ├── WebhookGameEvents.tsx                   # Onglet événements jeux
│   ├── WebhookCharacterEvents.tsx              # Onglet événements personnages
│   ├── WebhookRegistrations.tsx                # Gestion des webhooks
│   ├── WebhookEventList.tsx                    # Table d'événements
│   ├── WebhookEventFilters.tsx                 # Filtres
│   └── WebhookPagination.tsx                   # Pagination
├── types/webhooks.ts                           # Types partagés
└── app/[locale]/admin/webhooks/page.tsx         # Page admin
```

## Configuration

### Variables d'environnement

```env
IGDB_WEBHOOK_SECRET=un_secret_robuste_de_votre_choix
```

À ajouter dans `.env.local`. Déjà présent dans `.env.example`.

Les variables `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET` existantes sont
réutilisées pour l'authentification auprès de l'API IGDB.

### Migration

```bash
# Appliquer la migration
supabase db push
```

Migration : `supabase/migrations/20240327000001_igdb_webhook_events.sql`

## Endpoint de réception

```
POST /api/webhooks/igdb?entity={games|characters}&method={create|update|delete}
```

- Header `X-Secret` validé contre `IGDB_WEBHOOK_SECRET`
- Body : JSON de l'entité IGDB (non expandée)
- Doit répondre 200 en < 15 secondes
- Après 5 échecs consécutifs, IGDB désactive le webhook

## Enregistrement des webhooks

Depuis l'interface admin : **Admin > IGDB > Webhooks > onglet "Gestion"**.

Ou via l'API :

```bash
# Enregistrer un webhook
curl -X POST /api/admin/webhooks/registrations \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "games", "method": "update"}'

# Lister les webhooks actifs
curl /api/admin/webhooks/registrations

# Supprimer un webhook
curl -X DELETE /api/admin/webhooks/registrations/{id}
```

L'URL envoyée à IGDB est construite automatiquement :
`{NEXT_PUBLIC_BASE_URL}/api/webhooks/igdb?entity={endpoint}&method={method}`

**Important** : IGDB rejette les URLs `localhost` avec un 403. Pour tester en
local, utiliser un tunnel (ngrok, cloudflared) et mettre l'URL publique dans
`NEXT_PUBLIC_BASE_URL`.

## Table `igdb_webhook_events`

| Colonne       | Type        | Description                                                |
| ------------- | ----------- | ---------------------------------------------------------- |
| id            | uuid PK     | Identifiant unique                                         |
| event_type    | text        | `create`, `update`, `delete`                               |
| entity_type   | text        | `games`, `characters`                                      |
| igdb_id       | bigint      | ID IGDB de l'entité                                        |
| game_id       | uuid FK     | Lien vers `games` si applicable                            |
| character_id  | uuid FK     | Lien vers `characters` si applicable                       |
| payload       | jsonb       | Body brut reçu d'IGDB                                      |
| status        | text        | `received`, `processing`, `processed`, `failed`, `ignored` |
| error_message | text        | Détails en cas d'échec                                     |
| processed_at  | timestamptz | Date de traitement                                         |
| created_at    | timestamptz | Date de réception                                          |

## Interface admin

Accessible via **Admin > IGDB > Webhooks**. Trois onglets :

1. **Événements Jeux** — historique filtrable des événements sur les jeux, avec
   lien direct vers la fiche admin du jeu
2. **Événements Personnages** — idem pour les personnages
3. **Gestion des webhooks** — enregistrer/supprimer des webhooks auprès d'IGDB,
   voir leur statut (actif/inactif)

Les événements se rafraîchissent automatiquement toutes les 30 secondes.
