# Aperçu des couleurs dans le formulaire admin

## Description

Composant d'aperçu visuel en temps réel intégré dans l'onglet « Général » du
formulaire d'édition de jeu. Il reproduit une version miniature de la page
détail publique en utilisant les couleurs actuellement saisies (background,
accent, label, text), permettant de visualiser immédiatement l'impact des choix
de couleurs sans quitter le formulaire.

## Accès

- Aller sur la page d'édition d'un jeu : `/{locale}/admin/games/{id}/edit`
- L'aperçu apparaît dans l'onglet **Général**, juste en dessous des champs de
  couleur

## Prérequis

- Être connecté en tant qu'administrateur
- Aucune configuration supplémentaire nécessaire

## Utilisation

1. Ouvrir un jeu en édition
2. Dans l'onglet Général, modifier les champs couleur (background, accent,
   label, text) via les color pickers ou en saisissant un code hexadécimal
3. L'aperçu se met à jour instantanément et affiche :
   - La zone hero avec le fond coloré et un gradient
   - L'image de couverture du jeu (si définie)
   - Le titre du jeu avec la couleur de texte
   - Les badges de genres sélectionnés
   - Des cartes overview simulées avec les couleurs d'accent, label et texte
4. Si aucune couleur n'est définie, l'aperçu utilise les couleurs par défaut

## Composants

- `src/components/admin/games/GameColorPreview.tsx` — composant d'aperçu
- `src/components/admin/games/GameFormGeneralTab.tsx` — intégration dans
  l'onglet
