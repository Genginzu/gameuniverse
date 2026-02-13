# Document de Spécifications

## Introduction

Cette fonctionnalité enrichit la section "Temps de jeu" de la page de détails
d'un jeu. Actuellement, seul le temps de jeu officiel provenant d'IGDB
(rapidement, normalement, complètement) est affiché. L'objectif est de conserver
cette section officielle tout en ajoutant une section communautaire où les
joueurs authentifiés peuvent soumettre leur propre temps de jeu. Une moyenne des
temps de jeu soumis par les joueurs est calculée et affichée pour permettre à
chacun de se comparer. Lorsqu'un joueur soumet un temps de jeu pour un jeu,
celui-ci est automatiquement ajouté à sa bibliothèque personnelle s'il n'y
figure pas déjà.

## Glossaire

- **Composant_Playtime** : Le composant React `GamePlaytime` qui affiche les
  données de temps de jeu dans l'onglet "Temps de jeu" de la page de détails
  d'un jeu.
- **Temps_IGDB** : Les données de temps de jeu officielles fournies par IGDB
  (rapidement, normalement, complètement), stockées dans la table `games`.
- **Temps_Joueur** : Le temps de jeu en heures soumis par un joueur authentifié
  pour un jeu donné, stocké dans la colonne `play_time_hours` de la table
  `user_library`.
- **Moyenne_Joueurs** : La moyenne arithmétique de tous les Temps_Joueur non
  nuls soumis pour un jeu donné.
- **Bibliothèque** : La bibliothèque personnelle d'un joueur, représentée par la
  table `user_library` dans Supabase.
- **API_Playtime** : Le endpoint API qui gère la soumission et la récupération
  des temps de jeu des joueurs.
- **Joueur_Authentifié** : Un utilisateur connecté via Supabase Auth disposant
  d'une session valide.

## Exigences

### Exigence 1 : Affichage du temps de jeu officiel IGDB

**User Story :** En tant que visiteur, je veux voir le temps de jeu officiel
fourni par le développeur du jeu, afin de connaître la durée estimée du jeu.

#### Critères d'acceptation

1. THE Composant_Playtime SHALL afficher les données Temps_IGDB (rapidement,
   normalement, complètement) dans une section clairement identifiée comme
   "Temps de jeu officiel"
2. WHEN les données Temps_IGDB sont absentes pour un jeu, THE Composant_Playtime
   SHALL afficher un message indiquant qu'aucune donnée officielle de temps de
   jeu n'est disponible
3. THE Composant_Playtime SHALL attribuer la source des données Temps_IGDB à
   IGDB avec un lien vers le site

### Exigence 2 : Soumission du temps de jeu par un joueur

**User Story :** En tant que joueur authentifié, je veux soumettre mon temps de
jeu pour un jeu, afin de partager mon expérience avec la communauté.

#### Critères d'acceptation

1. WHEN un Joueur_Authentifié soumet un Temps_Joueur pour un jeu, THE
   API_Playtime SHALL enregistrer la valeur dans la colonne `play_time_hours` de
   la table `user_library`
2. WHEN un Joueur_Authentifié soumet un Temps_Joueur avec une valeur inférieure
   ou égale à zéro, THE API_Playtime SHALL rejeter la soumission et retourner
   une erreur de validation
3. WHEN un Joueur_Authentifié soumet un Temps_Joueur alors qu'une valeur existe
   déjà pour ce jeu, THE API_Playtime SHALL mettre à jour la valeur existante
4. WHEN un utilisateur non authentifié tente de soumettre un Temps_Joueur, THE
   API_Playtime SHALL retourner une erreur 401 Unauthorized
5. WHEN un Joueur_Authentifié soumet un Temps_Joueur pour un jeu inexistant, THE
   API_Playtime SHALL retourner une erreur 404

### Exigence 3 : Ajout automatique à la bibliothèque

**User Story :** En tant que joueur authentifié, je veux que le jeu soit
automatiquement ajouté à ma bibliothèque lorsque je soumets un temps de jeu,
afin de ne pas avoir à le faire manuellement.

#### Critères d'acceptation

1. WHEN un Joueur_Authentifié soumet un Temps_Joueur pour un jeu qui n'est pas
   dans sa Bibliothèque, THE API_Playtime SHALL créer une entrée dans la
   Bibliothèque avec le statut "playing" et le temps de jeu soumis
2. WHEN un Joueur_Authentifié soumet un Temps_Joueur pour un jeu déjà présent
   dans sa Bibliothèque, THE API_Playtime SHALL mettre à jour uniquement la
   valeur `play_time_hours` sans modifier les autres champs de l'entrée

### Exigence 4 : Calcul et affichage de la moyenne des joueurs

**User Story :** En tant que visiteur, je veux voir la moyenne des temps de jeu
soumis par les joueurs, afin de comparer ma propre expérience avec celle de la
communauté.

#### Critères d'acceptation

1. WHEN au moins un Temps_Joueur existe pour un jeu, THE API_Playtime SHALL
   calculer la Moyenne_Joueurs comme la moyenne arithmétique de toutes les
   valeurs `play_time_hours` strictement positives pour ce jeu
2. WHEN aucun Temps_Joueur n'existe pour un jeu, THE Composant_Playtime SHALL
   afficher un message invitant les joueurs à soumettre leur temps de jeu
3. THE Composant_Playtime SHALL afficher la Moyenne_Joueurs et le nombre de
   joueurs ayant contribué dans une section "Temps de jeu des joueurs"
4. WHEN un Joueur_Authentifié a soumis un Temps_Joueur pour le jeu affiché, THE
   Composant_Playtime SHALL afficher son temps personnel à côté de la
   Moyenne_Joueurs pour comparaison

### Exigence 5 : Interface utilisateur du formulaire de soumission

**User Story :** En tant que joueur authentifié, je veux un formulaire simple
pour soumettre mon temps de jeu, afin de pouvoir contribuer facilement.

#### Critères d'acceptation

1. WHEN un Joueur_Authentifié consulte l'onglet temps de jeu, THE
   Composant_Playtime SHALL afficher un formulaire de saisie du temps de jeu en
   heures
2. WHEN un utilisateur non authentifié consulte l'onglet temps de jeu, THE
   Composant_Playtime SHALL masquer le formulaire de soumission et afficher un
   message invitant à se connecter
3. WHEN un Joueur_Authentifié a déjà soumis un Temps_Joueur pour ce jeu, THE
   Composant_Playtime SHALL pré-remplir le formulaire avec la valeur existante
   et permettre la modification
4. WHEN la soumission du formulaire réussit, THE Composant_Playtime SHALL mettre
   à jour l'affichage de la Moyenne_Joueurs et du temps personnel sans
   rechargement de page
5. WHEN la soumission du formulaire échoue, THE Composant_Playtime SHALL
   afficher un message d'erreur descriptif

### Exigence 6 : Validation des données

**User Story :** En tant que développeur, je veux que les données de temps de
jeu soient validées, afin de garantir l'intégrité des données.

#### Critères d'acceptation

1. THE API_Playtime SHALL valider que le Temps_Joueur soumis est un nombre
   strictement positif
2. THE API_Playtime SHALL valider que le Temps_Joueur soumis ne dépasse pas 50
   000 heures
3. THE API_Playtime SHALL valider que le Temps_Joueur soumis est arrondi au plus
   à une décimale (précision de 0.1 heure)
