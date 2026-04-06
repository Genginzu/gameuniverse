# Éditeur de Recadrage d'Image à l'Upload

## Description

Éditeur de recadrage interactif intégré au composant `ImageUploader`. Après
sélection d'un fichier image, l'utilisateur peut :

- **Déplacer (pan)** l'image par glisser à la souris ou au doigt (touch)
- **Zoomer** via un slider, la molette de la souris ou le geste de pincement
- **Prévisualiser** le résultat en temps réel dans la zone de recadrage
- **Générer** un Blob WebP recadré via un `<canvas>` HTML côté client

Deux ratios d'aspect sont supportés :

| Contexte | Ratio | Dimensions de sortie |
| -------- | ----- | -------------------- |
| Avatar   | 1:1   | 256 × 256 px         |
| Bannière | 16:5  | 1280 × 400 px        |

Aucune bibliothèque tierce de crop n'est utilisée — l'éditeur repose entièrement
sur un canvas HTML natif et des event handlers (mouse, touch, wheel).

## Accès

Page de paramètres du profil (`/[locale]/settings`), via le composant
`ImageUploader` pour l'upload d'avatar et de bannière.

## Prérequis

Aucun — fonctionnalité purement côté client. Pas de modification de base de
données ni de configuration supplémentaire nécessaire.

## Utilisation

1. **Sélectionner une image** (clic ou glisser-déposer)
2. L'éditeur de recadrage s'ouvre avec l'image centrée dans la zone de crop
3. **Déplacer** l'image en la faisant glisser (souris ou tactile)
4. **Zoomer** avec le slider, la molette de la souris ou le geste de pincement
5. Cliquer **« Valider le recadrage »** pour générer l'image recadrée en WebP et
   lancer l'upload
6. Cliquer **« Annuler »** pour revenir à l'état initial sans upload

## Architecture

| Fichier                                   | Rôle                                                     |
| ----------------------------------------- | -------------------------------------------------------- |
| `src/components/shared/CropEditor.tsx`    | Composant UI (canvas, overlay, slider, boutons)          |
| `src/hooks/useCropEditor.ts`              | Hook de logique (état pan/zoom, contraintes, événements) |
| `src/lib/utils/cropCanvas.ts`             | Fonction pure : génère le Blob recadré via canvas        |
| `src/types/crop.ts`                       | Types et constantes partagés                             |
| `src/components/shared/ImageUploader.tsx` | Composant parent (intégration du CropEditor)             |
| `src/hooks/useImageUpload.ts`             | Hook d'upload (accepte Blob et File)                     |
