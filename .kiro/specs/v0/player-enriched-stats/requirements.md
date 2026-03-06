# Document des Exigences

## Introduction

Cette fonctionnalité enrichit le profil joueur avec des statistiques avancées :
temps de jeu total agrégé, genre le plus joué, nombre de reviews écrites, et un
résumé annuel de type « Année en Revue » (inspiré du Spotify Wrapped) pour le
gaming. Ces statistiques sont affichées sur la page de profil du joueur et
accessibles via une page dédiée pour le résumé annuel. Les données sont
calculées à partir des tables existantes `user_library`, `game_reviews`, et des
genres associés aux jeux.

## Glossaire

- **Système_Stats** : Module gérant le calcul, le stockage et l'affichage des
  statistiques enrichies d'un joueur
- **Stats_Enrichies** : Ensemble des statistiques avancées d'un joueur (temps de
  jeu total, genre favori, nombre de reviews)
- **Genre_Favori** : Le genre de jeu le plus représenté dans la bibliothèque
  d'un joueur, pondéré par le temps de jeu
- **Résumé_Annuel** : Page récapitulative annuelle présentant les statistiques
  de jeu d'un joueur pour une année donnée, dans un format visuel engageant
- **API_Stats** : Endpoint API qui calcule et retourne les statistiques
  enrichies d'un joueur
- **API_Résumé** : Endpoint API qui calcule et retourne le résumé annuel d'un
  joueur pour une année donnée
- **Joueur** : Utilisateur inscrit sur la plateforme (table `profiles`)
- **Bibliothèque** : Collection de jeux d'un joueur (table `user_library`)
- **Visiteur** : Utilisateur non authentifié ou authentifié consultant le profil
  d'un autre joueur

## Exigences

### Exigence 1 : Calcul du temps de jeu total

**User Story :** En tant que joueur, je veux voir mon temps de jeu total agrégé
sur tous mes jeux, afin de connaître le temps que j'ai consacré au gaming.

#### Critères d'acceptation

1. WHEN l'API_Stats reçoit une requête pour un joueur, THE Système_Stats SHALL
   calculer le temps de jeu total comme la somme de toutes les valeurs
   `play_time_hours` de la Bibliothèque du joueur
2. WHEN un joueur n'a aucun temps de jeu enregistré, THE Système_Stats SHALL
   retourner un temps de jeu total de 0
3. THE Système_Stats SHALL exprimer le temps de jeu total en heures avec une
   précision d'une décimale

### Exigence 2 : Calcul du genre le plus joué

**User Story :** En tant que joueur, je veux connaître mon genre de jeu favori,
afin de mieux comprendre mes préférences de jeu.

#### Critères d'acceptation

1. WHEN l'API_Stats reçoit une requête pour un joueur, THE Système_Stats SHALL
   déterminer le Genre_Favori en additionnant le temps de jeu par genre à partir
   des jeux de la Bibliothèque du joueur
2. WHEN un jeu possède plusieurs genres, THE Système_Stats SHALL répartir le
   temps de jeu du jeu équitablement entre chaque genre associé
3. WHEN un joueur n'a aucun jeu avec un genre assigné, THE Système_Stats SHALL
   retourner une valeur nulle pour le Genre_Favori
4. THE Système_Stats SHALL retourner le nom du Genre_Favori ainsi que le temps
   de jeu total associé à ce genre
5. WHEN deux genres ont un temps de jeu identique, THE Système_Stats SHALL
   sélectionner le genre dont le nom est le premier par ordre alphabétique

### Exigence 3 : Comptage des reviews écrites

**User Story :** En tant que joueur, je veux voir combien de reviews j'ai
écrites, afin de mesurer ma contribution à la communauté.

#### Critères d'acceptation

1. WHEN l'API_Stats reçoit une requête pour un joueur, THE Système_Stats SHALL
   compter le nombre total de reviews dans la table `game_reviews` pour ce
   joueur
2. WHEN un joueur n'a écrit aucune review, THE Système_Stats SHALL retourner un
   compteur de reviews de 0
3. THE Système_Stats SHALL retourner également la note moyenne attribuée par le
   joueur à travers toutes ses reviews

### Exigence 4 : Affichage des statistiques enrichies sur le profil

**User Story :** En tant que visiteur, je veux voir les statistiques enrichies
sur le profil d'un joueur, afin de mieux connaître son activité de jeu.

#### Critères d'acceptation

1. WHEN un visiteur accède à la page de profil d'un joueur, THE Système_Stats
   SHALL afficher une section « Statistiques » contenant le temps de jeu total,
   le Genre_Favori, et le nombre de reviews écrites
2. WHEN le Genre_Favori est nul, THE Système_Stats SHALL afficher un message
   indiquant qu'aucun genre favori n'est disponible
3. WHEN les statistiques sont en cours de chargement, THE Système_Stats SHALL
   afficher un skeleton de chargement dans la section statistiques
4. THE Système_Stats SHALL formater le temps de jeu total de manière lisible (ex
   : « 1 234,5 h » avec séparateur de milliers selon la locale)

