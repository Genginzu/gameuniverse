# Plan d'implémentation : Upload Avatar & Bannière Joueur

## Vue d'ensemble

Implémentation en TypeScript d'un système d'upload d'images (avatar et bannière) pour les joueurs, utilisant AWS S3 avec des URLs pré-signées. Le plan suit une approche incrémentale : types et utilitaires → service S3 → routes API → composant UI → intégration dans les paramètres → traductions i18n.

## Tâches

- [x] 1. Créer les types partagés et les utilitaires d'upload
  - [x] 1.1 Créer le fichier de types `src/types/upload.ts`
    - Définir `UploadContext`, `ALLOWED_CONTEXTS`, `ALLOWED_MIME_TYPES`, `AllowedMimeType`, `MAX_FILE_SIZE_BYTES`, `CONTEXT_TO_PROFILE_FIELD`
    - Définir les interfaces `PresignedUrlParams`, `PresignedUrlResult`, `UploadRequest`, `UploadResponse`, `UploadConfirmRequest`, `UploadConfirmResponse`
    - _Exigences : 1.2, 1.4, 2.3, 2.4, 2.5, 7.5_

  - [x] 1.2 Créer le fichier de validation Zod `src/lib/validations/uploadValidation.ts`
    - Implémenter `uploadRequestSchema` (contexte, contentType, fileSize)
    - Implémenter `uploadConfirmSchema` (contexte, publicUrl)
    - Ajouter des fonctions utilitaires `isAllowedMimeType`, `isAllowedContext`, `isValidFileSize`
    - _Exigences : 2.3, 2.4, 2.5, 3.1, 3.2_

  - [x] 1.3 Créer le fichier utilitaire `src/lib/utils/uploadUtils.ts`
    - Implémenter `generateS3Key(context, userId, extension)` : génère un chemin S3 unique avec timestamp et randomId
    - Implémenter `extractS3KeyFromUrl(url)` : extrait la clé S3 depuis une URL publique
    - Implémenter `getExtensionFromMimeType(mimeType)` : retourne l'extension correspondante
    - _Exigences : 1.2, 7.2_

  - [x] 1.4 Écrire les tests property-based pour les utilitaires et validations
    - Fichier : `test/unit/lib/services/uploadService.property.test.ts`
    - **Propriété 1 : Le chemin S3 généré respecte le pattern attendu**
    - **Valide : Exigences 1.2, 1.4, 1.5**
    - **Propriété 2 : La validation MIME accepte uniquement les types autorisés**
    - **Valide : Exigences 2.3, 3.1**
    - **Propriété 3 : La validation de taille rejette les fichiers dépassant 5 Mo**
    - **Valide : Exigences 2.4, 3.2**
    - **Propriété 4 : La validation de contexte rejette les contextes invalides**
    - **Valide : Exigences 2.5, 7.5**
    - **Propriété 5 : Le mapping contexte → champ profil est correct**
    - **Valide : Exigences 2.6**
    - **Propriété 6 : Les noms de fichiers générés sont uniques**
    - **Valide : Exigences 7.2**
    - **Propriété 7 : Round-trip de validation du schéma d'upload**
    - **Valide : Exigences 2.3, 2.4, 2.5**

  - [x] 1.5 Écrire les tests unitaires pour les utilitaires et validations
    - Fichier : `test/unit/lib/utils/uploadUtils.test.ts`
    - Fichier : `test/unit/lib/validations/uploadValidation.test.ts`
    - Tester `generateS3Key` avec des cas concrets (format du chemin, unicité)
    - Tester `extractS3KeyFromUrl` avec des URLs valides et invalides
    - Tester les schémas Zod avec des données valides et invalides
    - _Exigences : 1.2, 2.3, 2.4, 2.5, 7.2_

- [x] 2. Checkpoint — Vérifier les types, utilitaires et tests
  - S'assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

- [x] 3. Implémenter le service d'upload S3
  - [x] 3.1 Créer le service `src/lib/services/uploadService.ts`
    - Implémenter `generatePresignedUrl(params)` : utilise `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` pour générer une URL pré-signée PUT
    - Implémenter `deleteFile(fileUrl)` : supprime un fichier S3 via sa clé
    - Configurer le client S3 avec les variables d'environnement (`AWS_S3_BUCKET_NAME`, `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`)
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 7.2_

  - [x] 3.2 Écrire les tests unitaires pour le service d'upload
    - Fichier : `test/unit/lib/services/uploadService.test.ts`
    - Mocker `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner`
    - Tester la génération de presigned URL avec des paramètres valides
    - Tester la suppression de fichier (succès et échec)
    - Tester la gestion d'erreur S3 (connexion échouée)
    - _Exigences : 1.1, 1.3, 1.5, 7.3_

