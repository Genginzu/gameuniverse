# Checklist de déploiement — Gamers Universe

Production : **https://www.gamersuniverse.fr** (projet Vercel
`darkennights-projects/gamersuniverse`, Supabase `vilgzbeifmimflyttwhr`, Londres).

## Comment la prod est déployée

- Le push sur `main` ne déploie **pas** (`vercel.json` → `deploymentEnabled.main: false`).
- release-please maintient une PR de release ; son merge crée le tag et le job
  `Deploy to Vercel (production)` de `.github/workflows/release-please.yml`
  exécute `vercel deploy --prod` (secrets GitHub `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
  `VERCEL_PROJECT_ID`).
- Rollback : `vercel rollback` ou « Promote » d'un déploiement précédent.
- Les variables `NEXT_PUBLIC_*` sont figées au build : redéployer après les avoir
  modifiées.

## 1. Variables Vercel (environnement Production)

Vérifier avec `vercel env ls --environment production`.

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase | oui |
| `NEXT_PUBLIC_SITE_URL` | Redirections e-mail d'auth, SEO (metadataBase, sitemap, robots) | oui |
| `NEXT_PUBLIC_BASE_URL` | Fetch ISR serveur des routes `/api/*` | oui |
| `NEXT_PUBLIC_APP_URL` | URLs de retour Stripe Checkout / Connect | oui |
| `CRON_SECRET` | `/api/cron/*`, `/api/internal/library-sync` | oui |
| `EDGE_CALLBACK_SECRET` | Callbacks Edge → Vercel (`/api/internal/esport/*`) | oui |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, `IGDB_WEBHOOK_SECRET` | IGDB | oui |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | E-mails (domaine `gamersuniverse.fr` vérifié sur Resend) | oui |
| `PLATFORM_TOKEN_ENCRYPTION_KEY` | Chiffrement des tokens de plateformes liées | oui |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiements coaching — clés **live** | si coaching payant |
| `AI_GATEWAY_API_KEY` | Traduction automatique | oui |
| `PANDASCORE_API_KEY` | Esport | oui |
| `STEAM_API_KEY`, `EPIC_*`, `XBOX_*`, `DISCORD_*`, `BATTLENET_*`, `ITCH_CLIENT_ID` | Plateformes liées | par plateforme |
| `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX` | Recherche d'images (admin) | optionnel |
| `RIOT_API_KEY`, `FACEIT_API_KEY`, `BLIZZARD_ACCESS_TOKEN` | Stats esport joueurs | optionnel |

## 2. Supabase

- Migrations : `bunx supabase migration list --linked` → aucune ligne sans
  correspondance « Remote ». Appliquer avec `bun run supabase:migrate`.
- Secrets Edge Functions (`bunx supabase secrets list`) : `IGDB_CLIENT_ID`,
  `IGDB_CLIENT_SECRET`, `IGDB_WEBHOOK_SECRET`, `PANDASCORE_API_KEY`,
  `VERCEL_CALLBACK_BASE_URL=https://www.gamersuniverse.fr`,
  `VERCEL_CALLBACK_SECRET` (= `EDGE_CALLBACK_SECRET` Vercel).
- Edge Functions : `bunx supabase functions deploy` (igdb-processor,
  igdb-webhook, pandascore-full-sync, pandascore-incremental).
- Extensions `pg_cron` et `pg_net` activées, crons planifiés (voir
  `docs/features/admin/pandascore-sync.md`, `docs/igdb/webhooks.md`).
- Auth → URL Configuration : Site URL `https://www.gamersuniverse.fr`, Redirect
  URLs `https://www.gamersuniverse.fr/**` et `https://gamersuniverse.fr/**`.

## 3. Services tiers

- Stripe (live) : webhook vers `https://www.gamersuniverse.fr/api/webhooks/stripe`,
  son secret dans `STRIPE_WEBHOOK_SECRET`.
- IGDB : webhooks enregistrés vers l'Edge Function `igdb-webhook` (admin →
  Webhooks).
- OAuth plateformes : URLs de callback `https://www.gamersuniverse.fr/api/auth/<provider>/callback`.
- Resend : domaine `gamersuniverse.fr` au statut *verified* (DNS gérés par Vercel).

## 4. Validation avant release

```bash
bun run lint
bunx vitest run src/<domaines-modifiés>/
bun run type-check
bun run build
```

## 5. Vérifications post-déploiement

- [ ] `curl -sI https://www.gamersuniverse.fr/api/auth/callback` → `Location` sur le domaine prod (pas localhost)
- [ ] `https://www.gamersuniverse.fr/sitemap.xml` et `robots.txt` pointent sur le domaine prod
- [ ] Inscription + e-mail de confirmation reçu, lien fonctionnel
- [ ] Pages `/fr/games`, `/fr/characters`, home : contenu rendu côté serveur
- [ ] `/api/cron/sync-libraries` sans secret → 401
- [ ] Pas d'erreur dans les logs Vercel / Sentry
- [ ] Pages légales sans `[À COMPLÉTER]`