### Exigence 5 : Résumé annuel — Données

**User Story :** En tant que joueur, je veux obtenir un résumé de mon année de
jeu, afin de revivre mes moments forts de l'année.

#### Critères d'acceptation

1. WHEN l'API_Résumé reçoit une requête pour un joueur et une année, THE
   Système_Stats SHALL calculer les statistiques uniquement à partir des entrées
   de la Bibliothèque ajoutées durant l'année spécifiée (basé sur le champ
   `added_at`)
2. THE Système_Stats SHALL inclure dans le Résumé_Annuel : le temps de jeu total
   de l'année, le nombre de jeux ajoutés, le Genre_Favori de l'année, le jeu
   avec le plus de temps de jeu, et le nombre de reviews écrites durant l'année
3. WHEN un joueur n'a aucune activité pour l'année demandée, THE Système_Stats
   SHALL retourner un Résumé_Annuel avec toutes les valeurs à zéro ou nulles
4. WHEN l'API_Résumé reçoit une année future, THE Système_Stats SHALL retourner
   une erreur 400 avec un message descriptif
5. THE Système_Stats SHALL inclure dans le Résumé_Annuel le mois le plus actif
   (mois avec le plus de jeux ajoutés) et le nombre de jeux ajoutés ce mois-là

### Exigence 6 : Résumé annuel — Affichage

**User Story :** En tant que joueur, je veux voir mon résumé annuel dans une
page dédiée avec un design engageant, afin de partager et revivre mon année de
jeu.

#### Critères d'acceptation

1. WHEN un utilisateur accède à la route `/[locale]/players/[id]/year/[year]`,
   THE Système_Stats SHALL afficher la page du Résumé_Annuel pour le joueur et
   l'année spécifiés
2. THE Résumé_Annuel SHALL afficher les données sous forme de cartes visuelles
   avec des icônes et des couleurs distinctes pour chaque statistique
3. WHEN le joueur consulté n'existe pas, THE Système_Stats SHALL afficher une
   page 404
4. WHEN l'année demandée ne contient aucune donnée, THE Système_Stats SHALL
   afficher un message invitant le joueur à jouer davantage
5. THE Résumé_Annuel SHALL afficher un lien de retour vers le profil du joueur

### Exigence 7 : Lien vers le résumé annuel depuis le profil

**User Story :** En tant que visiteur, je veux accéder facilement au résumé
annuel d'un joueur depuis son profil, afin de consulter ses statistiques
annuelles.

#### Critères d'acceptation

1. WHEN un visiteur consulte le profil d'un joueur, THE Système_Stats SHALL
   afficher un lien vers le Résumé_Annuel de l'année en cours
2. WHEN l'année en cours n'a aucune donnée, THE Système_Stats SHALL afficher le
   lien vers la dernière année ayant des données disponibles
3. IF aucune année n'a de données, THEN THE Système_Stats SHALL masquer le lien
   vers le Résumé_Annuel

### Exigence 8 : Confidentialité des statistiques

**User Story :** En tant que joueur, je veux contrôler la visibilité de mes
statistiques, afin de protéger ma vie privée.

#### Critères d'acceptation

1. THE Système_Stats SHALL rendre les Stats_Enrichies publiques par défaut pour
   tous les joueurs
2. WHEN un joueur configure ses statistiques comme privées, THE Système_Stats
   SHALL masquer les Stats_Enrichies et le Résumé_Annuel pour les visiteurs
3. WHEN un joueur authentifié consulte son propre profil, THE Système_Stats
   SHALL afficher les Stats_Enrichies indépendamment du réglage de
   confidentialité
4. THE Système_Stats SHALL stocker le réglage de confidentialité dans la table
   `profiles` via une colonne dédiée

### Exigence 9 : Internationalisation

**User Story :** En tant qu'utilisateur, je veux voir les statistiques dans ma
langue, afin d'avoir une expérience cohérente.

#### Critères d'acceptation

1. THE Système_Stats SHALL supporter les locales `fr` et `en` pour tous les
   textes affichés
2. THE Système_Stats SHALL utiliser les fichiers de traduction existants
   (`src/messages/fr.json`, `src/messages/en.json`)
3. THE Système_Stats SHALL afficher les noms de genres dans la locale appropriée
4. THE Système_Stats SHALL formater les nombres selon la locale (séparateur de
   milliers, décimales)

### Exigence 10 : Gestion des erreurs

**User Story :** En tant qu'utilisateur, je veux voir des messages d'erreur
clairs en cas de problème, afin de comprendre ce qui s'est passé.

#### Critères d'acceptation

1. IF une erreur réseau survient lors du chargement des statistiques, THEN THE
   Système_Stats SHALL afficher un message d'erreur avec option de réessayer
2. IF le joueur demandé n'existe pas, THEN THE Système_Stats SHALL retourner une
   erreur 404
3. IF l'API_Stats reçoit un identifiant de joueur invalide, THEN THE
   Système_Stats SHALL retourner une erreur 400 avec un message descriptif
