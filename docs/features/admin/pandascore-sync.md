# Synchronisation PandaScore

Système de synchronisation des données esport (équipes, joueurs, tournois,
matchs) depuis l'API PandaScore. Toute la logique de sync est hébergée sur
**Supabase Edge Functions** ; Vercel ne fait que déclencher et afficher.

## Architecture

```
                pg_cron */5 * * * *
                       │
                       ▼
         ┌──────────────────────────────┐
         │ pandascore-incremental       │  Edge Function
         │  - lock applicatif           │
         │  - fetch /additions /changes │
         │    /deletions  since=cursor  │
         │  - upsert dans esport_*      │
         │  - écrit sync_logs + cursor  │
         └──────────────────────────────┘
                       ▲
                       │  POST manuel
   ┌───────────────────┼─────────────────────┐
   │ Admin "Sync incrémentale"               │
   │ → /api/admin/esport/incremental-sync    │  Vercel
   │ → proxy vers la même Edge Function      │
   └─────────────────────────────────────────┘

   ┌─────────────────────────────────────────┐
   │ Admin "Sync globale"                    │  Vercel
   │ → /api/admin/esport/full-sync           │
   │ → INSERT pandascore_sync_jobs (pending) │
   └─────────────────────┬───────────────────┘
                         │
                         ▼ Database Webhook
         ┌──────────────────────────────┐
         │ pandascore-full-sync         │  Edge Function
         │  - claim job (status=running)│
         │  - boucle ≤350s :            │
         │     fetch 1 page de l'entité │
         │     upsert + advance cursor  │
         │  - si pas done :             │
         │     status=pending +         │
         │     self-reschedule (HTTP)   │
         │  - si done : status=completed│
         └──────────────────────────────┘
```

L'admin Vercel garde uniquement :
- l'UI admin esport sync
- les routes minces qui déclenchent / consultent
- les callbacks internes appelés depuis les Edge Functions

## Fonctionnalités

| Action                    | Déclencheur                       | Mécanisme                                    |
| ------------------------- | --------------------------------- | -------------------------------------------- |
| Sync incrémentale auto    | pg_cron toutes les 5 minutes      | `pandascore-incremental` Edge Function       |
| Sync incrémentale manuel  | Bouton admin "Sync incrémentale"  | Proxy Vercel → même Edge Function            |
| Sync globale manuel       | Bouton admin "Sync complète"      | Job en queue + Edge Function chunked         |

### Sync incrémentale

Lit `pandascore_sync_state.last_incremental_at` (cursor) et appelle l'API
PandaScore Incidents (`/additions`, `/changes`, `/deletions`) avec
`since=<cursor>`. Sur une fenêtre de 5 minutes, le delta est typiquement de
quelques dizaines d'incidents. Le cursor est avancé à `now()` uniquement en
cas de succès complet.

Un verrou applicatif (`pandascore_sync_state.incremental_running_since`)
empêche le cron et le bouton manuel de tourner simultanément. Le verrou
est auto-libéré après 6 minutes (au cas où une invocation crashée).

### Sync globale (chunked)

Pour rapatrier ou réparer la totalité des entités (~100k matchs), une
sync ne peut pas tenir dans une seule invocation Edge Function (limite
400s). Le flow utilise un **job persistant** :

1. L'admin clique "Sync complète" → insertion dans `pandascore_sync_jobs`
   avec `status='pending'`, `cursor={}`.
2. Un Database Webhook UI sur la table déclenche la fonction
   `pandascore-full-sync`.
3. La fonction claim atomiquement le job (transition `pending` → `running`),
   puis boucle pendant ≤350s :
   - fetch 1 page de l'entité courante (teams → tournaments → players → matches)
   - bulk-upsert
   - avance le cursor (`page+1` ou `done=true` si page partielle)
