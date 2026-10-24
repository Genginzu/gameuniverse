# Vitrine de l'accueil (admin)

## Description

Choix des jeux et personnages affichés dans les aperçus du landing visiteurs
(issue #19) :

- **Jeux de la ludothèque** (bloc « Bibliothèque ») : 3 jeux maximum, chacun
  avec le statut affiché sur la carte (en cours, terminé, liste de souhaits,
  possédé).
- **Personnages mis en avant** (bloc « Personnages ») : 4 personnages maximum.

Sans sélection, le landing utilise les jeux tendances (ou les sorties du mois)
et les personnages les plus vus.

## Accès

- Page : `/admin/home-showcase` (menu admin › Outils › Vitrine de l'accueil).
- API : `GET|POST|PUT /api/admin/home-showcase`,
  `PATCH|DELETE /api/admin/home-showcase/[id]`.

## Prérequis

- Rôle `admin` (`app_metadata.role`), vérifié par `defineRoute({ auth: "admin" })`.
- Migration `20261021000001_home_showcase_items.sql` appliquée.

## Utilisation

- Rechercher un jeu ou un personnage (2 caractères min.) puis cliquer pour
  l'ajouter.
- Réordonner avec les flèches, retirer avec la corbeille.
- Pour un jeu, choisir le statut affiché sur la carte.
- Les changements apparaissent sur l'accueil sous 5 minutes (ISR).

## Données

- Table `public.home_showcase_items` (`kind`, `game_id` / `character_id`,
  `library_status`, `display_order`). Lecture publique (RLS + `GRANT SELECT`),
  écriture uniquement via le service role dans l'API admin.
- Lecture publique : `src/lib/services/homeShowcaseQueries.ts` (payload
  `showcaseGames` / `showcaseCharacters` de `GET /api/home`).
- Gestion : `src/lib/services/homeShowcaseAdminService.ts`.
