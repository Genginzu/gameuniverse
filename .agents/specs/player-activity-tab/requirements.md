# Document de Exigences — Onglet Activité du Profil Joueur

## Introduction

L'onglet « Activité » du profil d'un joueur affiche un flux chronologique de
toutes les actions réalisées par ce joueur sur la plateforme Game Universe. Ce
flux agrège les reviews de jeux, les commentaires sur les personnages, les
ajouts de jeux à la bibliothèque, les temps de jeu renseignés, les personnages
mis en favoris et les collections créées. L'onglet « activity » existe déjà dans
la navigation par onglets (`PlayerProfileTabs`) mais n'a pas encore de contenu.

## Glossaire

- **Activity_Feed** : Composant principal qui affiche la liste chronologique des
  événements d'activité d'un joueur.
- **Activity_Item** : Un événement unique dans le flux d'activité (review,
  commentaire, ajout bibliothèque, temps de jeu, favori personnage, collection
  créée).
- **Activity_API** : Endpoint API qui agrège et retourne les événements
  d'activité d'un joueur avec pagination.
- **Activity_Service** : Service côté client qui communique avec l'Activity_API.
- **Player_Profile** : Page de profil d'un joueur existante, contenant les
  onglets de navigation.
- **Joueur_Cible** : Le joueur dont le profil est consulté.
- **Visiteur** : Tout utilisateur (authentifié ou non) qui consulte le profil
  d'un Joueur_Cible.

## Exigences

### Exigence 1 : Endpoint API d'activité

**User Story :** En tant que développeur front-end, je veux un endpoint API qui
retourne les événements d'activité d'un joueur, afin de pouvoir alimenter le
flux d'activité.

#### Critères d'acceptation

1. WHEN un Visiteur requête l'activité d'un Joueur_Cible, THE Activity_API SHALL
   retourner les événements d'activité triés par date décroissante (du plus
   récent au plus ancien).
2. THE Activity_API SHALL agréger les événements provenant des tables
   `game_reviews`, `character_comments`, `user_library`, `character_favorites`
   et `game_collections`.
3. WHEN un paramètre `page` est fourni, THE Activity_API SHALL retourner la page
   correspondante avec un maximum de 20 événements par page.
4. THE Activity_API SHALL retourner pour chaque événement : le type d'événement,
   la date, et les données contextuelles associées (nom du jeu, nom du
   personnage, note attribuée, contenu du commentaire, statut bibliothèque,
   etc.).
5. IF le Joueur_Cible n'existe pas, THEN THE Activity_API SHALL retourner une
   erreur 404 avec un message descriptif.
6. THE Activity_API SHALL inclure les informations de pagination dans la réponse
   (page courante, nombre total de pages, indicateur de page suivante).

### Exigence 2 : Affichage du flux d'activité

**User Story :** En tant que visiteur, je veux voir le flux d'activité d'un
joueur dans l'onglet Activité de son profil, afin de connaître ses actions
récentes sur la plateforme.

#### Critères d'acceptation

1. WHEN le Visiteur sélectionne l'onglet « Activité », THE Activity_Feed SHALL
   afficher la liste des événements d'activité du Joueur_Cible.
2. THE Activity_Feed SHALL afficher chaque Activity_Item avec une icône
   distincte selon le type d'événement (review, commentaire, ajout bibliothèque,
   temps de jeu, favori, collection).
3. THE Activity_Feed SHALL afficher la date relative de chaque événement (ex : «
   il y a 2 heures », « il y a 3 jours »).
4. WHEN le Visiteur fait défiler la liste jusqu'en bas, THE Activity_Feed SHALL
   charger automatiquement la page suivante d'événements (scroll infini).
5. WHILE les événements sont en cours de chargement, THE Activity_Feed SHALL
   afficher un indicateur de chargement (skeleton).
6. IF le Joueur_Cible n'a aucune activité, THEN THE Activity_Feed SHALL afficher
   un message indiquant l'absence d'activité.

### Exigence 3 : Types d'événements d'activité

**User Story :** En tant que visiteur, je veux voir les différents types
d'activité d'un joueur avec des informations pertinentes, afin de comprendre ce
qu'il fait sur la plateforme.

#### Critères d'acceptation

