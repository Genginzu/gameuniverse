# Requirements Document

## Introduction

Dashboard de statistiques complet pour le profil d'un utilisateur de la
plateforme Game Universe. Ce dashboard remplace l'onglet "stats" existant (qui
affiche actuellement les `EnrichedStats` basiques) par un vrai tableau de bord
riche, organisé en sections thématiques. Il exploite les données déjà
disponibles en base (bibliothèque, avis, collections, favoris, amis,
commentaires) et prévoit également des statistiques nécessitant de nouvelles
données (succès/achievements, temps de jeu par session, objectifs personnels).

## Glossaire

- **Dashboard** : Page/onglet de statistiques du profil joueur, accessible via
  l'onglet "stats" existant
- **Player** : Utilisateur inscrit sur la plateforme, identifié par un UUID dans
  la table `profiles`
- **Library** : Ensemble des jeux d'un joueur stockés dans `user_library`
  (statuts : owned, wishlist, completed, playing)
- **Stats_API** : Route API `/api/players/[id]/stats/dashboard` servant les
  données du dashboard
- **Stats_Dashboard** : Composant principal React affichant le dashboard de
  statistiques
- **Genre_Chart** : Composant de visualisation de la répartition des genres dans
  la bibliothèque
- **Completion_Tracker** : Section affichant la progression de complétion de la
  bibliothèque
- **Review_Analytics** : Section d'analyse des avis rédigés par le joueur
- **Social_Stats** : Section des statistiques sociales (amis, commentaires,
  favoris)
- **Achievement_System** : Système de badges/succès basé sur les actions du
  joueur (nécessite nouvelles données)
- **Session_Tracker** : Système de suivi du temps de jeu par session (nécessite
  nouvelles données)
- **Visitor** : Utilisateur consultant le profil d'un autre joueur

## Requirements

### Requirement 1 : Vue d'ensemble du dashboard

**User Story :** En tant que joueur, je veux voir un résumé visuel de mes
statistiques principales en haut du dashboard, afin d'avoir une vue d'ensemble
rapide de mon activité sur la plateforme.

#### Acceptance Criteria

1. WHEN le Player accède à l'onglet stats, THE Stats_Dashboard SHALL afficher
   une grille de cartes résumant les métriques clés : nombre total de jeux,
   temps de jeu total, nombre d'avis rédigés, note moyenne donnée, nombre de
   collections, nombre d'amis
2. THE Stats_Dashboard SHALL calculer le nombre total de jeux à partir des
   entrées `user_library` du Player
3. THE Stats_Dashboard SHALL calculer le temps de jeu total en additionnant les
   champs `play_time_hours` de toutes les entrées `user_library` du Player
4. THE Stats_Dashboard SHALL calculer la note moyenne en faisant la moyenne des
   champs `rating` de la table `game_reviews` du Player, arrondie à une décimale
5. WHEN aucune donnée de bibliothèque n'existe pour le Player, THE
   Stats_Dashboard SHALL afficher zéro pour chaque métrique numérique et un
   message invitant à ajouter des jeux
6. THE Stats_Dashboard SHALL utiliser le style glassmorphism avec les classes
   `.glass-card` et supporter le dark mode

### Requirement 2 : Répartition par genre

**User Story :** En tant que joueur, je veux voir la répartition de ma
bibliothèque par genre sous forme de graphique, afin de comprendre mes
préférences de jeu.

#### Acceptance Criteria

1. THE Genre_Chart SHALL afficher un graphique en anneau (donut chart) montrant
   la répartition des genres de la bibliothèque du Player
2. THE Genre_Chart SHALL calculer la répartition en comptant le nombre de jeux
   par genre via la table `game_genres` jointe à `user_library`
3. WHEN un jeu appartient à plusieurs genres, THE Genre_Chart SHALL compter ce
   jeu une fois pour chaque genre associé
4. THE Genre_Chart SHALL afficher les 5 genres les plus représentés et regrouper
   les genres restants sous un label "Autres"
