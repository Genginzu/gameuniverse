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
                  │  Trigger AFTER INSERT OR UPDATE OF status
                  │  WHEN status='received'
                  │  → pg_net.http_post(...)
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
| Insertion + traitement        | Synchrone dans la même req. | Insert puis trigger DB      |
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

### Configuration du trigger Postgres

Pour que le trigger sache où invoquer l'Edge Function processor, deux
GUC parameters doivent être posés sur la base :

```sql
ALTER DATABASE postgres SET app.settings.processor_url
  = 'https://<project-ref>.supabase.co/functions/v1/igdb-processor';
ALTER DATABASE postgres SET app.settings.service_role_key
  = '<your-service-role-jwt>';
```

Si ces GUC ne sont pas configurés, le trigger logge un warning et laisse
passer l'INSERT (pas de blocage). Les events restent en `received` et
peuvent être traités manuellement via l'admin.

## Déploiement

```bash
# 1. Déployer les Edge Functions
supabase functions deploy igdb-webhook
supabase functions deploy igdb-processor

# 2. Définir les secrets
supabase secrets set IGDB_WEBHOOK_SECRET=... \
                     IGDB_CLIENT_ID=... \
                     IGDB_CLIENT_SECRET=...

# 3. Appliquer la migration qui pose le trigger
supabase db push

# 4. Configurer les GUC (via le SQL Editor ou psql)
# (voir bloc SQL ci-dessus)

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
- L'extension `pg_net` est bien activée
- Les GUC `app.settings.processor_url` et `app.settings.service_role_key`
  sont configurés sur la base
- L'Edge Function `igdb-processor` est déployée et accessible
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
