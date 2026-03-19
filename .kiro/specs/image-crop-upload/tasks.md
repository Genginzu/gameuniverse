# Plan d'Implémentation : Recadrage d'Image à l'Upload

## Vue d'ensemble

Implémentation incrémentale de l'éditeur de recadrage interactif intégré au composant `ImageUploader`. Chaque étape construit sur la précédente : types → utilitaires purs → hook de logique → composant UI → intégration → traductions.

## Tâches

- [x] 1. Définir les types et constantes de crop
  - [x] 1.1 Créer `src/types/crop.ts` avec les interfaces et constantes
    - Définir `ImageDimensions`, `CropParams`, `CropOutputConfig`, `CropState`, `CropAspectRatio`
    - Définir `ASPECT_RATIO_VALUES` mapping ratio → valeur numérique
    - _Exigences : 6.1, 6.2_
  - [x] 1.2 Ajouter les constantes de sortie dans `src/types/upload.ts`
    - Ajouter `OUTPUT_DIMENSIONS` (avatars: 256×256, banners: 1280×400)
    - Ajouter `CROP_OUTPUT_FORMAT`, `CROP_OUTPUT_QUALITY`, `ZOOM_MIN`, `ZOOM_MAX`, `ZOOM_STEP`
    - _Exigences : 6.1, 6.2, 3.1, 5.2_

- [x] 2. Implémenter l'utilitaire `cropCanvas`
  - [x] 2.1 Créer `src/lib/utils/cropCanvas.ts`
    - Implémenter la fonction pure `cropCanvas(image, cropParams, output): Promise<Blob>`
    - Utiliser un `<canvas>` pour dessiner la portion source aux dimensions de sortie
    - Exporter en WebP avec qualité 0.9 via `canvas.toBlob()`
    - Gérer les erreurs (canvas tainted, toBlob null)
    - _Exigences : 5.1, 5.2, 5.5, 6.1, 6.2_
  - [x] 2.2 Écrire les tests unitaires pour `cropCanvas`
    - Fichier : `test/unit/lib/utils/cropCanvas.test.ts`
    - Tester le cas nominal (Blob WebP retourné)
    - Tester l'erreur quand `toBlob` retourne null
    - Tester les dimensions de sortie correctes
    - _Exigences : 5.1, 5.2, 6.1, 6.2_
  - [x] 2.3 Écrire le test property-based P4 : Dimensions de sortie conformes au contexte
    - Fichier : `test/unit/lib/utils/cropCanvas.property.test.ts`
    - **Propriété 4 : Dimensions de sortie conformes au contexte**
    - **Valide : Exigences 6.1, 6.2**
    - Générateur : `fc.oneof(fc.constant("avatars"), fc.constant("banners"))` + crop params aléatoires
    - Vérifier que le canvas de sortie a exactement les dimensions attendues (256×256 ou 1280×400)
  - [x] 2.4 Écrire le test property-based P5 : cropCanvas produit un Blob WebP valide
    - Fichier : `test/unit/lib/utils/cropCanvas.property.test.ts`
    - **Propriété 5 : cropCanvas produit un Blob WebP valide**
    - **Valide : Exigences 5.1, 5.2**
    - Vérifier que le Blob retourné est non-null, de type `"image/webp"`, et de taille > 0

- [x] 3. Implémenter le hook `useCropEditor`
  - [x] 3.1 Créer `src/hooks/useCropEditor.ts`
    - Implémenter la gestion d'état `CropState` (x, y, zoom)
    - Implémenter la fonction `clampPosition` pour empêcher les zones vides
    - Implémenter les handlers : `onMouseDown/Move/Up`, `onWheel`, `onTouchStart/Move/End`
    - Implémenter `setZoom` avec maintien du centre (stabilité du point focal)
    - Implémenter `getCropParams` pour convertir l'état CSS en coordonnées source
    - _Exigences : 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.2 Écrire les tests unitaires pour `useCropEditor`
    - Fichier : `test/unit/hooks/useCropEditor.test.ts`
    - Tester l'initialisation (image centrée, zoom à 1)
    - Tester le pan (drag souris, drag tactile)
    - Tester le zoom via slider et via wheel
    - Tester le clamping aux limites extrêmes
    - _Exigences : 2.1, 2.2, 2.3, 3.1, 3.2, 3.4, 3.5_
  - [x] 3.3 Écrire le test property-based P1 : Clamping de position — pas de zone vide
    - Fichier : `test/unit/hooks/useCropEditor.property.test.ts`
    - **Propriété 1 : Invariant de clamping de position — pas de zone vide**
    - **Valide : Exigences 2.3, 3.5**
    - Générateur : `fc.record({ imageW, imageH, viewportW, viewportH, zoom, x, y })` avec contraintes
    - Vérifier que l'image zoomée couvre entièrement le viewport après clamping
  - [x] 3.4 Écrire le test property-based P2 : Bornes du zoom [1, 3]
    - Fichier : `test/unit/hooks/useCropEditor.property.test.ts`
    - **Propriété 2 : Invariant de bornes du zoom**
    - **Valide : Exigence 3.1**
    - Générateur : `fc.double({ min: -10, max: 10 })` pour tester le clamping
    - Vérifier que la valeur résultante est toujours dans [ZOOM_MIN, ZOOM_MAX]
  - [x] 3.5 Écrire le test property-based P3 : Stabilité du centre lors du zoom
    - Fichier : `test/unit/hooks/useCropEditor.property.test.ts`
    - **Propriété 3 : Stabilité du centre lors du zoom**
    - **Valide : Exigence 3.4**
    - Générateur : `fc.record({ state, deltaZoom })`
    - Vérifier que le point central dans le référentiel source reste identique (tolérance clamping)

