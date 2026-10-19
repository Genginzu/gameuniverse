# feat: Affiliation stores (monétisation via liens d'achat)

## Contexte

Objectif business : monétiser la section « Où acheter » des pages de jeu. Quand
un visiteur clique sur un bouton d'achat et achète, le magasin reverse une
commission (~3-5 %). Le joueur paie le même prix. Levier non intrusif, data déjà
présente → premier levier à activer.

## État actuel (vérifié dans le code)

- Table `stores` : `id, name, website_url, logo_url, is_active`. Aucun champ
  affiliation.
- Table `game_prices` :
  `game_id, store_id, price, currency, platform, store_url, is_available`. Le
  `store_url` est le deep-link produit brut.
- `store_url` est saisi **à la main** par un admin via `/api/admin/games/[id]`.
  Aucune récupération automatique de prix/liens aujourd'hui.
- `src/components/games/details/sections/PricingSection.tsx` affiche déjà les
  cartes « Where to buy » avec un CTA
  `<a href={storeUrl} target="_blank" rel="noopener noreferrer">`.
- Aucun tag d'affiliation, aucun tracking de clic. `rel` non conforme (manque
  `sponsored nofollow`).

## Objectif

Injecter automatiquement un code d'affilié (un par magasin) dans les liens
existants, tracer les clics, et rester conforme (disclosure + anti
open-redirect). Le mécanisme doit fonctionner « à vide » : rien de visible tant
qu'un magasin n'est pas activé.

## Prérequis externe (non technique)

- S'inscrire aux programmes d'affiliation. Gratuit, un code différent par
  magasin.
- Accessibles/rentables : Amazon Associates, Fanatical, Green Man Gaming, Humble
  (Impact/Partnerize), Epic (Support-A-Creator).
- Steam et PlayStation Store : **pas de programme public** → garder le lien
  simple, non monétisé.

## Décisions à trancher avant implémentation

1. Source des liens produits : manuel (déjà possible) vs automatique via API de
   prix (ex. IsThereAnyDeal qui renvoie deep-links + prix par magasin).
2. Tracking : endpoint redirect `/api/go` (mesure business, recommandé) vs
   simple lien taggé côté client.
3. Disclosure : simple ligne sous les prix vs page dédiée (à lier aux pages
   légales, encore manquantes).

## Périmètre technique

1. **Migration** `supabase/migrations/` :
   - Colonnes sur `stores` : `affiliate_enabled bool default false`,
     `affiliate_network text`, `affiliate_tag text`,
     `affiliate_url_template text` (placeholders `{url}` / `{tag}`).
   - Table `affiliate_clicks` :
     `id, game_id, store_id, player_id nullable, referrer, created_at`. RLS :
     insert service-role only, aucune lecture publique.
   - Secrets réseau (clés API) restent en env, jamais en DB.
2. **Builder pur** `src/lib/affiliate/buildAffiliateUrl.ts` :
   - `(storeConfig, rawUrl) => finalUrl`. Ajout de query param OU wrap via
     template réseau (deep-link encodé). Fallback = url brute si
     `affiliate_enabled = false`.
   - Entièrement testable unitairement.
3. **Endpoint redirect + tracking** `src/app/api/go/route.ts` :
   - Valide le domaine cible contre une allowlist (domaines
     `stores.website_url`) → anti open-redirect.
   - Log le clic dans `affiliate_clicks`, puis `302` vers l'URL affiliée.
4. **UI** `PricingSection.tsx` :
   - CTA vers `/api/go?...`, `rel="sponsored nofollow noopener noreferrer"`,
     `target="_blank"`.
   - Ligne de disclosure affiliation (obligatoire FTC/DGCCRF), i18n fr/en.
5. **Admin** :
   - Vérifier s'il existe une UI de gestion des `stores` (sinon passer par le
     form jeu).
   - Ajouter toggle affiliation + tag + template + validation Zod.
6. **Env** : `.env.example` + Vercel (ex. `AMAZON_ASSOCIATES_TAG`,
   `IMPACT_SITE_ID`, …).
7. **i18n** : clés disclosure + « buy » dans `src/messages/fr.json` et `en.json`
   (fr = référence).

## Critères d'acceptation

- [ ] Un magasin `affiliate_enabled = false` → lien inchangé (fallback), zéro
      régression.
- [ ] Un magasin activé → le code d'affilié est présent dans le lien final
      rendu.
- [ ] Clic sur un CTA → une ligne créée dans `affiliate_clicks` puis redirection
      vers le bon magasin.
- [ ] `/api/go` refuse toute cible hors allowlist (test open-redirect).
- [ ] CTA en `rel="sponsored nofollow noopener noreferrer"`.
- [ ] Disclosure affichée sous les prix, traduite fr + en.
- [ ] Tests unitaires builder (par réseau + fallback + garde open-redirect) et
      test de route `/api/go`.
- [ ] `bun run type-check`, `bun run lint`, tests ciblés au vert.

## Hors périmètre (itérations suivantes)

- Récupération automatique des prix/liens (IsThereAnyDeal, Amazon PA-API).
- Dashboard admin d'analytics des clics/commissions.
- Autres leviers business (tier premium, pubs display).

## Références code

- `src/components/games/details/sections/PricingSection.tsx`
- `src/types/pricing.ts`
- `src/lib/database.types.ts` (tables `stores`, `game_prices`)
- `src/app/api/admin/games/[id]/route.ts` (saisie actuelle des prix)
- `src/lib/services/priceHistoryService.ts`
