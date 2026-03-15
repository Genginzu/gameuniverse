# Document de Exigences — Système de Succès

## Introduction

Ce document décrit les exigences pour un système de succès (achievements)
intégré à la plateforme sociale de gaming. Les joueurs débloquent des succès en
réalisant des actions variées (temps de jeu, taille de bibliothèque, avis
rédigés, etc.). Chaque succès débloqué octroie de l'expérience (XP) qui alimente
un système de niveaux. Le niveau et la progression sont affichés sur le profil
du joueur, et une page dédiée liste tous les succès disponibles et débloqués.

Le projet dispose déjà d'une table `player_achievements` (clé de succès par
joueur), d'une table `game_sessions` (sessions de jeu), et d'une colonne `level`
sur le profil. Cette feature étend ces fondations avec un catalogue de succès
défini, un moteur XP/niveaux, et les interfaces utilisateur associées.

## Glossaire

- **Achievement_Catalog** : Table de référence en base de données contenant la
  définition de chaque succès (clé, catégorie, seuil, XP, icône, traductions)
- **Achievement_Engine** : Service côté serveur responsable de l'évaluation des
  conditions de déblocage et de l'attribution des succès
- **Player_Achievements** : Table existante stockant les succès débloqués par
  chaque joueur
- **XP** : Points d'expérience gagnés en débloquant des succès
- **Player_XP** : Table stockant le total d'XP accumulé par un joueur
- **Level_System** : Logique de calcul du niveau d'un joueur à partir de son XP
  total, avec une courbe de progression définie
- **Progress_Ring** : Composant visuel circulaire affiché autour de l'avatar du
  joueur, indiquant la progression vers le niveau suivant
- **Achievements_Page** : Page dédiée listant tous les succès disponibles, leur
  statut (débloqué ou verrouillé), et les statistiques du joueur
- **Achievement_Category** : Regroupement thématique des succès (bibliothèque,
  temps de jeu, social, avis, collections)
- **Achievement_Tier** : Niveau de difficulté d'un succès au sein d'une même
  catégorie (bronze, argent, or)

## Exigences

### Exigence 1 : Catalogue de succès en base de données

**User Story :** En tant qu'administrateur, je veux définir les succès
disponibles dans une table de référence, afin que le système puisse évaluer et
attribuer les succès de manière cohérente.

#### Critères d'acceptation

1. THE Achievement_Catalog SHALL stocker pour chaque succès : une clé unique,
   une catégorie, un palier (tier), un seuil numérique de déclenchement, une
   valeur d'XP, et une icône
2. THE Achievement_Catalog SHALL stocker les traductions (nom et description) en
   français et en anglais pour chaque succès
3. WHEN un succès est ajouté au Achievement_Catalog, THE Achievement_Catalog
   SHALL imposer l'unicité de la clé du succès
4. THE Achievement_Catalog SHALL contenir au minimum les catégories suivantes :
   bibliothèque, temps de jeu, social, avis, collections

### Exigence 2 : Succès prédéfinis

**User Story :** En tant que joueur, je veux disposer d'un ensemble varié de
succès à débloquer, afin d'avoir des objectifs motivants sur la plateforme.

#### Critères d'acceptation

1. THE Achievement_Catalog SHALL contenir des succès de catégorie « bibliothèque
   » déclenchés par le nombre de jeux dans la bibliothèque du joueur (seuils :
   1, 5, 10, 25, 50, 100)
2. THE Achievement_Catalog SHALL contenir des succès de catégorie « temps de jeu
   » déclenchés par le nombre total d'heures de jeu enregistrées (seuils : 10,
   50, 100, 500, 1000)
3. THE Achievement_Catalog SHALL contenir des succès de catégorie « avis »
   déclenchés par le nombre d'avis rédigés (seuils : 1, 5, 10, 25, 50)
4. THE Achievement_Catalog SHALL contenir des succès de catégorie « social »
   déclenchés par le nombre d'amis ajoutés (seuils : 1, 5, 10, 25)
5. THE Achievement_Catalog SHALL contenir des succès de catégorie « collections
   » déclenchés par le nombre de collections créées (seuils : 1, 3, 5, 10)
6. THE Achievement_Catalog SHALL attribuer un palier (bronze, argent, or) à
   chaque succès en fonction de la difficulté du seuil

### Exigence 3 : Moteur de détection et d'attribution des succès

**User Story :** En tant que joueur, je veux que mes succès soient
automatiquement détectés et débloqués lorsque je remplis les conditions, afin de
ne pas avoir à les réclamer manuellement.

#### Critères d'acceptation

1. WHEN un joueur ajoute un jeu à sa bibliothèque, THE Achievement_Engine SHALL
   évaluer les succès de catégorie « bibliothèque » pour ce joueur
2. WHEN un joueur enregistre du temps de jeu, THE Achievement_Engine SHALL
   évaluer les succès de catégorie « temps de jeu » pour ce joueur
3. WHEN un joueur publie un avis, THE Achievement_Engine SHALL évaluer les
   succès de catégorie « avis » pour ce joueur
4. WHEN un joueur ajoute un ami, THE Achievement_Engine SHALL évaluer les succès
   de catégorie « social » pour ce joueur
5. WHEN un joueur crée une collection, THE Achievement_Engine SHALL évaluer les
   succès de catégorie « collections » pour ce joueur
6. WHEN un succès est débloqué, THE Achievement_Engine SHALL insérer un
   enregistrement dans Player_Achievements avec la date de déblocage
