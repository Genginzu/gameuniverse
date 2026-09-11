# Document d'Exigences — Refonte UI Gaming

## Introduction

Game Universe est actuellement une application Next.js avec un design
glassmorphism fonctionnel mais qui ressemble trop à un dashboard d'entreprise.
L'objectif de cette refonte est de transformer l'identité visuelle pour créer
une expérience immersive orientée gaming, tout en conservant le système de
glassmorphism existant. Le site doit donner l'impression d'avoir été conçu par
des gamers, pour des gamers.

## Glossaire

- **Application** : L'application web Game Universe dans son ensemble
- **Système_de_Navigation** : L'ensemble des composants de navigation (header,
  sidebar, liens)
- **Page_d_Accueil** : La landing page publique visible par les utilisateurs non
  connectés
- **Espace_Connecté** : L'ensemble des pages accessibles après authentification
  (dashboard, bibliothèque, collections, favoris, profil)
- **Carte_de_Jeu** : Le composant d'affichage d'un jeu dans les listes
  (GameCard, EntityCard)
- **Fond_Animé** : L'arrière-plan dynamique de l'application (actuellement
  `dashboard-bg`)
- **Panneau_Glass** : Tout conteneur utilisant les classes glassmorphism
  (`glass`, `glass-card`, etc.)
- **Barre_de_Recherche** : Le composant de recherche globale (GlobalSearchBar)
- **Page_Détail_Jeu** : La page de détail d'un jeu individuel
- **Système_de_Thème** : Le mécanisme de gestion des modes clair/sombre via CSS
  variables

## Exigences

### Exigence 1 : Refonte de la palette de couleurs et du fond

**User Story :** En tant que joueur, je veux que le site ait une ambiance
visuelle sombre et immersive avec des accents néon, pour me sentir dans un
univers gaming dès l'ouverture du site.

#### Critères d'acceptation

1. THE Système_de_Thème SHALL utiliser une palette de couleurs dominante sombre
   (tons de slate/gray 900-950) avec des accents néon (violet, cyan, magenta)
   définis via les CSS custom properties existantes (`--primary`, `--accent`,
   `--ring`)
2. THE Fond_Animé SHALL afficher un dégradé mesh animé subtil utilisant des
   couleurs néon (violet-500, cyan-500, magenta-500) avec une opacité réduite
   pour ne pas gêner la lisibilité du contenu
3. WHILE le mode sombre est actif, THE Fond_Animé SHALL intensifier les accents
   néon du dégradé mesh de 20% par rapport au mode clair
4. THE Application SHALL conserver le support des modes clair et sombre via le
   mécanisme `next-themes` existant
5. WHEN le mode clair est actif, THE Système_de_Thème SHALL utiliser un fond
   clair avec des accents néon atténués pour maintenir la cohérence gaming sans
   fatiguer les yeux

### Exigence 2 : Refonte du système de navigation

**User Story :** En tant que joueur, je veux une navigation qui ressemble à un
menu de jeu vidéo plutôt qu'à une sidebar d'application métier, pour que
l'expérience soit ludique et immersive.

#### Critères d'acceptation

1. THE Système_de_Navigation SHALL remplacer la sidebar latérale fixe par une
   barre de navigation horizontale en haut de page, intégrée au header existant
2. THE Système_de_Navigation SHALL afficher les liens de navigation principaux
   (Dashboard, Bibliothèque, Favoris, Collections, Profil) sous forme d'icônes
   avec labels dans la barre horizontale
3. WHEN un lien de navigation est actif, THE Système_de_Navigation SHALL
   afficher un indicateur visuel lumineux (bordure inférieure néon ou glow) sous
   le lien actif
4. WHEN un lien de navigation est survolé, THE Système_de_Navigation SHALL
   afficher un effet de glow subtil autour de l'icône
5. WHILE l'écran a une largeur inférieure à 1024px, THE Système_de_Navigation
   SHALL afficher un menu hamburger qui ouvre un overlay plein écran avec les
   liens de navigation stylisés en mode gaming
6. THE Système_de_Navigation SHALL conserver la fonctionnalité de recherche
   globale dans le header
7. THE Système_de_Navigation SHALL conserver le sélecteur de langue et le menu
   utilisateur dans le header

### Exigence 3 : Refonte des panneaux glassmorphism

**User Story :** En tant que joueur, je veux que les panneaux glass aient un
aspect plus futuriste et gaming, pour que le site se distingue visuellement d'un
dashboard classique.

#### Critères d'acceptation

1. THE Panneau_Glass SHALL utiliser des bordures avec un dégradé néon subtil
   (violet vers cyan) au lieu de bordures blanches uniformes
2. THE Panneau_Glass SHALL afficher un effet de glow externe léger en couleur
   néon (box-shadow avec couleur violette/cyan à faible opacité)
3. WHEN un Panneau_Glass est survolé, THE Panneau_Glass SHALL intensifier
   l'effet de glow externe et la luminosité de la bordure néon
4. THE Panneau_Glass SHALL conserver le backdrop-filter blur existant pour
   maintenir l'effet de transparence
5. THE Panneau_Glass SHALL utiliser des coins arrondis de 16px (rounded-2xl) de
   manière cohérente