5. WHEN le Player survole un segment du graphique, THE Genre_Chart SHALL
   afficher un tooltip avec le nom du genre, le nombre de jeux et le pourcentage
6. WHEN la bibliothèque du Player ne contient aucun jeu, THE Genre_Chart SHALL
   afficher un état vide avec un message explicatif

### Requirement 3 : Progression de complétion

**User Story :** En tant que joueur, je veux voir ma progression de complétion
de bibliothèque, afin de suivre combien de jeux j'ai terminés par rapport à ceux
que je possède.

#### Acceptance Criteria

1. THE Completion_Tracker SHALL afficher une barre de progression montrant le
   ratio de jeux complétés (status = 'completed') par rapport au nombre total de
   jeux dans la bibliothèque du Player
2. THE Completion_Tracker SHALL afficher le nombre de jeux par statut : owned,
   playing, completed, wishlist
3. THE Completion_Tracker SHALL afficher le pourcentage de complétion arrondi à
   l'entier le plus proche
4. WHEN le Player n'a aucun jeu dans sa bibliothèque, THE Completion_Tracker
   SHALL afficher une barre de progression à 0% avec un message invitant à
   ajouter des jeux
5. THE Completion_Tracker SHALL utiliser des couleurs distinctes pour chaque
   statut : vert pour completed, bleu pour playing, gris pour owned, orange pour
   wishlist

### Requirement 4 : Analyse des avis

**User Story :** En tant que joueur, je veux voir des statistiques détaillées
sur mes avis, afin de comprendre mes habitudes de notation.

#### Acceptance Criteria

1. THE Review_Analytics SHALL afficher un histogramme de la distribution des
   notes données par le Player, regroupées par tranches de 5 points (0-5, 6-10,
   11-15, 16-20)
2. THE Review_Analytics SHALL calculer la distribution à partir des champs
   `rating` de la table `game_reviews` du Player
3. THE Review_Analytics SHALL afficher la note moyenne, la note médiane, la note
   la plus fréquente (mode) et le nombre total d'avis
4. WHEN le Player n'a rédigé aucun avis, THE Review_Analytics SHALL afficher un
   état vide avec un message invitant à rédiger un premier avis
5. THE Review_Analytics SHALL afficher le nombre de votes "helpful" reçus sur
   l'ensemble des avis du Player, calculé à partir de la table `review_votes`

### Requirement 5 : Statistiques sociales

**User Story :** En tant que joueur, je veux voir mes statistiques sociales
(amis, commentaires, favoris), afin de mesurer mon engagement communautaire sur
la plateforme.

#### Acceptance Criteria

1. THE Social_Stats SHALL afficher le nombre total d'amis acceptés du Player,
   calculé à partir de la table `friendships` avec status = 'accepted'
2. THE Social_Stats SHALL afficher le nombre total de commentaires rédigés par
   le Player, calculé à partir de la table `character_comments`
3. THE Social_Stats SHALL afficher le nombre total de personnages mis en favoris
   par le Player, calculé à partir de la table `character_favorites`
4. THE Social_Stats SHALL afficher le nombre total de collections créées par le
   Player, calculé à partir de la table `game_collections`
5. WHEN le Player n'a aucune activité sociale, THE Social_Stats SHALL afficher
   zéro pour chaque métrique avec un message encourageant l'interaction

### Requirement 6 : Chronologie d'activité

**User Story :** En tant que joueur, je veux voir un graphique de mon activité
dans le temps, afin de visualiser mes périodes les plus actives sur la
plateforme.

#### Acceptance Criteria

1. THE Stats_Dashboard SHALL afficher un graphique en barres montrant le nombre
   de jeux ajoutés à la bibliothèque par mois sur les 12 derniers mois
2. THE Stats_Dashboard SHALL calculer les données du graphique à partir du champ
   `added_at` de la table `user_library` du Player
3. WHEN un mois ne contient aucun ajout, THE Stats_Dashboard SHALL afficher une
   barre de hauteur zéro pour ce mois
4. THE Stats_Dashboard SHALL afficher les noms des mois localisés selon la
   locale active (FR ou EN) via next-intl