1. WHEN un événement est de type « review publiée », THE Activity_Item SHALL
   afficher le nom du jeu, la note attribuée (sur 20) et un extrait du contenu
   de la review.
2. WHEN un événement est de type « commentaire publié », THE Activity_Item SHALL
   afficher le nom du personnage commenté et un extrait du contenu du
   commentaire.
3. WHEN un événement est de type « jeu ajouté à la bibliothèque », THE
   Activity_Item SHALL afficher le nom du jeu, son image de couverture et le
   statut attribué (possédé, liste de souhaits, terminé, en cours).
4. WHEN un événement est de type « temps de jeu renseigné », THE Activity_Item
   SHALL afficher le nom du jeu et les durées renseignées (rapide, normal,
   complétionniste).
5. WHEN un événement est de type « personnage mis en favori », THE Activity_Item
   SHALL afficher le nom du personnage.
6. WHEN un événement est de type « collection créée », THE Activity_Item SHALL
   afficher le nom de la collection et le nombre de jeux qu'elle contient.
7. THE Activity_Item SHALL rendre le nom du jeu ou du personnage cliquable,
   redirigeant vers la page de détail correspondante.

### Exigence 4 : Filtrage par type d'activité

**User Story :** En tant que visiteur, je veux pouvoir filtrer le flux
d'activité par type d'événement, afin de trouver rapidement les informations qui
m'intéressent.

#### Critères d'acceptation

1. THE Activity_Feed SHALL afficher des boutons de filtre permettant de
   sélectionner un ou plusieurs types d'événements (tous, reviews, commentaires,
   bibliothèque, temps de jeu, favoris, collections).
2. WHEN le Visiteur sélectionne un filtre, THE Activity_Feed SHALL afficher
   uniquement les événements correspondant au type sélectionné.
3. WHEN le filtre « tous » est sélectionné, THE Activity_Feed SHALL afficher
   tous les types d'événements.
4. THE Activity_Feed SHALL conserver le filtre actif lors du chargement de pages
   supplémentaires (scroll infini).
5. WHEN un filtre est actif et qu'aucun événement ne correspond, THE
   Activity_Feed SHALL afficher un message indiquant l'absence de résultats pour
   ce filtre.

### Exigence 5 : Service client d'activité

**User Story :** En tant que développeur front-end, je veux un service client
qui encapsule les appels à l'API d'activité, afin de centraliser la logique de
communication.

#### Critères d'acceptation

1. THE Activity_Service SHALL exposer une méthode pour récupérer les événements
   d'activité d'un joueur avec pagination et filtre optionnel par type.
2. IF l'appel API échoue, THEN THE Activity_Service SHALL propager une erreur
   avec un message descriptif.
3. THE Activity_Service SHALL utiliser les alias de chemins (`@/`) pour les
   imports, conformément à la configuration Vitest et Next.js du projet.

### Exigence 6 : Internationalisation

**User Story :** En tant que visiteur francophone ou anglophone, je veux que
l'onglet Activité soit traduit dans ma langue, afin de comprendre le contenu
affiché.

#### Critères d'acceptation

1. THE Activity_Feed SHALL utiliser les clés de traduction `next-intl` pour tous
   les libellés affichés (types d'événements, dates relatives, messages vides,
   libellés de filtres).
2. THE Activity_Feed SHALL afficher les noms de jeux et de personnages dans la
   locale courante du Visiteur.
3. THE Activity_Feed SHALL formater les dates relatives selon la locale courante
   du Visiteur.

### Exigence 7 : Performance et accessibilité

**User Story :** En tant que visiteur, je veux que l'onglet Activité se charge
rapidement et soit accessible, afin d'avoir une expérience fluide et inclusive.

#### Critères d'acceptation

1. THE Activity_Feed SHALL charger la première page d'événements en une seule
   requête API.
2. THE Activity_Feed SHALL utiliser des attributs ARIA appropriés pour la liste
   d'événements (`role="feed"`, `aria-busy`, `aria-label`).
3. THE Activity_Feed SHALL être navigable au clavier (les liens vers les jeux et
   personnages sont focusables et activables via Entrée).
4. WHILE une page supplémentaire est en cours de chargement, THE Activity_Feed
   SHALL indiquer l'état de chargement via `aria-busy="true"`.
