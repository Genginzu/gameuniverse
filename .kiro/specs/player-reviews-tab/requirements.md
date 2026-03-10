# Document d'Exigences — Onglet Avis du Profil Joueur

## Introduction

L'onglet « Avis » du profil d'un joueur affiche la liste de toutes les reviews
de jeux rédigées par ce joueur sur la plateforme Game Universe. L'onglet «
reviews » existe déjà dans la navigation par onglets (`PlayerProfileTabs`) mais
n'a pas encore de contenu. Cette fonctionnalité permet aux visiteurs de
consulter l'historique des avis d'un joueur, avec sa note moyenne, ses
statistiques de reviews, et la possibilité de trier et filtrer les avis.

## Glossaire

- **Reviews_Tab** : Composant principal qui affiche la liste des avis d'un
  joueur dans l'onglet « Avis » de son profil.
- **Reviews_API** : Endpoint API qui retourne les avis rédigés par un joueur
  donné, avec pagination.
- **Reviews_Service** : Service côté client qui communique avec la Reviews_API.
- **Review_Card** : Composant d'affichage d'un avis individuel dans le contexte
  du profil joueur, incluant le nom du jeu, la note, le contenu et les points
  positifs/négatifs.
- **Reviews_Stats** : Bloc de statistiques agrégées sur les avis du joueur
  (nombre total, note moyenne, distribution des notes).
- **Player_Profile** : Page de profil d'un joueur existante, contenant les
  onglets de navigation.
- **Joueur_Cible** : Le joueur dont le profil est consulté.
- **Visiteur** : Tout utilisateur (authentifié ou non) qui consulte le profil
  d'un Joueur_Cible.

## Exigences

### Exigence 1 : Endpoint API des avis d'un joueur

**User Story :** En tant que développeur front-end, je veux un endpoint API qui
retourne les avis rédigés par un joueur, afin de pouvoir alimenter l'onglet Avis
de son profil.

#### Critères d'acceptation

1. WHEN un Visiteur requête les avis d'un Joueur_Cible, THE Reviews_API SHALL
   retourner les avis triés par date de création décroissante (du plus récent au
   plus ancien).
2. THE Reviews_API SHALL retourner pour chaque avis : l'identifiant, le nom du
   jeu, le slug du jeu, l'image de couverture du jeu, la note (sur 20), le
   contenu HTML, les points positifs, les points négatifs, la date de création
   et la date de mise à jour.
3. WHEN un paramètre `page` est fourni, THE Reviews_API SHALL retourner la page
   correspondante avec un maximum de 10 avis par page.
4. THE Reviews_API SHALL inclure dans la réponse les statistiques agrégées du
   joueur : nombre total d'avis, note moyenne attribuée, et distribution des
   notes par tranche (0-5, 6-10, 11-15, 16-20).
5. THE Reviews_API SHALL inclure les informations de pagination dans la réponse
   (page courante, nombre total de pages, indicateur de page suivante).
6. IF le Joueur_Cible n'existe pas, THEN THE Reviews_API SHALL retourner une
   erreur 404 avec un message descriptif.
7. WHEN un paramètre `sort` est fourni avec la valeur « rating_desc » ou «
   rating_asc », THE Reviews_API SHALL trier les avis par note décroissante ou
   croissante respectivement.

### Exigence 2 : Affichage de la liste des avis

**User Story :** En tant que visiteur, je veux voir la liste des avis rédigés
par un joueur dans l'onglet Avis de son profil, afin de connaître ses opinions
sur les jeux.

#### Critères d'acceptation

1. WHEN le Visiteur sélectionne l'onglet « Avis », THE Reviews_Tab SHALL
   afficher la liste des avis du Joueur_Cible.
2. THE Reviews_Tab SHALL afficher chaque Review_Card avec le nom du jeu (lien
   cliquable vers la page du jeu), l'image de couverture du jeu, la note sur 20
   avec un code couleur, un extrait du contenu de la review, les points positifs
   et négatifs, et la date de publication.
3. WHEN le Visiteur fait défiler la liste jusqu'en bas, THE Reviews_Tab SHALL
   charger automatiquement la page suivante d'avis (scroll infini).
