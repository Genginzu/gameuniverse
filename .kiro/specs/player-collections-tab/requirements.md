# Document d'Exigences — Onglet Collections du Profil Joueur

## Introduction

L'onglet « Collections » du profil d'un joueur affiche la liste complète des
collections de jeux créées par ce joueur sur la plateforme Game Universe.
L'onglet « collections » existe déjà dans la navigation par onglets
(`PlayerProfileTabs`) et affiche actuellement un aperçu limité à 4 collections
via le composant `PlayerCollections`. Cette fonctionnalité vise à transformer
cet aperçu en un onglet complet avec pagination, tri, statistiques agrégées et
gestion de la visibilité (collections publiques/privées selon le visiteur).

## Glossaire

- **Collections_Tab** : Composant principal qui affiche la liste complète des
  collections d'un joueur dans l'onglet « Collections » de son profil.
- **Collections_API** : Endpoint API existant (`/api/players/[id]/collections`)
  qui retourne les collections d'un joueur, à enrichir avec pagination et tri.
- **Collections_Service** : Service côté client qui communique avec la
  Collections_API pour l'onglet Collections.
- **Collection_Card** : Composant existant (`CollectionCard`) qui affiche une
  collection individuelle avec couverture, nom, description et nombre de jeux.
- **Collections_Stats** : Bloc de statistiques agrégées sur les collections du
  joueur (nombre total, nombre total de jeux, collection la plus grande).
- **Player_Profile** : Page de profil d'un joueur existante, contenant les
  onglets de navigation.
- **Joueur_Cible** : Le joueur dont le profil est consulté.
- **Visiteur** : Tout utilisateur (authentifié ou non) qui consulte le profil
  d'un Joueur_Cible.
- **Propriétaire** : Le Joueur_Cible lorsqu'il consulte son propre profil
  (authentifié avec le même identifiant).

## Exigences

### Exigence 1 : Enrichissement de l'endpoint API des collections

**User Story :** En tant que développeur front-end, je veux que l'endpoint API
des collections supporte la pagination et le tri, afin de pouvoir alimenter
l'onglet Collections complet.

#### Critères d'acceptation

1. WHEN un Visiteur requête les collections d'un Joueur_Cible, THE
   Collections_API SHALL retourner les collections triées par date de mise à
   jour décroissante (du plus récent au plus ancien) par défaut.
2. WHEN un paramètre `page` est fourni, THE Collections_API SHALL retourner la
   page correspondante avec un maximum de 12 collections par page.
3. WHEN aucun paramètre `page` n'est fourni, THE Collections_API SHALL retourner
   la première page de résultats.
4. THE Collections_API SHALL inclure les informations de pagination dans la
   réponse (page courante, nombre total de pages, nombre total de collections,
   indicateur de page suivante).
5. WHEN un paramètre `sort` est fourni avec la valeur « name_asc » ou «
   name_desc », THE Collections_API SHALL trier les collections par nom
   alphabétique croissant ou décroissant respectivement.
6. WHEN un paramètre `sort` est fourni avec la valeur « games_count_desc », THE
   Collections_API SHALL trier les collections par nombre de jeux décroissant.
7. THE Collections_API SHALL inclure dans la réponse les statistiques agrégées
   du joueur : nombre total de collections, nombre total de jeux dans toutes les
   collections, et nom de la collection contenant le plus de jeux.
8. WHEN le Visiteur est le Propriétaire, THE Collections_API SHALL retourner
   toutes les collections (publiques et privées).
9. WHEN le Visiteur n'est pas le Propriétaire, THE Collections_API SHALL
   retourner uniquement les collections publiques.
10. IF le Joueur_Cible n'existe pas, THEN THE Collections_API SHALL retourner
    une erreur 404 avec un message descriptif.

### Exigence 2 : Affichage de la liste des collections

**User Story :** En tant que visiteur, je veux voir la liste complète des
collections d'un joueur dans l'onglet Collections de son profil, afin de
découvrir ses sélections de jeux.

#### Critères d'acceptation

1. WHEN le Visiteur sélectionne l'onglet « Collections », THE Collections_Tab
   SHALL afficher la liste complète des collections du Joueur_Cible sous forme
   de grille de cartes.
2. THE Collections_Tab SHALL afficher chaque collection via le composant
   Collection_Card existant, incluant le nom, la description, le nombre de jeux,
   les images de couverture et la date de mise à jour.
3. THE Collections_Tab SHALL afficher la grille de collections en 2 colonnes sur
   mobile, 3 colonnes sur tablette et 4 colonnes sur desktop.
4. WHEN le Visiteur fait défiler la liste jusqu'en bas, THE Collections_Tab
   SHALL charger automatiquement la page suivante de collections (scroll
   infini).
5. WHILE les collections sont en cours de chargement, THE Collections_Tab SHALL
   afficher un indicateur de chargement (skeleton) reprenant la forme des
   Collection_Card.
6. IF le Joueur_Cible n'a aucune collection visible, THEN THE Collections_Tab
   SHALL afficher un message indiquant l'absence de collections.