5. WHEN le Player n'a aucune activité sur les 12 derniers mois, THE
   Stats_Dashboard SHALL afficher un état vide avec un message explicatif

### Requirement 7 : Temps de jeu moyen par jeu

**User Story :** En tant que joueur, je veux connaître mon temps de jeu moyen
par jeu, afin de comprendre mes habitudes de jeu.

#### Acceptance Criteria

1. THE Stats_Dashboard SHALL calculer le temps de jeu moyen en divisant le temps
   de jeu total par le nombre de jeux ayant un temps de jeu supérieur à zéro
2. THE Stats_Dashboard SHALL afficher le temps de jeu moyen arrondi à une
   décimale, exprimé en heures
3. THE Stats_Dashboard SHALL afficher le jeu avec le temps de jeu le plus élevé
   (top game) avec son titre localisé et son image de couverture
4. WHEN aucun jeu n'a de temps de jeu renseigné, THE Stats_Dashboard SHALL
   afficher un tiret pour le temps moyen et un message "Aucun temps de jeu
   renseigné" pour le top game

### Requirement 8 : Confidentialité des statistiques

**User Story :** En tant que joueur, je veux pouvoir masquer mes statistiques
aux visiteurs de mon profil, afin de protéger ma vie privée.

#### Acceptance Criteria

1. WHILE le champ `stats_private` du profil du Player est à true, THE
   Stats_Dashboard SHALL masquer toutes les sections de statistiques pour un
   Visitor et afficher un message "Statistiques privées"
2. WHILE le champ `stats_private` du profil du Player est à true, THE Stats_API
   SHALL retourner un objet `{ stats: null, private: true }` pour un Visitor
3. WHEN le Player consulte son propre profil, THE Stats_Dashboard SHALL afficher
   toutes les statistiques indépendamment de la valeur de `stats_private`
4. THE Stats_API SHALL déterminer si le Visitor est le propriétaire du profil en
   comparant l'identifiant de l'utilisateur authentifié avec l'identifiant du
   Player

### Requirement 9 : API du dashboard de statistiques

**User Story :** En tant que développeur, je veux une API dédiée au dashboard de
statistiques, afin de servir toutes les données nécessaires en un seul appel.

#### Acceptance Criteria

1. THE Stats_API SHALL exposer un endpoint GET
   `/api/players/[id]/stats/dashboard` retournant toutes les données du
   dashboard en une seule réponse JSON
2. THE Stats_API SHALL inclure dans la réponse : les métriques résumées, la
   répartition par genre, la progression de complétion, l'analyse des avis, les
   statistiques sociales et la chronologie d'activité
3. THE Stats_API SHALL accepter un paramètre `locale` (valeurs : "fr" ou "en")
   pour localiser les noms de genres et les titres de jeux
4. IF l'identifiant du Player n'est pas un UUID valide, THEN THE Stats_API SHALL
   retourner une erreur HTTP 400 avec un message descriptif
5. IF le Player n'existe pas en base, THEN THE Stats_API SHALL retourner une
   erreur HTTP 404 avec un message descriptif
6. THE Stats_API SHALL exécuter les requêtes de données en parallèle pour
   réduire le temps de réponse total

### Requirement 10 : Traductions i18n

**User Story :** En tant que joueur francophone ou anglophone, je veux voir le
dashboard de statistiques dans ma langue, afin de comprendre toutes les
informations affichées.

#### Acceptance Criteria

1. THE Stats_Dashboard SHALL afficher tous les labels, titres et messages dans
   la langue active (FR ou EN) via les clés de traduction next-intl
2. THE Stats_Dashboard SHALL ajouter les clés de traduction dans les fichiers
   `src/messages/fr.json` et `src/messages/en.json` simultanément
3. THE Stats_Dashboard SHALL localiser les valeurs numériques (séparateur de
   milliers, décimales) selon la locale active
4. THE Stats_Dashboard SHALL localiser les noms de mois dans le graphique de
   chronologie selon la locale active

### Requirement 11 : Système de succès (nécessite nouvelles données)

