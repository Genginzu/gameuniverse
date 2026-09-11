# Document de Spécifications — Recadrage d'Image à l'Upload

## Introduction

Le système d'upload d'images actuel (`ImageUploader`) permet de sélectionner et
uploader une image brute sans transformation. Cette fonctionnalité ajoute un
éditeur de recadrage interactif permettant à l'utilisateur de déplacer (pan),
zoomer et prévisualiser le résultat recadré avant de confirmer l'upload. Le
recadrage s'applique aux avatars (ratio 1:1) et aux bannières (ratio 16:5) sur
la page de paramètres du profil joueur.

## Glossaire

- **Éditeur_de_Recadrage** : Composant UI interactif affiché après la sélection
  d'un fichier image, permettant de manipuler l'image (déplacement, zoom) dans
  une zone de recadrage définie par un ratio d'aspect.
- **Zone_de_Recadrage** : Région visible de l'image délimitée par le ratio
  d'aspect cible (1:1 pour avatar, 16:5 pour bannière). Seule la portion de
  l'image visible dans cette zone sera exportée.
- **ImageUploader** : Composant partagé existant
  (`src/components/shared/ImageUploader.tsx`) responsable de la sélection,
  prévisualisation et upload d'images.
- **Hook_useImageUpload** : Hook React existant (`src/hooks/useImageUpload.ts`)
  gérant la logique d'upload (sélection de fichier, upload vers Supabase
  Storage, confirmation).
- **Blob_Recadré** : Objet `Blob` contenant uniquement la portion recadrée de
  l'image, généré côté client via un `<canvas>` HTML avant l'upload.
- **Supabase_Storage** : Service de stockage d'objets utilisé pour héberger les
  images uploadées (avatars et bannières).

## Exigences

### Exigence 1 : Affichage de l'Éditeur de Recadrage après sélection d'image

**User Story :** En tant que joueur, je veux voir un éditeur de recadrage après
avoir sélectionné une image, afin de pouvoir ajuster le cadrage avant l'upload.

#### Critères d'acceptation

1. WHEN un fichier image valide est sélectionné (via clic ou glisser-déposer),
   THE Éditeur_de_Recadrage SHALL s'afficher en remplacement de la zone de
   prévisualisation actuelle, avec l'image chargée et centrée dans la
   Zone_de_Recadrage.
2. THE Éditeur_de_Recadrage SHALL afficher la Zone_de_Recadrage avec le ratio
   d'aspect correspondant au contexte : 1:1 pour les avatars, 16:5 pour les
   bannières.
3. THE Éditeur_de_Recadrage SHALL assombrir ou masquer visuellement les parties
   de l'image situées en dehors de la Zone_de_Recadrage, afin que l'utilisateur
   distingue clairement la portion qui sera conservée.
4. IF le fichier sélectionné est invalide (format non supporté ou taille
   excessive), THEN THE ImageUploader SHALL afficher le message d'erreur
   approprié sans ouvrir l'Éditeur_de_Recadrage.

### Exigence 2 : Déplacement (Pan) de l'image dans la zone de recadrage

**User Story :** En tant que joueur, je veux pouvoir déplacer l'image dans la
zone de recadrage, afin de choisir quelle portion de l'image sera visible.

#### Critères d'acceptation

1. WHILE l'Éditeur_de_Recadrage est affiché, THE Éditeur_de_Recadrage SHALL
   permettre à l'utilisateur de déplacer l'image par glisser (drag) à la souris.
2. WHILE l'Éditeur_de_Recadrage est affiché sur un appareil tactile, THE
   Éditeur_de_Recadrage SHALL permettre à l'utilisateur de déplacer l'image par
   glisser au doigt (touch drag).
3. THE Éditeur_de_Recadrage SHALL empêcher le déplacement de l'image au-delà des
   limites de la Zone_de_Recadrage, de sorte qu'aucune zone vide ne soit visible
   dans le cadre.

### Exigence 3 : Zoom sur l'image

**User Story :** En tant que joueur, je veux pouvoir zoomer et dézoomer sur
l'image, afin d'ajuster le niveau de détail visible dans le cadre.

#### Critères d'acceptation

1. WHILE l'Éditeur_de_Recadrage est affiché, THE Éditeur_de_Recadrage SHALL
   fournir un contrôle de zoom sous forme de curseur (slider) permettant
   d'ajuster le niveau de zoom entre un minimum de 1× et un maximum de 3×.
2. WHILE l'Éditeur_de_Recadrage est affiché, THE Éditeur_de_Recadrage SHALL
   permettre le zoom via la molette de la souris (scroll wheel).
3. WHILE l'Éditeur_de_Recadrage est affiché sur un appareil tactile, THE
   Éditeur_de_Recadrage SHALL permettre le zoom via le geste de pincement
   (pinch-to-zoom).
4. THE Éditeur_de_Recadrage SHALL maintenir l'image centrée sur le point de zoom
   lors d'un changement de niveau de zoom.
5. WHEN le niveau de zoom change, THE Éditeur_de_Recadrage SHALL réajuster la
   position de l'image pour empêcher l'apparition de zones vides dans la
   Zone_de_Recadrage.

### Exigence 4 : Prévisualisation du résultat recadré

**User Story :** En tant que joueur, je veux voir en temps réel le résultat du
recadrage, afin de valider le rendu avant de confirmer.

#### Critères d'acceptation

1. WHILE l'utilisateur déplace ou zoome l'image, THE Éditeur_de_Recadrage SHALL
   mettre à jour la prévisualisation en temps réel dans la Zone_de_Recadrage,
   sans latence perceptible.
2. THE Éditeur_de_Recadrage SHALL afficher la prévisualisation avec la forme
   finale correspondant au contexte : circulaire pour les avatars (1:1),
   rectangulaire arrondi pour les bannières (16:5).