- [x] 4. Implémenter les routes API d'upload
  - [x] 4.1 Créer la route presigned URL `src/app/api/upload/route.ts`
    - Implémenter le handler POST : authentification via Supabase, validation du body avec `uploadRequestSchema`, appel au `uploadService.generatePresignedUrl`, retour de `{ presignedUrl, publicUrl }`
    - Gérer les erreurs : 401 (non authentifié), 400 (validation échouée), 503 (erreur S3)
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.3, 7.5_

  - [x] 4.2 Créer la route de confirmation `src/app/api/upload/confirm/route.ts`
    - Implémenter le handler POST : authentification, validation avec `uploadConfirmSchema`, mise à jour du champ profil correspondant dans Supabase, suppression de l'ancien fichier S3 si existant
    - Implémenter le rollback : si la mise à jour profil échoue, tenter de supprimer le fichier uploadé sur S3
    - _Exigences : 2.6, 7.1, 7.4_

  - [x] 4.3 Écrire les tests unitaires pour les routes API
    - Fichier : `test/unit/api/upload/upload.test.ts`
    - Fichier : `test/unit/api/upload/uploadConfirm.test.ts`
    - Tester : authentification requise (401), upload réussi (200), validation échouée (400), erreur S3 (503)
    - Tester : confirmation réussie, rollback après échec profil, suppression ancien fichier
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.3, 7.4_

- [x] 5. Checkpoint — Vérifier le service et les routes API
  - S'assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

- [x] 6. Implémenter le composant ImageUploader et la section Apparence
  - [x] 6.1 Créer le composant `src/components/shared/ImageUploader.tsx`
    - Implémenter les props : `context`, `currentImageUrl`, `aspectRatio`, `maxSizeMB`, `onUploadSuccess`, `onDelete`
    - Implémenter la sélection de fichier (input file + drag & drop)
    - Implémenter la prévisualisation de l'image actuelle et de la nouvelle sélection
    - Implémenter la validation côté client (type MIME, taille) avec messages d'erreur traduits
    - Implémenter l'upload vers S3 via presigned URL avec indicateur de progression (XMLHttpRequest pour le suivi)
    - Implémenter l'appel à `/api/upload/confirm` après upload réussi
    - Implémenter la suppression d'image (remise à null)
    - Désactiver le bouton pendant l'upload, afficher l'état de chargement
    - Respecter le design glassmorphism avec support dark mode
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.2, 6.3_

  - [x] 6.2 Créer la section `src/components/settings/AppearanceSection.tsx`
    - Intégrer deux instances d'`ImageUploader` : avatar (ratio 1:1, aperçu circulaire) et bannière (ratio 16:5, aperçu rectangulaire)
    - Afficher un avatar par défaut (icône utilisateur) quand aucun avatar n'est défini
    - Afficher un placeholder de bannière (dégradé) quand aucune bannière n'est définie
    - Respecter le design glassmorphism avec support dark mode (utiliser les classes `.glass-*` et les patterns existants)
    - _Exigences : 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 6.3 Intégrer `AppearanceSection` dans `src/components/settings/SettingsContent.tsx`
    - Insérer la section "Apparence" entre la section "Profil" et la section "Sécurité"
    - Passer les données du profil (`avatar_url`, `banner_url`) et le callback de mise à jour
    - _Exigences : 5.1_

- [x] 7. Ajouter les traductions i18n et la configuration next/image
  - [x] 7.1 Ajouter les clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`
    - Ajouter le namespace `upload` avec les messages de validation (taille, format), les messages d'erreur (upload échoué, sauvegarde échouée), les labels (choisir une image, supprimer, etc.)
    - Ajouter les clés `settings.appearance.*` pour la section Apparence (titre, description, labels avatar/bannière)
    - S'assurer que les deux fichiers ont exactement les mêmes clés
    - _Exigences : 6.1, 6.2, 6.3_

  - [x] 7.2 Ajouter le hostname S3 dans `next.config.js`
    - Ajouter `gameuniverse-uploads.s3.eu-west-3.amazonaws.com` dans `remotePatterns` pour `next/image`
    - _Exigences : 4.1, 4.2_

  - [x] 7.3 Écrire le test property-based pour la parité des clés de traduction
    - Fichier : `test/unit/lib/services/uploadService.property.test.ts` (ajouter au fichier existant)
    - **Propriété 8 : Les clés de traduction upload existent dans les deux locales**
    - **Valide : Exigences 6.1, 6.2, 6.3**

- [x] 8. Checkpoint final — Vérifier l'ensemble de la fonctionnalité
  - S'assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

- [x] 9. Lint du code
  - Exécuter `bun run lint`
  - Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - Corriger les erreurs et warnings de lint si nécessaire

- [x] 10. Build de production
  - Exécuter `bun run build`
  - Vérifier qu'il n'y a pas d'erreurs de compilation
  - Corriger les erreurs de build si nécessaire

- [x] 11. README de la fonctionnalité
  - Créer `docs/README_player-avatar-upload.md`
  - Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les cas spécifiques et les scénarios d'erreur
- Le projet utilise Vitest comme framework de test et fast-check v4.5.3 pour les tests property-based
- Tous les tests sont dans le répertoire `test/` (pas de `__tests__/` dans `src/`)
