# Webhooks IGDB

Système de réception et traitement des webhooks IGDB pour maintenir les
données du site synchronisées avec la base IGDB.

## Architecture

L'ensemble du flux webhook est hébergé sur **Supabase Edge Functions** ;
Vercel ne reçoit plus aucun trafic webhook. Cela évite la consommation
massive de l'enveloppe Vercel par les ~7 000 events IGDB quotidiens.

```
                 IGDB
                  │
                  │  POST /functions/v1/igdb-webhook
                  │      ?entity=games|characters|popularity_primitives
                  │      &method=create|update|delete
                  │  Header: X-Secret: $IGDB_WEBHOOK_SECRET
                  ▼
       ┌─────────────────────┐
       │  Edge Function      │  Valide + insère (status='received')
       │  igdb-webhook       │  Répond 200 < 1s
       └──────────┬──────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │   Postgres table    │
       │ igdb_webhook_events │
       └──────────┬──────────┘
                  │  Database Webhook Supabase
                  │  (configuré dans le dashboard)
                  │  → INSERT/UPDATE déclenche
                  ▼
       ┌─────────────────────┐
       │  Edge Function      │  Router → handlers/
       │  igdb-processor     │   ├─ games-create.ts
       │                     │   ├─ games-update.ts
       │                     │   ├─ games-delete.ts
       │                     │   ├─ characters.ts
       │                     │   └─ popularity.ts
       └─────────────────────┘
```

L'admin Vercel garde uniquement :
- l'UI de consultation des events et registrations
- les routes API admin (listing, diff, apply manuel)
- la route registrations qui CRUD côté IGDB

L'**apply manuel** (depuis la page admin diff) délègue désormais à la
fonction `igdb-processor` avec `force=true` au lieu d'exécuter le
diff applier localement.

## Comportement par type d'événement

| Événement                      | Games                                        | Characters     | Popularity primitives |
| ------------------------------ | -------------------------------------------- | -------------- | --------------------- |
| `create`                       | Auto-import via GameImportService            | Log uniquement | Refresh popularity    |
| `update`                       | Diff applier (respect des overrides admin)   | Log uniquement | Refresh popularity    |
| `delete`                       | Cascade delete                               | Log uniquement | Refresh popularity    |

## Structure du code

### Côté Supabase (Deno)

```
supabase/functions/
├── _shared/                              # Code partagé Edge Functions
│   ├── logger.ts                         # JSON logger
│   ├── supabase-admin.ts                 # Client service-role
│   ├── untyped-table.ts                  # Helper table sans types générés
│   ├── igdb-types.ts                     # Types IGDB + constantes
│   ├── igdb-service.ts                   # Client API IGDB
│   ├── metacritic-service.ts             # Scraper Metacritic best-effort
│   ├── dlc-extension-utils.ts            # Helpers DLC/extensions
│   ├── webhook-diff-applier.ts           # Diff applier (respect overrides)
│   ├── game-import-service.ts            # Orchestrateur d'import
│   └── game-import/                      # Sous-modules d'import
│       ├── transform.ts
│       ├── entities.ts
│       ├── media.ts
│       ├── languages.ts
│       ├── age-ratings.ts
│       ├── extras.ts
│       ├── playtime.ts
│       └── popularity.ts
├── igdb-webhook/                         # Receiver
│   └── index.ts
└── igdb-processor/                       # Router + handlers
    ├── index.ts
    ├── lib/
    │   ├── event-status.ts
    │   └── resolve-entity.ts
    └── handlers/
        ├── games-create.ts
        ├── games-update.ts
        ├── games-delete.ts
        ├── characters.ts
        └── popularity.ts
```

### Côté Vercel (Next.js)

```
src/
├── app/api/admin/webhooks/
│   ├── events/route.ts                          # Listing
│   ├── events/[eventId]/diff/route.ts           # Diff vs DB
│   ├── events/[eventId]/apply/route.ts          # Délègue à igdb-processor
│   ├── events/link/route.ts                     # Link manuel event ↔ game
│   ├── events/not-imported-ids/route.ts
│   ├── registrations/route.ts                   # GET/POST IGDB webhooks
│   └── registrations/[id]/route.ts              # DELETE
├── app/api/webhooks/igdb/route.ts               # Kill switch 410 Gone
├── components/admin/webhooks/                   # UI admin
└── app/[locale]/admin/webhooks/page.tsx         # Page admin
```

