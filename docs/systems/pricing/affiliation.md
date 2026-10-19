# Affiliation stores (#342)

## Description

Monétisation de la section « Où acheter » des pages jeu. Chaque magasin peut
porter un code d'affilié injecté automatiquement dans ses liens produit. Les
clics sur les liens affiliés passent par `/api/go`, sont tracés dans
`affiliate_clicks`, puis redirigés (302) vers le magasin.

Fonctionnement « à vide » : un magasin `affiliate_enabled = false` garde son
lien brut, sans redirection ni disclosure.

## Accès

- Admin : `/admin/stores` (menu Jeux → « Magasins & affiliation »).
- Redirect : `GET /api/go?price=<game_prices.id>` (seul paramètre accepté).
- Disclosure : sous la grille des prix si au moins une offre est affiliée, lien
  vers `/mentions-legales#affiliation`.

## Prérequis

- Migration `supabase/migrations/20261018000001_store_affiliation.sql`.
- `stores.website_url` renseigné : il sert d'allowlist anti open-redirect.
- Inscription aux programmes (Amazon Associates, Fanatical, Green Man Gaming,
  Humble, Epic…). Steam et PlayStation Store n'ont pas de programme public →
  laisser désactivé.
- Variables d'env (fallback quand le code d'affilié du magasin est vide) :
  `AMAZON_ASSOCIATES_TAG`, `IMPACT_SITE_ID`, `PARTNERIZE_CAMREF`,
  `AWIN_PUBLISHER_ID`, `CJ_PUBLISHER_ID`. À ajouter aussi dans Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` : `affiliate_clicks` est en RLS sans policy
  (service role only).

## Utilisation

1. Ouvrir `/admin/stores`, cliquer « Configurer » sur un magasin.
2. Activer l'affiliation, choisir le réseau, saisir le code d'affilié (ou
   laisser vide → env).
3. Modèle d'URL :
   - Mode query : `?tag={tag}` (+ paramètres statiques, ex.
     `?ref={tag}&utm_source=gu`). Défaut Amazon : `?tag={tag}`.
   - Mode wrap : `https://reseau.example/c/{tag}?u={url}` — `{url}` = lien
     produit encodé. Doit être en `https://`.
4. Toute config incomplète ou invalide → fallback lien brut (jamais de lien
   cassé).

## Architecture

| Fichier                                        | Rôle                                        |
| ---------------------------------------------- | ------------------------------------------- |
| `src/lib/affiliate/buildAffiliateUrl.ts`       | Builder pur `(config, rawUrl) => finalUrl`  |
| `src/lib/affiliate/isAllowedStoreTarget.ts`    | Allowlist hôtes stores (anti open-redirect) |
| `src/lib/affiliate/getPricingCtaLink.ts`       | `href` + `rel` du CTA côté UI               |
| `src/lib/services/affiliateRedirectService.ts` | Résolution prix → URL + log du clic         |
| `src/app/api/go/route.ts`                      | Endpoint redirect 302 (`no-store`, noindex) |
| `src/app/api/admin/stores/**`                  | GET liste / PUT config affiliation          |
| `src/lib/validations/admin-store-affiliate.ts` | Schéma Zod admin                            |

Sécurité :

- `/api/go` ne prend jamais d'URL en paramètre : uniquement un id de prix.
- L'URL cible (`game_prices.store_url`) doit appartenir à l'hôte (ou
  sous-domaine) d'un magasin actif. Sinon `403`, aucun clic loggé.
- CTA affiliés : `rel="sponsored nofollow noopener noreferrer"`,
  `target="_blank"`.

## Hors périmètre

- Récupération automatique des prix/liens (IsThereAnyDeal, Amazon PA-API).
- Dashboard analytics des clics/commissions.