### Exigence 4 : Refonte des cartes de jeux

**User Story :** En tant que joueur, je veux que les cartes de jeux soient plus
dynamiques et engageantes visuellement, pour que parcourir le catalogue soit une
expérience excitante.

#### Critères d'acceptation

1. WHEN une Carte_de_Jeu est survolée, THE Carte_de_Jeu SHALL afficher un effet
   de glow néon autour de la carte (box-shadow coloré) en plus de l'effet de
   scale existant
2. WHEN une Carte_de_Jeu est survolée, THE Carte_de_Jeu SHALL afficher une
   bordure lumineuse animée (gradient border qui tourne ou pulse)
3. THE Carte_de_Jeu SHALL afficher le badge metascore avec un style néon (glow
   autour du badge) au lieu du style plat actuel
4. THE Carte_de_Jeu SHALL conserver l'overlay au survol avec les informations du
   jeu (titre, développeur, genres, date)
5. WHEN l'utilisateur a activé `prefers-reduced-motion`, THE Carte_de_Jeu SHALL
   désactiver les animations de glow et de bordure animée

### Exigence 5 : Refonte de la page d'accueil (Landing)

**User Story :** En tant que visiteur, je veux que la page d'accueil me plonge
immédiatement dans un univers gaming, pour avoir envie de m'inscrire et explorer
le site.

#### Critères d'acceptation

1. THE Page_d_Accueil SHALL afficher une section hero avec un fond sombre, des
   effets de particules ou de grille animée, et une typographie bold avec des
   accents néon
2. THE Page_d_Accueil SHALL afficher les boutons CTA (inscription, connexion)
   avec un style néon (bordures lumineuses, effets de glow au survol)
3. THE Page_d_Accueil SHALL afficher les cartes de fonctionnalités avec le style
   Panneau_Glass gaming (bordures néon, glow)
4. THE Page_d_Accueil SHALL afficher les statistiques avec des compteurs
   stylisés en mode gaming (chiffres avec glow néon, icônes colorées)
5. THE Page_d_Accueil SHALL conserver la structure responsive existante (mobile,
   tablette, desktop)
6. WHEN l'utilisateur a activé `prefers-reduced-motion`, THE Page_d_Accueil
   SHALL désactiver les animations de particules et les effets de mouvement
   continu

### Exigence 6 : Refonte du dashboard connecté

**User Story :** En tant que joueur connecté, je veux que mon espace personnel
ressemble à un hub de joueur plutôt qu'à un tableau de bord analytique, pour me
sentir dans mon univers gaming.

#### Critères d'acceptation

1. THE Espace_Connecté SHALL afficher un message de bienvenue personnalisé avec
   une typographie gaming (font bold, accents néon sur le nom du joueur)
2. THE Espace_Connecté SHALL afficher les cartes de statistiques avec des icônes
   gaming stylisées et des valeurs numériques avec un effet de glow néon
3. THE Espace_Connecté SHALL afficher les actions rapides sous forme de boutons
   gaming (style néon, icônes proéminentes) au lieu de boutons d'application
   classiques
4. THE Espace_Connecté SHALL utiliser le layout sans sidebar (navigation
   horizontale) conformément à l'Exigence 2
5. THE Espace_Connecté SHALL occuper toute la largeur disponible de l'écran sans
   la contrainte de la sidebar latérale

### Exigence 7 : Typographie et iconographie gaming

**User Story :** En tant que joueur, je veux que la typographie et les icônes du
site évoquent l'univers du jeu vidéo, pour renforcer l'identité gaming du site.

#### Critères d'acceptation

1. THE Application SHALL utiliser une police sans-serif moderne et géométrique
   (Inter ou similaire déjà disponible dans Next.js) avec des graisses bold pour
   les titres
2. THE Application SHALL appliquer un effet de text-glow (text-shadow néon) sur
   les titres principaux des pages (h1)
3. THE Application SHALL utiliser des icônes gaming cohérentes via la
   bibliothèque react-icons déjà installée (FaGamepad, FaTrophy, FaFire, etc.)
4. WHEN un titre de section est affiché, THE Application SHALL utiliser une
   taille de police minimale de 1.5rem (text-2xl) avec une graisse de 700
   (font-bold)

### Exigence 8 : Animations et micro-interactions gaming

**User Story :** En tant que joueur, je veux des animations fluides et des
micro-interactions qui rappellent les interfaces de jeux vidéo, pour que la
navigation soit dynamique et engageante.

#### Critères d'acceptation

1. WHEN une page est chargée, THE Application SHALL animer l'apparition du
   contenu principal avec un effet de fade-in combiné à un léger slide-up
   (utilisant les animations existantes `slideInUp`, `fadeIn`)
2. WHEN un bouton d'action est survolé, THE Application SHALL afficher un effet
   de glow néon autour du bouton
3. WHEN un élément interactif reçoit le focus clavier, THE Application SHALL
   afficher un anneau de focus en couleur néon (violet) visible et accessible
4. THE Application SHALL respecter la préférence `prefers-reduced-motion` en
   désactivant toutes les animations continues et les transitions de mouvement
5. THE Application SHALL limiter la durée des animations de transition à 300ms
   pour maintenir une sensation de réactivité