⚠️ Les services Next.js `igdbService`, `gameImportService`,
`metacriticService`, `webhookDiffApplier` restent utilisés par d'autres
routes admin (global-sync, bulk-import, sync individuel d'un jeu, etc.) et
ne sont **pas** supprimés. Le code Edge Function est une copie portée
en Deno qui vit en parallèle.

## Différences entre la version Edge et la version Vercel

| Comportement                  | Vercel (avant)              | Edge Function (après)       |
| ----------------------------- | --------------------------- | --------------------------- |
| Réception webhook IGDB        | `/api/webhooks/igdb`        | `/functions/v1/igdb-webhook` |
| Insertion + traitement        | Synchrone dans la même req. | Insert puis Database Webhook|
| Couleurs des covers (Jimp)    | Extraites à l'import        | **Non** (best-effort skip)  |
| Retour `GameDetails` complet  | Oui (refetch via API)       | Non (juste {gameId, slug})  |
| Apply manuel admin            | Code local                  | Délègue à `igdb-processor`  |

Les couleurs (`background_color`, `accent_color`, `label_color`,
`text_color`) sont volontairement non extraites côté Edge Function pour
éviter de charger Jimp (lib lourde) à chaque cold start. Les jeux
auto-importés via webhook ont ces colonnes à `null` ; un admin peut les
regénérer plus tard via les outils de bulk-import côté Vercel.

## Configuration

### Variables d'environnement

#### Côté Vercel (Next.js)

```env
# IGDB API credentials (utilisés aussi par les autres routes admin)
IGDB_CLIENT_ID=...
IGDB_CLIENT_SECRET=...

# Secret partagé avec IGDB pour valider l'origine des webhooks
IGDB_WEBHOOK_SECRET=...

# Pour construire l'URL de l'Edge Function lors de l'enregistrement
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # utilisé par la route apply pour invoquer l'Edge Function
```

#### Côté Supabase Edge Functions

À configurer via le dashboard Supabase ou la CLI :

```bash
supabase secrets set IGDB_WEBHOOK_SECRET=...
supabase secrets set IGDB_CLIENT_ID=...
supabase secrets set IGDB_CLIENT_SECRET=...
# SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectées automatiquement
```

### Configuration du Database Webhook (déclenchement du processor)

Le déclenchement de `igdb-processor` à chaque INSERT/UPDATE dans
`igdb_webhook_events` se fait via les **Database Webhooks** intégrés à
Supabase, configurés depuis le dashboard.

> ℹ️ L'approche initiale était un trigger Postgres custom appelant
> `pg_net.http_post(...)` avec la service role key stockée dans des
> GUCs `app.settings.*`. Cette approche **ne fonctionne pas sur Supabase
> managed** car la commande `ALTER DATABASE postgres SET app.settings.*`
> requiert des droits superuser que Supabase n'expose pas (erreur
> `42501: permission denied`). Les Database Webhooks UI résolvent cela
> en utilisant le service role en interne.