7. WHEN un succès déjà débloqué est réévalué, THE Achievement_Engine SHALL
   conserver l'enregistrement existant sans créer de doublon
8. IF le Achievement_Catalog ne contient aucun succès correspondant à l'action
   effectuée, THEN THE Achievement_Engine SHALL terminer l'évaluation sans
   erreur

### Exigence 4 : Système d'XP et de niveaux

**User Story :** En tant que joueur, je veux gagner de l'expérience en
débloquant des succès et voir mon niveau augmenter, afin de mesurer ma
progression sur la plateforme.

#### Critères d'acceptation

1. WHEN un succès est débloqué, THE Level_System SHALL ajouter la valeur d'XP du
   succès au total d'XP du joueur dans Player_XP
2. THE Level_System SHALL calculer le niveau du joueur selon la formule : niveau
   = floor(0.3 × √(xp_total)) + 1
3. WHEN le niveau calculé du joueur change, THE Level_System SHALL mettre à jour
   la colonne level du profil du joueur
4. THE Level_System SHALL calculer la progression vers le niveau suivant en
   pourcentage, basée sur l'XP accumulé dans le niveau actuel par rapport à l'XP
   requis pour le niveau suivant
5. THE Player_XP SHALL stocker le total d'XP de chaque joueur de manière
   persistante
6. WHEN un joueur n'a débloqué aucun succès, THE Level_System SHALL afficher le
   niveau 1 avec 0 XP

### Exigence 5 : Affichage du niveau sur le profil

**User Story :** En tant que joueur, je veux voir mon niveau affiché sous mon
avatar et une barre de progression autour de mon avatar, afin de visualiser ma
progression.

#### Critères d'acceptation

1. THE Progress_Ring SHALL afficher un anneau circulaire autour de l'avatar du
   joueur sur la page de profil
2. THE Progress_Ring SHALL remplir l'anneau proportionnellement au pourcentage
   de progression vers le niveau suivant
3. THE Progress_Ring SHALL utiliser un dégradé de couleurs néon (violet vers
   cyan) cohérent avec le design glassmorphism du site
4. WHEN la page de profil d'un joueur est affichée, THE Player_Profile SHALL
   afficher le niveau du joueur sous l'avatar
5. WHEN un visiteur consulte le profil d'un autre joueur, THE Player_Profile
   SHALL afficher le niveau et la barre de progression de ce joueur
6. THE Progress_Ring SHALL afficher une animation fluide lors du chargement
   initial de la page

### Exigence 6 : Page de succès

**User Story :** En tant que joueur, je veux accéder à une page dédiée listant
tous les succès, afin de voir ma progression et les succès restants à débloquer.

#### Critères d'acceptation

1. THE Achievements_Page SHALL afficher le nombre total de succès débloqués par
   le joueur et le nombre total de succès disponibles
2. THE Achievements_Page SHALL afficher le total d'XP accumulé par le joueur
3. THE Achievements_Page SHALL afficher le niveau actuel du joueur et la
   progression vers le niveau suivant
4. THE Achievements_Page SHALL lister tous les succès disponibles, regroupés par
   catégorie
5. WHEN un succès est débloqué, THE Achievements_Page SHALL afficher le succès
   avec son icône en couleur, son nom, sa description, l'XP associée et la date
   de déblocage
6. WHEN un succès est verrouillé, THE Achievements_Page SHALL afficher le succès
   avec une apparence atténuée (icône grisée), son nom, sa description et l'XP
   associée
7. THE Achievements_Page SHALL permettre de filtrer les succès par catégorie
8. THE Achievements_Page SHALL être accessible depuis le profil du joueur et
   depuis la navigation principale
9. WHEN un visiteur consulte la page de succès d'un autre joueur, THE
   Achievements_Page SHALL afficher les succès débloqués et verrouillés de ce
   joueur

### Exigence 7 : Internationalisation

**User Story :** En tant que joueur francophone ou anglophone, je veux que tous
les textes du système de succès soient traduits dans ma langue, afin de
comprendre les succès et ma progression.

#### Critères d'acceptation

1. THE Achievements_Page SHALL afficher tous les textes d'interface (titres,
   labels, filtres) en français et en anglais via next-intl
2. THE Achievement_Catalog SHALL fournir le nom et la description de chaque
   succès en français et en anglais
3. WHEN la langue du site est changée, THE Achievements_Page SHALL afficher les
   traductions correspondantes sans rechargement de page
4. THE Progress_Ring SHALL afficher le label de niveau (« Niveau X » / « Level X
   ») dans la langue active du joueur

### Exigence 8 : API de succès

**User Story :** En tant que développeur front-end, je veux disposer d'endpoints
API pour récupérer les succès et les statistiques XP d'un joueur, afin
d'alimenter les composants d'interface.

#### Critères d'acceptation

1. WHEN une requête GET est envoyée à l'endpoint des succès d'un joueur, THE API
   SHALL retourner la liste complète des succès du catalogue avec le statut
   débloqué/verrouillé pour ce joueur
2. WHEN une requête GET est envoyée à l'endpoint XP d'un joueur, THE API SHALL
   retourner le total d'XP, le niveau actuel, l'XP du niveau actuel, l'XP requis
   pour le niveau suivant, et le pourcentage de progression
3. IF l'identifiant du joueur fourni est invalide, THEN THE API SHALL retourner
   un code d'erreur 400 avec un message descriptif
4. IF le joueur demandé n'existe pas, THEN THE API SHALL retourner un code
   d'erreur 404 avec un message descriptif