### Exigence 3 : Statistiques des collections du joueur

**User Story :** En tant que visiteur, je veux voir un résumé statistique des
collections d'un joueur, afin d'avoir une vue d'ensemble de ses sélections.

#### Critères d'acceptation

1. THE Collections_Stats SHALL afficher le nombre total de collections du
   Joueur_Cible.
2. THE Collections_Stats SHALL afficher le nombre total de jeux répartis dans
   toutes les collections du Joueur_Cible.
3. THE Collections_Stats SHALL afficher le nom de la collection contenant le
   plus de jeux.
4. THE Collections_Stats SHALL être affiché en haut de l'onglet Collections,
   avant la liste des collections.
5. THE Collections_Stats SHALL utiliser les classes glassmorphism existantes
   (`.glass-card`, fonds semi-transparents) pour les cartes de statistiques.

### Exigence 4 : Tri des collections

**User Story :** En tant que visiteur, je veux pouvoir trier les collections
d'un joueur, afin de trouver rapidement celles qui m'intéressent.

#### Critères d'acceptation

1. THE Collections_Tab SHALL afficher un sélecteur de tri avec les options : «
   Plus récentes » (par défaut), « Nom A-Z », « Nom Z-A », « Plus de jeux ».
2. WHEN le Visiteur sélectionne une option de tri, THE Collections_Tab SHALL
   réordonner la liste des collections selon le critère choisi.
3. THE Collections_Tab SHALL conserver le tri actif lors du chargement de pages
   supplémentaires (scroll infini).

### Exigence 5 : Visibilité des collections privées

**User Story :** En tant que propriétaire de mon profil, je veux voir mes
collections privées dans l'onglet Collections, afin de gérer l'ensemble de mes
sélections.

#### Critères d'acceptation

1. WHEN le Visiteur est le Propriétaire, THE Collections_Tab SHALL afficher
   toutes les collections, y compris les collections privées.
2. WHEN le Visiteur est le Propriétaire, THE Collections_Tab SHALL afficher un
   badge de visibilité (« Public » ou « Privé ») sur chaque Collection_Card.
3. WHEN le Visiteur n'est pas le Propriétaire, THE Collections_Tab SHALL
   afficher uniquement les collections publiques du Joueur_Cible.
4. WHEN le Visiteur n'est pas le Propriétaire, THE Collections_Tab SHALL masquer
   les badges de visibilité sur les Collection_Card.

### Exigence 6 : Service client des collections joueur

**User Story :** En tant que développeur front-end, je veux un service client
qui encapsule les appels à l'API des collections avec pagination et tri, afin de
centraliser la logique de communication pour l'onglet complet.

#### Critères d'acceptation

1. THE Collections_Service SHALL exposer une méthode pour récupérer les
   collections d'un joueur avec pagination et tri optionnel.
2. THE Collections_Service SHALL exposer une méthode pour récupérer les
   statistiques agrégées des collections d'un joueur.
3. IF l'appel API échoue, THEN THE Collections_Service SHALL propager une erreur
   avec un message descriptif.
4. THE Collections_Service SHALL utiliser les alias de chemins (`@/`) pour les
   imports, conformément à la configuration Vitest et Next.js du projet.

### Exigence 7 : Internationalisation

**User Story :** En tant que visiteur francophone ou anglophone, je veux que
l'onglet Collections soit traduit dans ma langue, afin de comprendre le contenu
affiché.

#### Critères d'acceptation

1. THE Collections_Tab SHALL utiliser les clés de traduction `next-intl` pour
   tous les libellés affichés (titre, options de tri, messages vides,
   statistiques, badges de visibilité).
2. THE Collections_Tab SHALL formater les dates de mise à jour selon la locale
   courante du Visiteur.
3. THE Collections_Tab SHALL ajouter les nouvelles clés de traduction dans les
   deux fichiers de langue (`fr.json` et `en.json`) simultanément.

### Exigence 8 : Design et accessibilité

**User Story :** En tant que visiteur, je veux que l'onglet Collections respecte
le design glassmorphism du site et soit accessible, afin d'avoir une expérience
cohérente et inclusive.

#### Critères d'acceptation

1. THE Collections_Tab SHALL utiliser les classes glassmorphism existantes
   (`.glass-card`, fonds semi-transparents, `backdrop-blur-xl`) pour le bloc de
   statistiques et les éléments d'interface.
2. THE Collections_Tab SHALL supporter le dark mode via les préfixes Tailwind
   `dark:`.
3. THE Collections_Tab SHALL utiliser des attributs ARIA appropriés pour la
   grille de collections (`role="feed"`, `aria-busy`, `aria-label`).
4. THE Collections_Tab SHALL être navigable au clavier (les liens vers les
   collections sont focusables et activables via Entrée).
5. WHILE une page supplémentaire est en cours de chargement, THE Collections_Tab
   SHALL indiquer l'état de chargement via `aria-busy="true"`.
