# Favoris de personnages

## Description

Système de favoris de personnages permettant aux joueurs authentifiés de marquer
des personnages comme favoris. Chaque personnage affiche un compteur de favoris
visible par tous. Les favoris d'un joueur sont consultables sur son profil
public.

### Fonctionnalités

- Bouton cœur sur la fiche personnage pour ajouter/retirer un favori
- Compteur de favoris avec mise à jour optimiste
- Page « Mes personnages favoris » listant les favoris triés par date d'ajout
- Section favoris sur le profil public d'un joueur
- État vide avec lien vers la page des personnages

## Accès

### Joueur

- Fiche personnage : `/{locale}/characters/{slug}` — bouton cœur + compteur
- Page favoris : `/{locale}/favorites/characters` — liste des favoris (auth
  requise)
- Profil joueur : `/{locale}/players/{id}` — section favoris publique

### API

- `POST /api/characters/[slug]/favorite` — Ajouter aux favoris (auth requise)
- `DELETE /api/characters/[slug]/favorite` — Retirer des favoris (auth requise)
- `GET /api/characters/[slug]/favorite` — Statut du favori pour l'utilisateur
  courant (auth requise)
- `GET /api/characters/[slug]/favorite/count` — Compteur public de favoris
- `GET /api/favorites/characters` — Liste des favoris de l'utilisateur courant
  (auth requise)
- `GET /api/players/[id]/favorite-characters` — Favoris publics d'un joueur

## Prérequis

- Migration Supabase appliquée :
  - `20240220000001_character_favorites.sql` — Table `character_favorites`,
    index, politiques RLS, fonctions SQL
- Utilisateur authentifié pour ajouter/retirer des favoris et accéder à la page
  favoris
- La lecture des favoris (compteur, profil joueur) est publique

## Utilisation

### Ajouter un personnage aux favoris

1. Se connecter
2. Ouvrir la page d'un personnage
3. Cliquer sur le bouton cœur — le compteur s'incrémente immédiatement

### Retirer un personnage des favoris

Cliquer à nouveau sur le bouton cœur — le compteur se décrémente immédiatement.

### Consulter ses favoris

Accéder à `/{locale}/favorites/characters` pour voir la liste de ses personnages
favoris triés par date d'ajout décroissante.

### Voir les favoris d'un joueur

Sur le profil d'un joueur (`/{locale}/players/{id}`), une section affiche ses
personnages favoris avec un lien « Voir tous » si la liste est longue.
