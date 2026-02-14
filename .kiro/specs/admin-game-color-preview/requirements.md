# Requirements Document

## Introduction

Cette fonctionnalité ajoute un aperçu visuel en temps réel dans la page
d'édition admin d'un jeu, permettant aux administrateurs de visualiser l'impact
des couleurs choisies (background, accent, label, text) sur le rendu de la page
détail publique du jeu. Actuellement, les champs couleur sont des saisies
hexadécimales sans retour visuel, ce qui rend difficile l'évaluation du résultat
final.

## Glossary

- **Color_Preview**: Composant d'aperçu visuel qui simule le rendu de la page
  détail publique d'un jeu en utilisant les couleurs actuellement saisies dans
  le formulaire admin.
- **GameForm**: Formulaire d'édition/création de jeu dans l'interface
  d'administration.
- **GameFormColorFields**: Composant existant qui affiche les 4 champs de
  sélection de couleur (background, accent, label, text).
- **GameColors**: Objet structuré produit par `buildGameColors()` contenant les
  couleurs dérivées pour le rendu de la page détail.
- **Color_Fields**: Les 4 champs couleur du formulaire : `background_color`,
  `accent_color`, `label_color`, `text_color`.
- **Detail_Page**: La page publique de détail d'un jeu qui utilise les couleurs
  pour son rendu visuel (hero section, overview cards, textes).

## Requirements

### Requirement 1: Affichage de l'aperçu couleur

**User Story:** En tant qu'administrateur, je veux voir un aperçu visuel des
couleurs du jeu pendant l'édition, afin de pouvoir évaluer le rendu final sans
quitter le formulaire.

#### Acceptance Criteria

1. WHEN an administrator is on the general tab of the GameForm, THE
   Color_Preview SHALL display a miniature representation of the Detail_Page
   using the current Color_Fields values.
2. WHEN any Color_Field value changes in the form, THE Color_Preview SHALL
   update its rendering within the same React render cycle to reflect the new
   color values.
3. THE Color_Preview SHALL use the existing `buildGameColors()` function to
   derive the GameColors object from the current Color_Fields values.
4. THE Color_Preview SHALL display representative elements from the Detail_Page
   including: a background area using `backgroundColor`, text elements using
   `textColor`, label elements using `labelColor`, and accent elements using
   `accent` color.

### Requirement 2: Données contextuelles dans l'aperçu

**User Story:** En tant qu'administrateur, je veux que l'aperçu utilise les
données réelles du jeu en cours d'édition, afin que le rendu soit représentatif
du résultat final.

#### Acceptance Criteria

1. WHEN the GameForm has a title set in translations, THE Color_Preview SHALL
   display that title in the preview area styled with `textColor`.
2. WHEN the GameForm has a cover image URL set, THE Color_Preview SHALL display
   that cover image in the preview area.
3. WHEN the GameForm has genres selected, THE Color_Preview SHALL display genre
   badges in the preview area.
4. IF the GameForm has no title, cover image, or genres set, THEN THE
   Color_Preview SHALL display placeholder content to demonstrate the color
   rendering.

### Requirement 3: Intégration dans le formulaire

**User Story:** En tant qu'administrateur, je veux que l'aperçu soit intégré de
manière cohérente dans le formulaire, afin de ne pas perturber mon flux de
travail d'édition.

#### Acceptance Criteria

1. THE Color_Preview SHALL be positioned adjacent to or below the
   GameFormColorFields component within the general tab.
2. THE Color_Preview SHALL occupy a reasonable portion of the available space
   without requiring scrolling away from the Color_Fields.
3. WHEN the form is displayed on a small screen (viewport width below 640px),
   THE Color_Preview SHALL stack vertically below the Color_Fields.
4. THE Color_Preview SHALL have a visible border and rounded corners consistent
   with the existing admin UI design system.

### Requirement 4: Fidélité du rendu

**User Story:** En tant qu'administrateur, je veux que l'aperçu reflète
fidèlement le rendu de la page détail publique, afin de pouvoir prendre des
décisions éclairées sur les couleurs.

#### Acceptance Criteria

1. THE Color_Preview SHALL apply `backgroundColor` as the background of the
   preview container.
2. THE Color_Preview SHALL apply gradient overlays using `backgroundColor` with
   varying opacity levels, matching the pattern used in GameHeroSection.
3. THE Color_Preview SHALL style icon elements with the `accent` color, matching
   the pattern used in GameOverviewSection.
4. THE Color_Preview SHALL style label text with `labelColor` and main text with
   `textColor`, matching the patterns used in GameOverviewSection and
   GameHeroSection.
5. THE Color_Preview SHALL render overview-style cards with `border-slate-700`
   borders and `bg-slate-800/50` backgrounds, matching the GameOverviewSection
   card styling.

### Requirement 5: Réinitialisation aux couleurs par défaut

**User Story:** En tant qu'administrateur, je veux que l'aperçu fonctionne
correctement même quand aucune couleur n'est définie, afin de voir le rendu par
défaut.

#### Acceptance Criteria

1. WHEN all Color_Fields are empty, THE Color_Preview SHALL render using the
   default colors: background=#0f172a, accent=#8b5cf6, label=#94a3b8,
   text=#e2e8f0.
2. WHEN some Color_Fields are empty and others have values, THE Color_Preview
   SHALL use default values for empty fields and custom values for filled
   fields, matching the behavior of `buildGameColors()`.