- [x] 4. Checkpoint — Vérification des fondations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implémenter le composant `CropEditor`
  - [x] 5.1 Créer `src/components/shared/CropEditor.tsx`
    - Rendre le canvas avec l'image source transformée (translate + scale selon CropState)
    - Afficher l'overlay assombri en dehors de la zone de crop
    - Afficher la zone de crop avec la forme appropriée (circulaire pour 1:1, rectangulaire arrondi pour 16:5)
    - Ajouter le slider de zoom avec le gradient d'accent du projet
    - Ajouter les boutons « Valider » et « Annuler » avec traductions `next-intl`
    - Appliquer les classes glassmorphism (`.glass-card`, fonds semi-transparents, `backdrop-blur`)
    - Supporter le dark mode via `dark:` Tailwind
    - Appliquer coins arrondis (`rounded-xl` / `rounded-2xl`) et transitions fluides
    - Gérer l'état `disabled` (pendant l'upload)
    - Gérer l'erreur de génération canvas (afficher `upload.crop.errorCanvasFailed`)
    - _Exigences : 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 4.2, 5.1, 5.4, 5.5, 7.4, 9.1, 10.1, 10.2, 10.3, 10.4_
  - [x] 5.2 Écrire les tests unitaires pour `CropEditor`
    - Fichier : `test/unit/components/shared/CropEditor.test.tsx`
    - Tester le rendu initial (canvas, slider, boutons)
    - Tester le clic sur « Valider » (appel `onConfirm` avec Blob)
    - Tester le clic sur « Annuler » (appel `onCancel`)
    - Tester l'état `disabled` (interactions bloquées)
    - _Exigences : 1.1, 5.1, 5.4, 7.4, 10.1_

- [x] 6. Modifier `useImageUpload` pour accepter Blob
  - [x] 6.1 Adapter `src/hooks/useImageUpload.ts`
    - Modifier le type de `selectedFile` de `File | null` à `File | Blob | null`
    - Ajouter la méthode `handleCroppedUpload(blob: Blob)` qui déclenche le flux d'upload avec le Blob
    - Adapter `uploadToStorage` pour passer `contentType: "image/webp"` quand l'entrée est un Blob
    - _Exigences : 7.1, 5.3, 7.3_
  - [x] 6.2 Écrire les tests unitaires pour les modifications de `useImageUpload`
    - Fichier : `test/unit/hooks/useImageUpload.test.ts`
    - Tester l'upload d'un Blob (flux complet avec mock API)
    - Tester l'upload d'un File (non-régression)
    - Tester la gestion d'erreurs avec Blob
    - _Exigences : 7.1, 5.3_

- [x] 7. Intégrer `CropEditor` dans `ImageUploader`
  - [x] 7.1 Modifier `src/components/shared/ImageUploader.tsx`
    - Ajouter l'état pour gérer l'affichage du `CropEditor` (après sélection fichier valide)
    - Passer les props appropriées à `CropEditor` (imageSrc, aspectRatio, outputSize, callbacks)
    - Connecter `onConfirm` à `handleCroppedUpload` du hook
    - Connecter `onCancel` pour revenir à l'état initial
    - Conserver le comportement existant de drag-and-drop et sélection de fichier
    - Conserver la barre de progression et la suppression d'image
    - Désactiver le `CropEditor` pendant l'upload
    - _Exigences : 1.1, 1.4, 5.3, 5.4, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3_
  - [x] 7.2 Écrire les tests unitaires pour l'intégration dans `ImageUploader`
    - Fichier : `test/unit/components/shared/ImageUploader.test.tsx`
    - Tester l'ouverture du crop editor après sélection d'un fichier valide
    - Tester le flux complet : sélection → crop → upload → succès
    - Tester l'annulation du crop (retour état initial)
    - Tester le rejet d'un fichier invalide (crop editor ne s'ouvre pas)
    - _Exigences : 1.1, 1.4, 5.4, 7.2, 8.1_

- [x] 8. Ajouter les traductions i18n FR et EN
  - [x] 8.1 Ajouter les clés `upload.crop.*` dans `src/messages/fr.json` et `src/messages/en.json`
    - Clés : `title`, `zoom`, `confirm`, `cancel`, `errorCanvasFailed`
    - FR : « Recadrer l'image », « Zoom », « Valider le recadrage », « Annuler », message d'erreur
    - EN : "Crop image", "Zoom", "Confirm crop", "Cancel", error message
    - _Exigences : 9.1, 9.2_
  - [x] 8.2 Écrire le test property-based P7 : Synchronisation des clés FR/EN
    - Fichier : `test/unit/lib/utils/i18n-sync.property.test.ts`
    - **Propriété 7 : Synchronisation des clés de traduction FR/EN**
    - **Valide : Exigence 9.2**
    - Lire les fichiers JSON, vérifier que les clés `upload.crop.*` sont identiques dans les deux fichiers

- [x] 9. Checkpoint final — Validation complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Lint du code
  - [x] 10.1 Exécuter `bun run lint`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 10.3 Corriger les erreurs et warnings de lint si nécessaire

- [x] 11. Build de production
  - [x] 11.1 Exécuter `bun run build`
  - [x] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 11.3 Corriger les erreurs de build si nécessaire

- [x] 12. README de la fonctionnalité
  - [x] 12.1 Créer `docs/README_image_crop_upload.md`
    - Description : résumé de l'éditeur de recadrage (pan, zoom, preview, crop canvas)
    - Accès : composant `ImageUploader` sur la page de paramètres du profil
    - Prérequis : aucun (fonctionnalité purement côté client)
    - Utilisation : flux de recadrage (sélection → pan/zoom → valider → upload)

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les exemples spécifiques et cas limites
