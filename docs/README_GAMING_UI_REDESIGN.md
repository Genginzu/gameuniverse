# Refonte UI Gaming — Game Universe

## Description

Transformation visuelle complète de Game Universe, d'un dashboard glassmorphism
classique vers une interface immersive orientée gaming. La refonte est purement
CSS/composants UI — aucune modification de la logique métier, des API ou du
schéma de base de données.

### Ce qui a été implémenté

1. **Palette néon et tokens CSS** — Nouvelles custom properties
   (`--neon-violet`, `--neon-cyan`, `--neon-magenta`, opacités glow/border) dans
   `:root` et `.dark`, avec intensification automatique en mode sombre (+20%).
   Extension Tailwind avec `neon.violet`, `neon.cyan`, `neon.magenta`.

2. **Classes utilitaires néon** — `.neon-glow`, `.neon-border`, `.neon-text`,
   `.neon-focus`, `.neon-btn` dans `globals.css`. Transitions ≤ 300ms.

3. **Panneaux glass enrichis** — Les classes `.glass`, `.glass-card`,
   `.glass-header`, `.glass-dropdown`, `.glass-input` intègrent désormais des
   bordures dégradé néon (violet→cyan) et un glow externe. Intensification au
   survol. `backdrop-filter: blur()` et `rounded-2xl` préservés.

4. **Fond animé néon** — `.dashboard-bg` utilise un dégradé mesh animé avec les
   couleurs violet-500, cyan-500, magenta-500.

5. **Accessibilité motion** — `@media (prefers-reduced-motion: reduce)`
   désactive toutes les animations néon, mesh et transitions continues.

6. **Navigation horizontale** — La sidebar latérale est remplacée par :
   - `GamingNavBar` : barre horizontale avec 5 liens (Dashboard, Bibliothèque,
     Favoris, Collections, Profil), indicateur actif néon, glow au survol
   - `MobileNavOverlay` : overlay plein écran pour mobile (<1024px)
   - `NavUserMenu` : menu utilisateur (thème, paramètres, déconnexion)

7. **Cartes de jeux néon** — `GameCard` et `EntityCard` enrichis avec glow néon
   au survol, bordures animées et badges metascore néon.

8. **Landing page gaming** — Hero sombre avec grille CSS animée, boutons CTA
   néon, cartes features glass gaming, compteurs stats avec glow.

9. **Dashboard connecté** — Message de bienvenue avec typographie gaming, cartes
   stats avec glow néon, boutons d'actions rapides style gaming.

10. **Typographie gaming globale** — `.neon-text` sur les titres h1,
    `text-2xl`/`font-bold` sur les titres de section, icônes gaming via
    `react-icons`.

11. **Animations d'entrée** — Fade-in + slide-up sur le contenu principal,
    anneau de focus néon global sur les éléments interactifs.

## Accès

### Pages publiques (non connecté)

| Page    | Route        | Description                               |
| ------- | ------------ | ----------------------------------------- |
| Accueil | `/[locale]/` | Landing page avec hero gaming et CTA néon |

### Pages connectées (après authentification)

| Page         | Route                            | Description                         |
| ------------ | -------------------------------- | ----------------------------------- |
| Dashboard    | `/[locale]/dashboard`            | Hub principal avec stats et actions |
| Bibliothèque | `/[locale]/library`              | Catalogue de jeux avec cartes néon  |
| Favoris      | `/[locale]/favorites/characters` | Personnages favoris                 |
| Collections  | `/[locale]/collections`          | Collections de jeux                 |
| Profil       | `/[locale]/profile`              | Profil utilisateur                  |

La navigation entre ces pages se fait via la barre horizontale `GamingNavBar`
(desktop) ou le `MobileNavOverlay` (mobile <1024px).

## Prérequis

- **Aucune migration de base de données** — refonte purement visuelle
- **Aucune variable d'environnement supplémentaire**
- **Dépendances** : `react-icons` (déjà installé) pour les icônes gaming
- **Thème** : le mode clair/sombre fonctionne via `next-themes` (existant)
- **Navigateur** : support de `backdrop-filter` recommandé (fallback opaque
  prévu pour les navigateurs non compatibles)

## Utilisation

### Thème néon

Le thème gaming s'active automatiquement. Le mode sombre intensifie les accents
néon de 20%. Basculer entre clair/sombre via le menu utilisateur (icône
soleil/lune).

### Navigation

- **Desktop (≥1024px)** : barre horizontale dans le header. Le lien actif est
  souligné par un glow néon.
- **Mobile (<1024px)** : bouton hamburger → overlay plein écran avec les liens
  gaming.

### Classes CSS disponibles

| Classe         | Usage                                          |
| -------------- | ---------------------------------------------- |
| `.neon-glow`   | Ajouter un glow violet/cyan à un élément       |
| `.neon-border` | Bordure dégradé néon                           |
| `.neon-text`   | Text-shadow glow pour les titres               |
| `.neon-focus`  | Anneau de focus néon accessible                |
| `.neon-btn`    | Style bouton gaming (bordure + glow au survol) |
| `.glass-card`  | Panneau glass avec effets néon intégrés        |

### Accessibilité

- `prefers-reduced-motion: reduce` désactive toutes les animations
- Anneau de focus néon visible sur tous les éléments interactifs
- Contrastes WCAG AA respectés avec les effets de glow
