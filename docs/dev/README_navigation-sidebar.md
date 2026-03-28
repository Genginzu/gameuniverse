# Navigation Sidebar — Game Universe

## Description

Remplacement de la navigation horizontale (`GamingNavBar`) et du header connecté
(`DashboardHeader`) par une sidebar latérale fixe à gauche de l'écran. La
sidebar conserve l'esthétique gaming/néon (glassmorphism, accents violet/cyan)
établie lors de la refonte UI.

### Ce qui a été implémenté

1. **Sidebar fixe (desktop ≥1024px)** — Panneau latéral gauche de 256px
   (`w-64`), hauteur 100vh, style `glass-sidebar` avec bordures et glow néon.
   Contient le logo, les liens de navigation, le bouton recherche et la section
   utilisateur.

2. **Liens de navigation** — 5 liens principaux (Dashboard, Bibliothèque,
   Favoris, Collections, Profil) et 3 liens publics (Jeux, Personnages,
   Joueurs), séparés par une bordure subtile. Indicateur actif néon (fond violet
   lumineux + bordure latérale gauche), glow au survol, anneau de focus néon.

3. **Overlay de recherche globale** — Bouton loupe dans la sidebar ouvrant un
   overlay modal centré (glassmorphism). Accessible aussi via `Ctrl+K`
   (Windows/Linux) ou `Cmd+K` (macOS). Résultats groupés par catégorie (Jeux,
   Personnages). Fermeture via `Échap`, clic extérieur ou bouton de fermeture.

4. **Section utilisateur** — En bas de la sidebar : avatar (dégradé
   violet/bleu), nom d'affichage. Dropdown au clic avec changement de langue
   (`LanguageSwitcher`), changement de thème, accès aux paramètres et
   déconnexion.

5. **Navigation mobile (<1024px)** — Sidebar masquée, bouton hamburger flottant
   (position fixe, coin supérieur gauche). Ouvre un overlay plein écran avec les
   liens de navigation et un bouton recherche.

6. **Suppression du header** — `DashboardHeader.tsx`, `GamingNavBar.tsx`,
   `DashboardSidebar.tsx` et `SidebarContent.tsx` supprimés. Le contenu
   principal occupe tout l'espace à droite de la sidebar.

## Accès

### Layout connecté

La sidebar est intégrée dans `DashboardLayout.tsx` et s'affiche sur toutes les
pages de l'espace connecté :

| Page         | Route                            |
| ------------ | -------------------------------- |
| Dashboard    | `/[locale]/dashboard`            |
| Bibliothèque | `/[locale]/library`              |
| Favoris      | `/[locale]/favorites/characters` |
| Collections  | `/[locale]/collections`          |
| Profil       | `/[locale]/profile`              |

Les liens publics dans la sidebar pointent vers :

| Page        | Route                  |
| ----------- | ---------------------- |
| Jeux        | `/[locale]/games`      |
| Personnages | `/[locale]/characters` |
| Joueurs     | `/[locale]/players`    |

### Comportement responsive

- **Desktop (≥1024px)** : sidebar fixe à gauche, contenu principal en `flex-1` à
  droite.
- **Mobile (<1024px)** : sidebar masquée, bouton hamburger flottant → overlay
  plein écran.

## Prérequis

- **Authentification requise** — La sidebar n'est visible que dans l'espace
  connecté. Les utilisateurs non authentifiés sont redirigés vers
  `/auth?mode=signin`.
- **Aucune migration de base de données** — Fonctionnalité purement front-end.
- **Aucune variable d'environnement supplémentaire**.

## Utilisation

### Navigation

Cliquer sur un lien dans la sidebar pour naviguer. Le lien actif est signalé par
un fond violet lumineux et une bordure latérale gauche néon. Un seul lien est
actif à la fois.

### Recherche globale

- Cliquer sur le bouton loupe « Recherche » dans la sidebar, ou
- Utiliser le raccourci `Ctrl+K` (Windows/Linux) / `Cmd+K` (macOS).

L'overlay de recherche s'ouvre au centre de l'écran. Saisir du texte pour
rechercher des jeux et personnages. Les résultats sont groupés par catégorie.
Fermer avec `Échap`, le bouton ✕, ou un clic en dehors du panneau.

### Section utilisateur

Cliquer sur la section utilisateur en bas de la sidebar pour ouvrir le dropdown
:

| Action      | Description                                         |
| ----------- | --------------------------------------------------- |
| Langue      | Changer la langue de l'interface (LanguageSwitcher) |
| Thème       | Basculer entre mode clair et sombre                 |
| Paramètres  | Accéder à la page de paramètres                     |
| Déconnexion | Se déconnecter de l'application                     |

### Accessibilité

- Attributs ARIA (`nav`, `aria-label`, `role="dialog"`, `aria-modal="true"`) sur
  la sidebar et les overlays.
- Anneau de focus néon violet visible au clavier.
- Focus trap dans l'overlay mobile et l'overlay de recherche.
- `prefers-reduced-motion` respecté : animations glow et transitions désactivées
  si activé.
