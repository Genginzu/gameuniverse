# Document d'Exigences — Navigation Sidebar

## Introduction

L'application Game Universe utilise actuellement une barre de navigation
horizontale (GamingNavBar) intégrée au header, mise en place lors de la refonte
UI gaming (spec `gaming-ui-redesign`). L'utilisateur souhaite transformer cette
navigation horizontale en une sidebar latérale, tout en conservant l'esthétique
gaming/néon établie lors de la refonte. La sidebar doit offrir une navigation
plus ergonomique et visuellement cohérente avec l'identité gaming du site.

## Glossaire

- **Sidebar** : Le panneau de navigation latéral fixe affiché à gauche de
  l'écran sur desktop (≥1024px)
- **Header** : (Supprimé) Ancienne barre supérieure de l'espace connecté,
  désormais entièrement remplacée par la sidebar
- **Système_de_Navigation** : L'ensemble des composants de navigation (sidebar,
  header, overlay mobile)
- **Overlay_Mobile** : Le panneau de navigation plein écran affiché sur mobile
  (<1024px) en remplacement de la sidebar
- **Espace_Connecté** : L'ensemble des pages accessibles après authentification
  (dashboard, bibliothèque, collections, favoris, profil)
- **Indicateur_Actif** : L'élément visuel néon signalant le lien de navigation
  actuellement sélectionné
- **Panneau_Glass** : Tout conteneur utilisant les classes glassmorphism
  (`glass`, `glass-sidebar`, etc.)
- **Overlay_Recherche** : Le panneau modal centré contenant la barre de
  recherche globale, affiché par-dessus la page courante avec un style
  glassmorphism gaming

## Exigences

### Exigence 1 : Remplacement de la navigation horizontale par une sidebar

**User Story :** En tant que joueur, je veux une sidebar latérale pour naviguer
dans l'application, pour avoir un accès permanent et visible aux sections
principales sans encombrer le header.

#### Critères d'acceptation

1. THE Système_de_Navigation SHALL remplacer la barre de navigation horizontale
   (GamingNavBar) par une sidebar latérale fixe positionnée à gauche de l'écran
2. THE Sidebar SHALL afficher les cinq liens de navigation principaux
   (Dashboard, Bibliothèque, Favoris, Collections, Profil) sous forme d'icônes
   accompagnées de labels textuels
3. THE Sidebar SHALL afficher une section de liens publics (Jeux, Personnages,
   Joueurs) en dessous des liens de navigation principaux, séparée par une
   bordure subtile
4. THE Sidebar SHALL utiliser le style glassmorphism existant (classe
   `glass-sidebar`) avec les accents néon (bordures et glow violet/cyan) établis
   lors de la refonte gaming
5. THE Sidebar SHALL occuper toute la hauteur de l'écran (100vh) avec une
   largeur fixe de 256px (w-64) sur desktop
6. THE Sidebar SHALL afficher le logo Game Universe et le nom de l'application
   dans sa partie supérieure

### Exigence 2 : Indicateur de navigation active avec style néon

**User Story :** En tant que joueur, je veux voir clairement quelle section est
active dans la sidebar, pour savoir où je me trouve dans l'application.

#### Critères d'acceptation

1. WHEN un lien de navigation est actif, THE Sidebar SHALL afficher un
   indicateur visuel néon (fond lumineux violet avec glow) sur le lien
   correspondant
2. WHEN un lien de navigation est actif, THE Sidebar SHALL afficher une bordure
   latérale gauche néon lumineuse sur le lien actif
3. WHEN un lien de navigation est survolé, THE Sidebar SHALL afficher un effet
   de glow subtil autour du lien
4. THE Sidebar SHALL garantir qu'un seul lien de navigation affiche l'indicateur
   actif à un instant donné

### Exigence 3 : Suppression du header connecté

**User Story :** En tant que joueur, je veux que le header de l'espace connecté
soit entièrement supprimé, pour que la sidebar soit le seul point de navigation
et que le contenu principal occupe tout l'espace disponible.

#### Critères d'acceptation

1. THE DashboardHeader SHALL être entièrement supprimé du layout de l'espace
   connecté
2. THE Espace_Connecté SHALL afficher le contenu principal directement à côté de
   la sidebar, sans barre supérieure
3. THE composant `DashboardHeader.tsx` SHALL être supprimé du code source après
   migration

### Exigence 4 : Adaptation du layout avec sidebar

**User Story :** En tant que joueur, je veux que le contenu principal s'adapte à
la présence de la sidebar, pour que l'affichage soit cohérent et sans
chevauchement.

#### Critères d'acceptation

1. THE Espace_Connecté SHALL utiliser un layout flex horizontal avec la sidebar
   à gauche et le contenu principal à droite
2. THE Espace_Connecté SHALL afficher le contenu principal dans l'espace restant
   après la sidebar (flex-1), occupant toute la hauteur disponible
3. THE Espace_Connecté SHALL conserver le fond animé gaming (classe
   `dashboard-bg`) sur l'ensemble de la page

### Exigence 5 : Navigation mobile avec overlay

**User Story :** En tant que joueur sur mobile, je veux accéder à la navigation
via un menu overlay, pour naviguer confortablement sur petit écran.

#### Critères d'acceptation