### Exigence 5 : Validation et génération du Blob recadré

**User Story :** En tant que joueur, je veux confirmer mon recadrage et uploader
uniquement la portion visible, afin que mon avatar ou ma bannière corresponde
exactement à ce que j'ai choisi.

#### Critères d'acceptation

1. WHEN l'utilisateur clique sur le bouton « Valider », THE Éditeur_de_Recadrage
   SHALL générer un Blob_Recadré contenant uniquement la portion de l'image
   visible dans la Zone_de_Recadrage, en utilisant un élément `<canvas>` HTML.
2. THE Éditeur_de_Recadrage SHALL générer le Blob_Recadré au format WebP avec
   une qualité de 0.9.
3. WHEN le Blob_Recadré est généré, THE Hook_useImageUpload SHALL uploader le
   Blob_Recadré vers Supabase_Storage en lieu et place du fichier original.
4. WHEN l'utilisateur clique sur le bouton « Annuler » dans
   l'Éditeur_de_Recadrage, THE Éditeur_de_Recadrage SHALL se fermer et revenir à
   l'état initial sans déclencher d'upload.
5. IF la génération du Blob_Recadré échoue (par exemple, canvas tainted par
   CORS), THEN THE ImageUploader SHALL afficher un message d'erreur et ne pas
   déclencher d'upload.

### Exigence 6 : Dimensions de sortie du recadrage

**User Story :** En tant que développeur, je veux que les images recadrées aient
des dimensions de sortie cohérentes, afin d'optimiser le stockage et le rendu.

#### Critères d'acceptation

1. WHEN le contexte est « avatars », THE Éditeur_de_Recadrage SHALL produire un
   Blob_Recadré de dimensions 256×256 pixels.
2. WHEN le contexte est « banners », THE Éditeur_de_Recadrage SHALL produire un
   Blob_Recadré de dimensions 1280×400 pixels.
3. IF l'image source a une résolution inférieure aux dimensions de sortie
   cibles, THEN THE Éditeur_de_Recadrage SHALL redimensionner l'image au mieux
   (upscale) pour remplir la Zone_de_Recadrage, en acceptant une perte de
   qualité.

### Exigence 7 : Intégration avec le flux d'upload existant

**User Story :** En tant que développeur, je veux que le recadrage s'intègre
dans le flux d'upload existant sans casser la compatibilité, afin de minimiser
les régressions.

#### Critères d'acceptation

1. THE Hook_useImageUpload SHALL accepter un `Blob` en plus d'un `File` comme
   source d'upload, afin de supporter le Blob_Recadré.
2. THE ImageUploader SHALL conserver le comportement existant de glisser-déposer
   et de sélection de fichier pour déclencher l'ouverture de
   l'Éditeur_de_Recadrage.
3. THE ImageUploader SHALL conserver les fonctionnalités existantes de
   suppression d'image et de barre de progression d'upload.
4. WHEN un upload est en cours, THE Éditeur_de_Recadrage SHALL être désactivé
   (non interactif) et afficher l'indicateur de progression existant.

### Exigence 8 : Mise à jour immédiate de l'image sur le profil

**User Story :** En tant que joueur, je veux que mon avatar ou ma bannière se
mette à jour immédiatement sur la page de profil après validation du recadrage,
afin de voir le résultat sans avoir à recharger la page.

#### Critères d'acceptation

1. WHEN l'upload et la confirmation du Blob_Recadré sont terminés avec succès,
   THE page de profil SHALL afficher immédiatement la nouvelle image (avatar ou
   bannière) sans rechargement de page.
2. THE ImageUploader SHALL invoquer le callback `onUploadSuccess` avec la
   nouvelle URL publique Supabase_Storage, et le composant parent SHALL utiliser
   cette URL pour mettre à jour l'état local et rafraîchir l'affichage.
3. IF l'upload ou la confirmation échoue, THEN THE page de profil SHALL
   conserver l'image précédente et afficher un message d'erreur.

### Exigence 9 : Traductions i18n (FR et EN)

**User Story :** En tant que joueur francophone ou anglophone, je veux que tous
les textes de l'éditeur de recadrage soient traduits dans ma langue, afin de
comprendre les actions disponibles.

#### Critères d'acceptation

1. THE ImageUploader SHALL afficher tous les libellés de l'Éditeur_de_Recadrage
   (bouton « Valider », bouton « Annuler », label du slider de zoom, messages
   d'erreur) en utilisant les clés de traduction `next-intl`.
2. WHEN de nouvelles clés de traduction sont ajoutées, THE système SHALL les
   définir simultanément dans `src/messages/fr.json` et `src/messages/en.json`.

### Exigence 10 : Cohérence visuelle avec le design system

**User Story :** En tant que joueur, je veux que l'éditeur de recadrage
s'intègre visuellement au reste du site, afin d'avoir une expérience cohérente.

#### Critères d'acceptation

1. THE Éditeur_de_Recadrage SHALL utiliser les classes glassmorphism existantes
   (`.glass-card`, fonds semi-transparents, `backdrop-blur-sm`) pour ses
   conteneurs.
2. THE Éditeur_de_Recadrage SHALL supporter le mode sombre (dark mode) via les
   classes Tailwind `dark:`.
3. THE Éditeur_de_Recadrage SHALL utiliser le gradient d'accent du projet
   (`from-[#615dfa] via-[#5b36d4] to-[#7c5cfc]`) pour le bouton de validation et
   le slider de zoom.
4. THE Éditeur_de_Recadrage SHALL appliquer des coins arrondis (`rounded-xl` ou
   `rounded-2xl`) et des transitions fluides (`transition-all duration-300`) sur
   les éléments interactifs.