4. WHILE les avis sont en cours de chargement, THE Reviews_Tab SHALL afficher un
   indicateur de chargement (skeleton).
5. IF le Joueur_Cible n'a rédigé aucun avis, THEN THE Reviews_Tab SHALL afficher
   un message indiquant l'absence d'avis.

### Exigence 3 : Statistiques des avis du joueur

**User Story :** En tant que visiteur, je veux voir un résumé statistique des
avis d'un joueur, afin d'avoir une vue d'ensemble de ses habitudes de notation.

#### Critères d'acceptation

1. THE Reviews_Stats SHALL afficher le nombre total d'avis rédigés par le
   Joueur_Cible.
2. THE Reviews_Stats SHALL afficher la note moyenne attribuée par le
   Joueur_Cible, avec un code couleur cohérent avec le système de notation
   existant (fonction `getRatingColor`).
3. THE Reviews_Stats SHALL afficher la distribution des notes sous forme de
   barres horizontales réparties en 4 tranches : 0-5, 6-10, 11-15, 16-20.
4. THE Reviews_Stats SHALL être affiché en haut de l'onglet Avis, avant la liste
   des avis.

### Exigence 4 : Tri des avis

**User Story :** En tant que visiteur, je veux pouvoir trier les avis d'un
joueur par date ou par note, afin de trouver rapidement les informations qui
m'intéressent.

#### Critères d'acceptation

1. THE Reviews_Tab SHALL afficher un sélecteur de tri avec les options : « Plus
   récents » (par défaut), « Plus anciens », « Meilleures notes », « Notes les
   plus basses ».
2. WHEN le Visiteur sélectionne une option de tri, THE Reviews_Tab SHALL
   réordonner la liste des avis selon le critère choisi.
3. THE Reviews_Tab SHALL conserver le tri actif lors du chargement de pages
   supplémentaires (scroll infini).

### Exigence 5 : Service client des avis joueur

**User Story :** En tant que développeur front-end, je veux un service client
qui encapsule les appels à l'API des avis d'un joueur, afin de centraliser la
logique de communication.

#### Critères d'acceptation

1. THE Reviews_Service SHALL exposer une méthode pour récupérer les avis d'un
   joueur avec pagination et tri optionnel.
2. IF l'appel API échoue, THEN THE Reviews_Service SHALL propager une erreur
   avec un message descriptif.
3. THE Reviews_Service SHALL utiliser les alias de chemins (`@/`) pour les
   imports, conformément à la configuration Vitest et Next.js du projet.

### Exigence 6 : Internationalisation

**User Story :** En tant que visiteur francophone ou anglophone, je veux que
l'onglet Avis soit traduit dans ma langue, afin de comprendre le contenu
affiché.

#### Critères d'acceptation

1. THE Reviews_Tab SHALL utiliser les clés de traduction `next-intl` pour tous
   les libellés affichés (titre, options de tri, messages vides, statistiques,
   libellés de tranches de notes).
2. THE Reviews_Tab SHALL formater les dates de publication selon la locale
   courante du Visiteur.
3. THE Reviews_Tab SHALL ajouter les nouvelles clés de traduction dans les deux
   fichiers de langue (`fr.json` et `en.json`) simultanément.

### Exigence 7 : Design et accessibilité

**User Story :** En tant que visiteur, je veux que l'onglet Avis respecte le
design glassmorphism du site et soit accessible, afin d'avoir une expérience
cohérente et inclusive.

#### Critères d'acceptation

1. THE Reviews_Tab SHALL utiliser les classes glassmorphism existantes
   (`.glass-card`, fonds semi-transparents, `backdrop-blur-xl`) pour les cartes
   d'avis et le bloc de statistiques.
2. THE Reviews_Tab SHALL supporter le dark mode via les préfixes Tailwind
   `dark:`.
3. THE Reviews_Tab SHALL utiliser des attributs ARIA appropriés pour la liste
   d'avis (`role="feed"`, `aria-busy`, `aria-label`).
4. THE Reviews_Tab SHALL être navigable au clavier (les liens vers les jeux sont
   focusables et activables via Entrée).
5. WHILE une page supplémentaire est en cours de chargement, THE Reviews_Tab
   SHALL indiquer l'état de chargement via `aria-busy="true"`.
