# Document des Exigences

## Introduction

Cette fonctionnalité ajoute la comparaison de bibliothèques de jeux entre
joueurs sur la plateforme Game Universe. Un utilisateur connecté peut consulter
le profil d'un autre joueur et voir combien de jeux ils ont en commun, ainsi que
la liste détaillée de ces jeux partagés. Cela renforce l'aspect social de la
plateforme en permettant aux joueurs de découvrir des affinités ludiques.

## Glossaire

- **Système_Comparaison** : Module gérant le calcul et l'affichage de la
  comparaison entre deux bibliothèques de joueurs
- **Bibliothèque_Joueur** : Collection de jeux associés à un joueur (table
  `user_library`)
- **Jeux_En_Commun** : Ensemble des jeux présents dans les bibliothèques des
  deux joueurs comparés
- **Joueur_Courant** : Utilisateur authentifié qui consulte le profil d'un autre
  joueur
- **Joueur_Cible** : Joueur dont le profil est consulté par le Joueur_Courant
- **Indicateur_Commun** : Élément visuel affichant le nombre de jeux en commun
  entre deux joueurs

## Exigences

### Exigence 1 : Calcul des jeux en commun

**User Story :** En tant qu'utilisateur connecté, je veux connaître le nombre de
jeux que j'ai en commun avec un autre joueur, afin de découvrir nos affinités
ludiques.

#### Critères d'acceptation

1. WHEN le Joueur_Courant consulte le profil d'un Joueur_Cible THEN le
   Système_Comparaison SHALL calculer l'intersection des deux bibliothèques
   basée sur les identifiants de jeux (game_id)
2. THE Système_Comparaison SHALL retourner le nombre total de Jeux_En_Commun et
   la liste des jeux correspondants
3. WHEN l'une des deux bibliothèques est vide THEN le Système_Comparaison SHALL
   retourner zéro jeux en commun et une liste vide
4. WHEN les deux joueurs n'ont aucun jeu en commun THEN le Système_Comparaison
   SHALL retourner zéro jeux en commun et une liste vide

### Exigence 2 : Affichage de l'indicateur de jeux en commun

**User Story :** En tant qu'utilisateur connecté, je veux voir un indicateur
clair du nombre de jeux en commun sur le profil d'un joueur, afin d'évaluer
rapidement notre compatibilité.

#### Critères d'acceptation

1. WHEN le Joueur_Courant est authentifié et consulte le profil d'un
   Joueur_Cible THEN le Système_Comparaison SHALL afficher l'Indicateur_Commun
   avec le nombre de Jeux_En_Commun
2. WHEN le Joueur_Courant n'est pas authentifié THEN le Système_Comparaison
   SHALL masquer l'Indicateur_Commun
3. WHEN le Joueur_Courant consulte son propre profil THEN le Système_Comparaison
   SHALL masquer l'Indicateur_Commun
4. WHEN les données de comparaison sont en cours de chargement THEN le
   Système_Comparaison SHALL afficher un état de chargement dans la zone de
   l'Indicateur_Commun

### Exigence 3 : Affichage de la liste des jeux en commun

**User Story :** En tant qu'utilisateur connecté, je veux voir la liste
détaillée des jeux que j'ai en commun avec un autre joueur, afin de découvrir
précisément nos jeux partagés.

#### Critères d'acceptation

1. WHEN le Joueur_Courant clique sur l'Indicateur_Commun ou sur une section
   dédiée THEN le Système_Comparaison SHALL afficher la liste des Jeux_En_Commun
   avec image de couverture, titre et genre pour chaque jeu
2. WHEN un jeu de la liste est cliqué THEN le Système_Comparaison SHALL naviguer
   vers la page de détails du jeu
3. WHEN il n'y a aucun jeu en commun THEN le Système_Comparaison SHALL afficher
   un message indiquant qu'aucun jeu n'est partagé
4. WHEN la liste des jeux en commun contient plus de 12 jeux THEN le
   Système_Comparaison SHALL paginer les résultats

### Exigence 4 : API de comparaison de bibliothèques

**User Story :** En tant que développeur, je veux une API dédiée pour comparer
les bibliothèques de deux joueurs, afin de séparer la logique métier de
l'affichage.

#### Critères d'acceptation

1. THE Système_Comparaison SHALL exposer un endpoint API qui accepte
   l'identifiant du Joueur_Cible et utilise le Joueur_Courant authentifié
2. WHEN un utilisateur non authentifié appelle l'API THEN le Système_Comparaison
   SHALL retourner une erreur 401
3. WHEN l'identifiant du Joueur_Cible est invalide (format non-UUID) THEN le
   Système_Comparaison SHALL retourner une erreur 400
4. IF le Joueur_Cible n'existe pas THEN le Système_Comparaison SHALL retourner
   une erreur 404
5. WHEN le Joueur_Courant compare avec lui-même THEN le Système_Comparaison
   SHALL retourner une erreur 400 avec un message explicatif

### Exigence 5 : Performance et optimisation

**User Story :** En tant qu'utilisateur, je veux que la comparaison soit rapide,
afin de ne pas attendre lors de la consultation d'un profil.

#### Critères d'acceptation

1. THE Système_Comparaison SHALL effectuer le calcul d'intersection via une
   requête SQL optimisée côté base de données plutôt que côté application
2. WHEN le résultat de la comparaison est demandé THEN le Système_Comparaison
   SHALL retourner la réponse en une seule requête à la base de données

### Exigence 6 : Internationalisation

**User Story :** En tant qu'utilisateur, je veux voir la fonctionnalité de
comparaison dans ma langue préférée, afin d'avoir une expérience cohérente.

#### Critères d'acceptation

1. THE Système_Comparaison SHALL supporter les locales `fr` et `en`
2. THE Système_Comparaison SHALL utiliser les fichiers de traduction existants
   (`src/messages/fr.json`, `src/messages/en.json`)
3. THE Système_Comparaison SHALL afficher les titres de jeux dans la locale
   appropriée

### Exigence 7 : Gestion des erreurs

**User Story :** En tant qu'utilisateur, je veux voir des messages d'erreur
clairs en cas de problème lors de la comparaison, afin de comprendre ce qui
s'est passé.

#### Critères d'acceptation

1. IF une erreur réseau survient lors du chargement de la comparaison THEN le
   Système_Comparaison SHALL afficher un message d'erreur avec option de
   réessayer
2. IF le chargement de la comparaison échoue THEN le Système_Comparaison SHALL
   masquer l'Indicateur_Commun plutôt que d'afficher un état cassé