1. WHILE l'écran a une largeur inférieure à 1024px, THE Sidebar SHALL être
   masquée
2. WHILE l'écran a une largeur inférieure à 1024px, THE Système_de_Navigation
   SHALL afficher un bouton hamburger flottant en position fixe (coin supérieur
   gauche) visible uniquement sur mobile
3. WHEN le bouton hamburger est activé, THE Overlay_Mobile SHALL s'afficher en
   plein écran avec les liens de navigation et le bouton « Recherche » stylisés
   en mode gaming néon
4. WHEN le bouton « Recherche » est activé dans l'overlay mobile, THE
   Overlay_Recherche SHALL s'ouvrir par-dessus l'overlay mobile
5. WHEN un lien de navigation est sélectionné dans l'overlay, THE Overlay_Mobile
   SHALL se fermer automatiquement
6. WHEN l'utilisateur clique sur le fond semi-transparent de l'overlay, THE
   Overlay_Mobile SHALL se fermer

### Exigence 6 : Section utilisateur dans la sidebar

**User Story :** En tant que joueur, je veux voir mes informations utilisateur
dans la sidebar, pour avoir un accès rapide à mon profil et aux actions de
compte.

#### Critères d'acceptation

1. THE Sidebar SHALL afficher une section utilisateur en bas de la sidebar,
   séparée de la navigation par une bordure
2. THE Sidebar SHALL afficher l'avatar de l'utilisateur (icône avec dégradé
   violet/bleu) et son nom d'affichage dans la section utilisateur
3. WHEN la section utilisateur est cliquée, THE Sidebar SHALL afficher un menu
   déroulant avec les options de changement de langue (LanguageSwitcher),
   changement de thème, accès aux paramètres et déconnexion

### Exigence 7 : Accessibilité de la sidebar

**User Story :** En tant que joueur utilisant un clavier ou un lecteur d'écran,
je veux que la sidebar soit entièrement accessible, pour naviguer dans
l'application sans souris.

#### Critères d'acceptation

1. THE Sidebar SHALL utiliser les attributs ARIA appropriés (`nav`,
   `aria-label`) pour identifier la zone de navigation
2. WHEN un lien de navigation reçoit le focus clavier, THE Sidebar SHALL
   afficher un anneau de focus néon violet visible
3. THE Overlay_Mobile SHALL utiliser les attributs `role="dialog"` et
   `aria-modal="true"` pour signaler sa nature modale aux technologies
   d'assistance
4. WHEN l'overlay mobile est ouvert, THE Overlay_Mobile SHALL capturer le focus
   à l'intérieur du panneau de navigation

### Exigence 8 : Respect de prefers-reduced-motion

**User Story :** En tant que joueur sensible aux animations, je veux que les
effets de glow et les transitions de la sidebar respectent mes préférences
système, pour utiliser l'application confortablement.

#### Critères d'acceptation

1. WHEN l'utilisateur a activé `prefers-reduced-motion`, THE Sidebar SHALL
   désactiver les animations de glow et les transitions de mouvement sur les
   liens de navigation
2. WHEN l'utilisateur a activé `prefers-reduced-motion`, THE Overlay_Mobile
   SHALL s'afficher et se masquer sans animation de transition

### Exigence 9 : Recherche globale via overlay depuis la sidebar

**User Story :** En tant que joueur, je veux accéder à la recherche globale
depuis un bouton dans la sidebar, pour rechercher des jeux et des personnages
sans quitter la page courante.

#### Critères d'acceptation

1. THE Sidebar SHALL afficher un bouton « Recherche » avec une icône de loupe,
   positionné entre les liens de navigation et la section utilisateur
2. WHEN le bouton « Recherche » est activé, THE Overlay_Recherche SHALL
   s'afficher centré sur la page courante avec un fond semi-transparent
3. THE Overlay_Recherche SHALL contenir un champ de saisie de recherche avec un
   style gaming/néon cohérent avec l'esthétique de l'application
4. THE Overlay_Recherche SHALL utiliser le style glassmorphism (effet glass)
   pour le panneau de résultats
5. WHEN l'utilisateur saisit du texte dans le champ de recherche, THE
   Overlay_Recherche SHALL afficher les résultats correspondants pour les jeux
   et les personnages
6. THE Overlay_Recherche SHALL regrouper les résultats par catégorie (Jeux,
   Personnages) avec des en-têtes distincts
7. WHEN l'utilisateur appuie sur la touche Échap, THE Overlay_Recherche SHALL se
   fermer
8. WHEN l'utilisateur clique en dehors du panneau de recherche, THE
   Overlay_Recherche SHALL se fermer
9. THE Overlay_Recherche SHALL afficher un bouton de fermeture visible
10. WHEN l'utilisateur appuie sur Ctrl+K (Windows/Linux) ou Cmd+K (macOS), THE
    Overlay_Recherche SHALL s'ouvrir
11. THE Overlay_Recherche SHALL utiliser les attributs `role="dialog"` et
    `aria-modal="true"` pour signaler sa nature modale aux technologies
    d'assistance
12. WHEN l'overlay de recherche est ouvert, THE Overlay_Recherche SHALL capturer
    le focus à l'intérieur du panneau et placer le focus initial sur le champ de
    saisie