**User Story :** En tant que joueur, je veux débloquer des badges/succès basés
sur mon activité, afin d'avoir des objectifs à atteindre et de gamifier mon
expérience.

#### Acceptance Criteria

1. THE Achievement_System SHALL définir des succès basés sur des seuils
   d'activité : premier jeu ajouté, 10 jeux dans la bibliothèque, 50 jeux,
   premier avis rédigé, 10 avis, 100 heures de jeu, 500 heures, premier ami
   ajouté, 10 amis, première collection créée
2. THE Achievement_System SHALL stocker les succès débloqués dans une nouvelle
   table `player_achievements` avec les colonnes : id (UUID), user_id (UUID FK),
   achievement_key (VARCHAR), unlocked_at (TIMESTAMPTZ)
3. THE Achievement_System SHALL vérifier les conditions de déblocage lors de
   chaque action pertinente (ajout de jeu, rédaction d'avis, ajout d'ami,
   création de collection)
4. THE Stats_Dashboard SHALL afficher la liste des succès avec leur statut
   (débloqué ou verrouillé) et la date de déblocage le cas échéant
5. WHEN un succès est débloqué, THE Achievement_System SHALL enregistrer la date
   de déblocage dans la table `player_achievements`
6. THE Stats_Dashboard SHALL afficher une barre de progression globale indiquant
   le nombre de succès débloqués par rapport au nombre total de succès
   disponibles

### Requirement 12 : Suivi du temps de jeu par session (nécessite nouvelles données)

**User Story :** En tant que joueur, je veux voir des statistiques détaillées
sur mes sessions de jeu, afin de comprendre mes habitudes de jeu au fil du
temps.

#### Acceptance Criteria

1. THE Session_Tracker SHALL stocker les sessions de jeu dans une nouvelle table
   `game_sessions` avec les colonnes : id (UUID), user_id (UUID FK), game_id
   (UUID FK), started_at (TIMESTAMPTZ), ended_at (TIMESTAMPTZ), duration_minutes
   (INTEGER)
2. THE Stats_Dashboard SHALL afficher le nombre total de sessions, la durée
   moyenne d'une session et la durée de la session la plus longue
3. THE Stats_Dashboard SHALL afficher un graphique de la fréquence des sessions
   par jour de la semaine (lundi à dimanche)
4. WHEN le Player n'a aucune session enregistrée, THE Stats_Dashboard SHALL
   afficher un état vide avec un message expliquant que cette fonctionnalité
   nécessite l'enregistrement de sessions de jeu
5. THE Session_Tracker SHALL calculer la durée d'une session en minutes à partir
   de la différence entre `ended_at` et `started_at`

### Requirement 13 : Objectifs personnels (nécessite nouvelles données)

**User Story :** En tant que joueur, je veux définir des objectifs personnels
(nombre de jeux à terminer, heures de jeu à atteindre), afin de me motiver et
suivre ma progression.

#### Acceptance Criteria

1. THE Stats_Dashboard SHALL permettre au Player de définir des objectifs
   personnels stockés dans une nouvelle table `player_goals` avec les colonnes :
   id (UUID), user_id (UUID FK), goal_type (VARCHAR), target_value (INTEGER),
   current_value (INTEGER), created_at (TIMESTAMPTZ), deadline (DATE nullable)
2. THE Stats_Dashboard SHALL supporter les types d'objectifs suivants :
   games_to_complete, play_time_hours, reviews_to_write, collections_to_create
3. THE Stats_Dashboard SHALL afficher chaque objectif avec une barre de
   progression montrant la valeur actuelle par rapport à la valeur cible
4. WHEN un objectif est atteint (current_value >= target_value), THE
   Stats_Dashboard SHALL afficher un indicateur visuel de complétion (badge ou
   icône)
5. THE Stats_Dashboard SHALL permettre au Player de créer, modifier et supprimer
   ses objectifs personnels
6. WHEN un Visitor consulte le profil, THE Stats_Dashboard SHALL masquer la
   section objectifs personnels car les objectifs sont privés