4. À l'expiration du budget, persiste le cursor, repasse en `pending`,
   et re-déclenche la fonction par un POST HTTP interne (self-reschedule
   immédiat plutôt que d'attendre le webhook UI).
5. Quand toutes les entités ont `done=true`, le job passe `completed`.

L'UI admin poll `/api/admin/esport/sync-jobs` toutes les 5s pour afficher
la progression.

## Configuration

### Variables d'environnement Vercel

```env
# Lecture/écriture des tables esport via Edge Function
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Secret partagé pour les callbacks Edge → Vercel
# (reconcile-history, resolve-predictions)
EDGE_CALLBACK_SECRET=<secret-fort-32+ chars>
```

### Secrets Supabase Edge Functions

```bash
supabase secrets set PANDASCORE_API_KEY=...
supabase secrets set VERCEL_CALLBACK_BASE_URL=https://<domain>.com
supabase secrets set VERCEL_CALLBACK_SECRET=<même valeur que EDGE_CALLBACK_SECRET côté Vercel>
# SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont auto-injectés
```

### pg_cron

Configurer la planification toutes les 5 minutes via le Dashboard Supabase
(**Database → Cron**, ou directement via SQL Editor) :

```sql
SELECT cron.schedule(
  'pandascore-incremental-5min',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/pandascore-incremental',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
```

> ℹ️ `current_setting('app.settings.service_role_key')` n'est pas exposé sur
> Supabase managed. Préférer la création via le Dashboard UI qui injecte la
> service-role en interne.

### Database Webhook UI (déclencheur du full-sync)

À configurer **après** le déploiement de la fonction `pandascore-full-sync`,
même procédure que pour `igdb-processor` :

1. Dashboard Supabase → **Database** → **Webhooks** → **Create a new hook**
2. Nom : `pandascore_sync_jobs_to_full_sync`
3. Table : `public.pandascore_sync_jobs`
4. Events : ☑ Insert ☑ Update
5. Type : Supabase Edge Functions
6. Edge Function : `pandascore-full-sync`
7. Method : POST, headers : `Content-Type: application/json`

Le router de la fonction filtre côté code : si le job n'est pas `pending`,
il retourne immédiatement.

## Structure du code

### Côté Supabase (Deno)

```
supabase/functions/
├── _shared/
│   └── pandascore/
│       ├── types.ts                # PandaScore* types port
│       ├── client.ts               # HTTP client + retry + timeout
│       ├── helpers.ts              # bulkUpsert, preloadIdMap, errorCollector
│       ├── mappers.ts              # PandaScore object → Supabase row
│       └── vercel-callbacks.ts     # reconcile-history + resolve-predictions
│
├── pandascore-incremental/
│   ├── index.ts                    # entry point + orchestration
│   ├── lib/
│   │   ├── lock.ts                 # acquire/release sur sync_state
│   │   └── log-entry.ts            # CRUD pandascore_sync_logs
│   └── handlers/
│       └── sync-by-ids.ts          # 1 fonction par type d'entité
│
└── pandascore-full-sync/
    ├── index.ts                    # claim + chunked loop + reschedule
    ├── lib/
    │   ├── job-cursor.ts           # claim, persist, mark-completed
    │   └── reschedule.ts           # self-rescheduling HTTP
    └── handlers/
        └── process-page.ts         # fetch 1 page + upsert
```

### Côté Vercel (Next.js)

```
src/
├── app/api/
│   ├── admin/esport/
│   │   ├── incremental-sync/route.ts    # POST proxy Edge
│   │   ├── full-sync/route.ts           # POST insère job
│   │   ├── sync-jobs/route.ts           # GET liste jobs
│   │   ├── sync-logs/route.ts           # GET historique (déjà existant)
│   │   ├── import/route.ts              # 410 Gone (kill switch)
│   │   └── sync/route.ts                # 410 Gone (kill switch)
│   ├── cron/
│   │   └── esport-sync/route.ts         # 410 Gone (kill switch)
│   └── internal/esport/
│       ├── reconcile-history/route.ts   # callback Edge
│       └── resolve-predictions/route.ts # callback Edge
│
├── components/admin/esport/
│   └── SyncJobCard.tsx                  # carte progression job
│
└── app/[locale]/admin/esport/sync/
    └── page.tsx                         # UI admin (polling SWR)
```

## Tables Supabase

### pandascore_sync_state (singleton)

| Colonne                     | Type        | Description                              |
| --------------------------- | ----------- | ---------------------------------------- |
| id                          | int (=1)    | Clé primaire fixe                        |
| last_incremental_at         | timestamptz | Cursor `since` pour Incidents API        |
| incremental_running_since   | timestamptz | Verrou (NULL = libre, sinon date d'acquisition) |
| updated_at                  | timestamptz | Pour audit                               |

### pandascore_sync_jobs (queue)

| Colonne         | Type         | Description                                    |
| --------------- | ------------ | ---------------------------------------------- |
| id              | uuid         | PK                                             |
| kind            | text         | `full` ou `entity`                             |
| entity          | text \| null | Si kind=entity : `teams|players|tournaments|matches` |
| game            | text \| null | Filtre videogame_title optionnel               |
| status          | text         | `pending|running|completed|failed|cancelled`   |
| cursor          | jsonb        | `{ teams: { page, done }, ... }`               |
| total_synced    | int          | Cumul sur tous les chunks                      |
| total_errors    | int          | Cumul sur tous les chunks                      |
| error_details   | jsonb        | Liste des erreurs par item (cap 50)            |
| started_at      | timestamptz  | Quand le 1er chunk a démarré                   |
| completed_at    | timestamptz  | Quand le dernier chunk a terminé               |
| last_chunk_at   | timestamptz  | Détection des jobs zombies                     |
| created_at      | timestamptz  | À l'insertion                                  |

### pandascore_sync_logs (audit)

Inchangée. Une ligne par run incrémental ; les full-syncs sont tracés
uniquement dans `pandascore_sync_jobs`.

## Interface admin

Accessible via **Admin → Esport → Sync**. La page propose :

1. **Bouton "Sync incrémentale"** : déclenche un run immédiat (proxy vers
   l'Edge Function). Si le verrou est tenu (cron en cours ou clic récent),
   l'Edge Function répond `{ skipped: true }`.
2. **Bouton "Sync complète"** : insère un job. Refuse (409) s'il existe déjà
   un job non terminé.
3. **Carte de progression** : visible quand un job est `pending` ou `running`.
   Affiche pour chaque entité son cursor (page courante ou ✓ si done) +
   les compteurs cumulés. Rafraîchie toutes les 5 secondes.
4. **Historique des syncs** : table des derniers `pandascore_sync_logs`,
   avec dialog pour les erreurs détaillées.

## Dépannage

### Le cron ne tourne pas

- Vérifier dans le Dashboard Supabase → **Database → Cron** que le job
  `pandascore-incremental-5min` est bien actif.
- Logs : `Database → Cron → cliquer sur le job → Run history`.
- Logs Edge Function : `Functions → pandascore-incremental → Logs`.

### Un job full-sync est bloqué

- Si `status='running'` et `last_chunk_at` ancien (> 10 min), c'est un
  zombie (probablement un crash de chunk). Repasser manuellement à
  `pending` via le SQL Editor ou ajouter un cron de housekeeping :
  ```sql
  UPDATE pandascore_sync_jobs
  SET status = 'pending'
  WHERE status = 'running'
    AND last_chunk_at < now() - interval '10 minutes';
  ```

### Les callbacks Edge → Vercel échouent

- Vérifier que `EDGE_CALLBACK_SECRET` (Vercel) === `VERCEL_CALLBACK_SECRET`
  (Supabase secrets).
- Vérifier que `VERCEL_CALLBACK_BASE_URL` pointe bien sur l'URL prod accessible
  depuis l'extérieur.
- Les callbacks sont best-effort : un échec ne fait pas échouer la sync,
  mais les `esport_player_team_history` ou `esport_predictions` peuvent ne
  pas être à jour. Le prochain cron rattrapera.

### Sync incrémentale toujours `skipped: lock held`

Le verrou peut rester acquis si une invocation crash sans le release. Il
est auto-libéré après 6 minutes. Si le problème persiste : `UPDATE
pandascore_sync_state SET incremental_running_since = NULL WHERE id = 1;`
