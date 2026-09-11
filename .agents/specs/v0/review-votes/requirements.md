# Document d'exigences — Review Votes

## Introduction

Ce document décrit les exigences pour le système de votes sur les avis de jeux.
Les joueurs pourront indiquer si un avis est utile ou non via un mécanisme «
utile / pas utile ». Cela permet d'améliorer l'engagement communautaire et de
mettre en avant les avis les plus pertinents.

## Glossaire

- **Review_Vote_System** : Le sous-système responsable de l'enregistrement, la
  modification et la suppression des votes sur les avis.
- **Review** : Un avis existant dans la table `game_reviews`, rédigé par un
  joueur sur un jeu.
- **Vote** : Une indication « utile » (helpful) ou « pas utile » (not helpful)
  émise par un joueur authentifié sur un avis.
- **Vote_Count** : Le nombre agrégé de votes utiles et pas utiles pour un avis
  donné.
- **Voter** : Un joueur authentifié qui émet un vote sur un avis.

## Exigences

### Exigence 1 : Voter sur un avis

**User Story :** En tant que joueur authentifié, je veux pouvoir indiquer si un
avis est utile ou pas utile, afin de contribuer à la mise en valeur des avis
pertinents.

#### Critères d'acceptation

1. WHEN un Voter clique sur le bouton « utile » ou « pas utile » d'une Review,
   THEN le Review_Vote_System SHALL enregistrer le Vote associé au Voter et à la
   Review.
2. WHEN un Voter a déjà voté sur une Review et clique sur le même type de vote,
   THEN le Review_Vote_System SHALL supprimer le Vote existant (toggle).
3. WHEN un Voter a déjà voté sur une Review et clique sur le type de vote
   opposé, THEN le Review_Vote_System SHALL remplacer le Vote existant par le
   nouveau type.
4. WHEN un Voter consulte une Review sur laquelle il a déjà voté, THEN le
   Review_Vote_System SHALL afficher visuellement le type de vote actif du
   Voter.

### Exigence 2 : Affichage des compteurs de votes

**User Story :** En tant que joueur, je veux voir le nombre de votes « utile »
et « pas utile » sur chaque avis, afin de juger rapidement de la pertinence d'un
avis.

#### Critères d'acceptation

1. THE Review_Vote_System SHALL afficher le Vote_Count (nombre de votes utiles
   et pas utiles) sur chaque Review Card.
2. WHEN un Vote est ajouté, modifié ou supprimé, THEN le Review_Vote_System
   SHALL mettre à jour le Vote_Count affiché sans rechargement complet de la
   page.
3. WHEN une Review n'a aucun vote, THEN le Review_Vote_System SHALL afficher un
   compteur à zéro pour chaque type de vote.

### Exigence 3 : Restrictions de vote

**User Story :** En tant que système, je veux empêcher les votes non autorisés,
afin de garantir l'intégrité des données de vote.

#### Critères d'acceptation

1. WHEN un utilisateur non authentifié tente de voter, THEN le
   Review_Vote_System SHALL refuser l'action et inviter l'utilisateur à se
   connecter.
2. WHEN un Voter tente de voter sur sa propre Review, THEN le Review_Vote_System
   SHALL refuser l'action.
3. THE Review_Vote_System SHALL limiter chaque Voter à un seul Vote par Review
   (contrainte d'unicité user_id + review_id).

### Exigence 4 : Persistance et intégrité des données

**User Story :** En tant que développeur, je veux que les votes soient stockés
de manière fiable en base de données, afin de garantir la cohérence et la
durabilité des données.

#### Critères d'acceptation

1. THE Review_Vote_System SHALL stocker chaque Vote dans une table dédiée
   `review_votes` avec les colonnes : id, user_id, review_id, vote_type
   (helpful/not_helpful), created_at.
2. WHEN une Review est supprimée, THEN le Review_Vote_System SHALL supprimer
   automatiquement tous les Votes associés (cascade).
3. WHEN un compte utilisateur est supprimé, THEN le Review_Vote_System SHALL
   supprimer automatiquement tous les Votes de cet utilisateur (cascade).
4. THE Review_Vote_System SHALL appliquer des politiques RLS permettant la
   lecture publique des votes et limitant l'écriture/suppression au propriétaire
   du Vote.

### Exigence 5 : API de gestion des votes

**User Story :** En tant que développeur front-end, je veux une API REST pour
gérer les votes, afin d'intégrer le système de votes dans l'interface
utilisateur.

#### Critères d'acceptation

1. WHEN une requête POST est envoyée à l'endpoint de votes avec un review_id et
   un vote_type valides, THEN le Review_Vote_System SHALL créer ou mettre à jour
   le Vote du Voter.
2. WHEN une requête DELETE est envoyée à l'endpoint de votes avec un review_id
   valide, THEN le Review_Vote_System SHALL supprimer le Vote du Voter.
3. IF une requête de vote contient un review_id inexistant, THEN le
   Review_Vote_System SHALL retourner une erreur 404.
4. IF une requête de vote est envoyée sans authentification, THEN le
   Review_Vote_System SHALL retourner une erreur 401.
5. WHEN les reviews d'un jeu sont récupérées via GET, THEN le Review_Vote_System
   SHALL inclure le Vote_Count et le vote actuel du Voter pour chaque Review.