**Procédure** (à faire **après** le déploiement des Edge Functions, sinon
`igdb-processor` n'apparaîtra pas dans la liste de fonctions) :

1. Dashboard Supabase → **Database** → **Webhooks** → **Create a new hook**
2. Remplir :
   - **Name** : `igdb_webhook_event_to_processor`
   - **Table** : `public.igdb_webhook_events`
   - **Events** : ☑ Insert ☑ Update
   - **Type** : *Supabase Edge Functions*
   - **Edge Function** : `igdb-processor`
   - **HTTP Method** : POST
   - **HTTP Headers** : `Content-Type: application/json`
3. Sauvegarder.

Le webhook s'exécute sur **tous** les inserts/updates de la table.
Le filtrage `status='received'` est fait dans le code du processor :
si l'event a déjà été processé ou est en `failed`, le router le détecte
et ne fait rien.

Le body envoyé par le Database Webhook Supabase a la forme :

```json
{
  "type": "INSERT",
  "table": "igdb_webhook_events",
  "record": { "id": "...", "status": "received", ... },
  "schema": "public",
  "old_record": null
}
```

Le router `igdb-processor/index.ts` lit `body.record.id` (en plus de
`body.eventId` envoyé par la route admin Vercel pour l'apply manuel).

## Déploiement

```bash
# 1. Déployer les Edge Functions
supabase functions deploy igdb-webhook
supabase functions deploy igdb-processor

# 2. Définir les secrets
supabase secrets set IGDB_WEBHOOK_SECRET=... \
                     IGDB_CLIENT_ID=... \
                     IGDB_CLIENT_SECRET=...

# 3. Appliquer les migrations (cleanup d'éventuels triggers legacy)
supabase db push

# 4. Configurer le Database Webhook via l'UI (cf. ci-dessus)

# 5. Re-créer les registrations IGDB côté Vercel
#    Admin > IGDB > Webhooks > Gestion :
#    - Supprimer les anciens webhooks (ils pointent vers Vercel)
#    - Créer les nouveaux (ils pointeront vers l'Edge Function)
```

## Endpoint de réception (rappel)

```
POST https://<project-ref>.supabase.co/functions/v1/igdb-webhook
  ?entity={games|characters|popularity_primitives}
  &method={create|update|delete}

Headers:
  X-Secret: <IGDB_WEBHOOK_SECRET>

Body: JSON de l'entité IGDB (non expandée)
```

- Doit répondre 200 en < 15 secondes
- Après 5 échecs consécutifs, IGDB désactive le webhook

## Table `igdb_webhook_events`

Inchangée par rapport à l'ancienne architecture :

| Colonne       | Type        | Description                                                |
| ------------- | ----------- | ---------------------------------------------------------- |
| id            | uuid PK     | Identifiant unique                                         |
| event_type    | text        | `create`, `update`, `delete`                               |
| entity_type   | text        | `games`, `characters`, `popularity_primitives`             |
| igdb_id       | bigint      | ID IGDB de l'entité                                        |
| game_id       | uuid FK     | Lien vers `games` si applicable                            |
| character_id  | uuid FK     | Lien vers `characters` si applicable                       |
| payload       | jsonb       | Body brut reçu d'IGDB                                      |
| status        | text        | `received`, `processing`, `processed`, `failed`, `ignored` |
| error_message | text        | Détails en cas d'échec                                     |
| processed_at  | timestamptz | Date de traitement                                         |
| created_at    | timestamptz | Date de réception                                          |

## Interface admin

Accessible via **Admin > IGDB > Webhooks**, inchangée par rapport à
l'ancienne architecture. Trois onglets :

1. **Événements Jeux** — historique filtrable des events sur les jeux
2. **Événements Personnages** — idem pour les personnages
3. **Gestion des webhooks** — enregistrer/supprimer des webhooks auprès
   d'IGDB ; les nouvelles registrations pointent automatiquement vers
   l'Edge Function

Les événements se rafraîchissent toutes les 30 secondes (SWR).

## Dépannage

### Aucun event ne se traite (status reste à `received`)

Vérifier que :
- Le Database Webhook est bien configuré dans **Database → Webhooks**
- L'Edge Function `igdb-processor` est déployée et accessible
- Les logs du Database Webhook (Database → Webhooks → cliquer sur le hook)
- Les logs de l'Edge Function dans le dashboard Supabase

### IGDB renvoie 401 lors de l'enregistrement d'un webhook

Vérifier `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` côté Vercel et que le
token Twitch n'est pas en cache stale (la route `POST registrations`
appelle `IGDBService.clearTokenCache()` avant l'enregistrement).

### Un event reste en `failed`

Consulter le `error_message` dans la table. Causes fréquentes :
- IGDB renvoie un payload incomplet (sub-entity non expandée) → réessayer
- Conflit FK (genre/company/platform supprimés en local) → corriger en DB
- L'admin peut relancer via la page diff (force=true)

### Erreur `42501: permission denied to set parameter "app.settings.*"`

C'est l'erreur qui a fait basculer du trigger Postgres custom vers les
Database Webhooks UI. Si tu rencontres cette erreur, c'est que tu
essaies d'appliquer une vieille version de la migration
`20260508000002_igdb_webhook_processor_trigger.sql`. La version
actuelle de cette migration est un simple cleanup (DROP IF EXISTS) qui
n'a pas besoin de droits superuser.
