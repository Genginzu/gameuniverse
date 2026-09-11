# Plan d'implémentation : Migration vers Supabase Storage

## Vue d'ensemble

Migration incrémentale du système d'upload d'images depuis AWS S3 vers Supabase Storage. Chaque étape construit sur la précédente, en commençant par les fondations (types, utilitaires, migration SQL), puis le service serveur, les routes API, et enfin le hook client. Les tests accompagnent chaque étape.

## Tâches

- [x] 1. Mettre à jour les types et créer la migration SQL
  - [x] 1.1 Mettre à jour les types dans `src/types/upload.ts`
    - Remplacer `PresignedUrlParams` par `SignedUploadUrlParams` (context, userId, contentType, extension)
    - Remplacer `PresignedUrlResult` par `SignedUploadUrlResult` (signedUrl, publicUrl, storagePath)
    - Conserver `UploadContext`, `AllowedMimeType`, `MAX_FILE_SIZE_BYTES`, `ALLOWED_CONTEXTS`, `ALLOWED_MIME_TYPES`, `CONTEXT_TO_PROFILE_FIELD` sans modification
    - _Requirements: 8.2, 8.3_

  - [x] 1.2 Créer la migration SQL `supabase/migrations/20240316000001_create_storage_buckets.sql`
    - Créer les buckets `avatars` et `banners` (publics) via `INSERT INTO storage.buckets`
    - Ajouter les politiques RLS : SELECT pour `anon` et `authenticated`, INSERT pour `authenticated`, DELETE pour `authenticated` avec vérification `auth.uid()::text = (storage.foldername(name))[1]`
    - Contraintes MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) et taille max 5 Mo
    - _Requirements: 1.1, 1.2, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Adapter les utilitaires d'upload et leurs tests
  - [x] 2.1 Réécrire `src/lib/utils/uploadUtils.ts`
    - Adapter `generateStoragePath(userId, extension)` pour produire `{userId}/{timestamp}-{randomId}.{extension}`
    - Ajouter `getBucketName(context: UploadContext): string` pour résoudre le nom du bucket
    - Remplacer `extractS3KeyFromUrl` par `extractStoragePathFromUrl(url)` retournant `{ bucket, path } | null`
    - Conserver `getExtensionFromMimeType` sans modification
    - Supprimer toute référence à S3 (nom de bucket S3, préfixe d'URL S3)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.3_

  - [x] 2.2 Mettre à jour les tests unitaires dans `test/unit/lib/utils/uploadUtils.test.ts`
    - Tester `generateStoragePath` avec des UUIDs et extensions valides
    - Tester `getBucketName` pour chaque contexte
    - Tester `extractStoragePathFromUrl` avec des URLs Supabase valides et invalides
    - Tester `getExtensionFromMimeType` (inchangé)
    - _Requirements: 9.2_

  - [x] 2.3 Écrire le test de propriété P1 : Pattern de chemin de stockage
    - **Property 1 : Storage path pattern**
    - Générateur : `fc.uuid()` × `fc.constantFrom("jpg","png","webp","gif")`
    - Vérifier que le chemin correspond au regex `^{userId}/\d+-[a-z0-9]+\.{ext}$`
    - Fichier : `test/unit/lib/utils/uploadUtils.test.ts` (section propriétés)
    - **Validates: Requirements 1.3, 1.4, 6.1**

  - [x] 2.4 Écrire le test de propriété P2 : Résolution du nom de bucket
    - **Property 2 : Bucket name resolution**
    - Générateur : `fc.constantFrom("avatars", "banners")`
    - Vérifier que `getBucketName` retourne le nom de bucket correspondant
    - Fichier : `test/unit/lib/utils/uploadUtils.test.ts` (section propriétés)
    - **Validates: Requirements 2.2, 6.2**

  - [x] 2.5 Écrire le test de propriété P5 : Round-trip URL publique ↔ extraction
    - **Property 5 : Round-trip public URL ↔ extraction**
    - Générateur : bucket × path valides → construire URL → `extractStoragePathFromUrl` → vérifier bucket et path d'origine
    - Générateur : `fc.string()` non-Supabase → `extractStoragePathFromUrl` retourne `null`
    - Fichier : `test/unit/lib/utils/uploadUtils.test.ts` (section propriétés)
    - **Validates: Requirements 6.3, 6.4**

  - [x] 2.6 Écrire le test de propriété P6 : Unicité des chemins générés
    - **Property 6 : Path uniqueness**
    - Générateur : `fc.uuid()` × `fc.constantFrom("jpg","png","webp","gif")`
    - Vérifier que deux appels consécutifs produisent des chemins différents
    - Fichier : `test/unit/lib/utils/uploadUtils.test.ts` (section propriétés)
    - **Validates: Requirements 1.3, 1.4**

- [x] 3. Adapter le service d'upload et ses tests
  - [x] 3.1 Réécrire `src/lib/services/uploadService.ts`
    - Remplacer le client S3 par un client Supabase admin (service role, lazy-initialized)
    - Implémenter `generateSignedUploadUrl(params)` utilisant `storage.from(bucket).createSignedUploadUrl(path)`
    - Construire l'URL publique au format `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`
    - Implémenter `deleteFile(fileUrl)` utilisant `extractStoragePathFromUrl` puis `storage.from(bucket).remove([path])`
    - Supprimer toute référence à AWS S3 (`S3Client`, `PutObjectCommand`, `DeleteObjectCommand`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2_

  - [x] 3.2 Mettre à jour les tests unitaires dans `test/unit/lib/services/uploadService.test.ts`
    - Mocker le client Supabase Storage au lieu du client AWS S3
    - Tester `generateSignedUploadUrl` : appel correct à `createSignedUploadUrl`, retour de l'URL signée et publique
    - Tester `deleteFile` : appel correct à `remove`, gestion d'URL invalide
    - Tester la propagation d'erreurs Supabase
    - _Requirements: 9.1_

  - [x] 3.3 Écrire le test de propriété P3 : Validation des types MIME
    - **Property 3 : MIME type validation**
    - Générateur : `fc.string()` → `isAllowedMimeType` retourne `true` ssi dans la liste autorisée
    - Fichier : `test/unit/lib/services/uploadService.property.test.ts`
    - **Validates: Requirements 3.3, 5.1, 10.4**

  - [x] 3.4 Écrire le test de propriété P4 : Validation de la taille de fichier
    - **Property 4 : File size validation**
    - Générateur : `fc.integer()` → `isValidFileSize` retourne `true` ssi `0 < n <= 5_242_880`
    - Fichier : `test/unit/lib/services/uploadService.property.test.ts`
    - **Validates: Requirements 3.4, 10.5**

- [x] 4. Checkpoint — Vérifier les fondations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Adapter la validation et les routes API
  - [x] 5.1 Mettre à jour `src/lib/validations/uploadValidation.ts`
    - Adapter le schéma de confirmation pour valider les URLs publiques Supabase Storage au lieu des URLs S3
    - Conserver les validations de MIME type, taille et contexte
    - _Requirements: 8.1_

  - [x] 5.2 Mettre à jour les tests de validation dans `test/unit/lib/validations/uploadValidation.test.ts`
    - Remplacer les URLs S3 par des URLs Supabase Storage dans les cas de test
    - Tester la validation d'URLs Supabase valides et invalides
    - _Requirements: 9.3_

  - [x] 5.3 Adapter la route API d'upload `src/app/api/upload/route.ts`
    - Appeler `uploadService.generateSignedUploadUrl` avec les nouveaux paramètres
    - Retourner `signedUrl` et `publicUrl` (au lieu de `presignedUrl` et `publicUrl`)
    - Conserver la vérification d'authentification (401), la validation Zod (400), et la gestion d'erreur service (503)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.4 Adapter la route API de confirmation `src/app/api/upload/confirm/route.ts`
    - Utiliser `extractStoragePathFromUrl` pour extraire bucket et path depuis l'URL publique Supabase
    - Conserver le rollback (suppression du fichier si mise à jour profil échoue)
    - Conserver la suppression de l'ancienne image avec log d'erreur fire-and-forget
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.5 Mettre à jour les tests des routes API
    - Adapter `test/unit/api/upload/upload.test.ts` : mocker le service Supabase, vérifier les réponses
    - Adapter `test/unit/api/upload/uploadConfirm.test.ts` : URLs Supabase, rollback, suppression ancienne image
    - _Requirements: 9.1, 9.3_

- [x] 6. Adapter le hook client d'upload
  - [x] 6.1 Réécrire la méthode d'upload dans `src/hooks/useImageUpload.ts`
    - Remplacer `uploadToS3` par `uploadToStorage` utilisant `fetch PUT` vers l'URL signée Supabase avec header `Content-Type`
    - Conserver la validation côté client (MIME type, taille) avant envoi
    - Conserver l'exposition de la progression en pourcentage via `XMLHttpRequest`
    - Conserver l'appel au callback `onUploadSuccess` avec l'URL publique Supabase
    - Adapter les messages d'erreur (`storageUploadFailed` au lieu de `s3UploadFailed`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Supprimer les dépendances AWS S3
  - [x] 7.1 Supprimer les packages AWS du projet
    - Exécuter `bun remove @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
    - Vérifier qu'aucune importation `@aws-sdk` ne subsiste dans le code source
    - _Requirements: 7.1_

  - [x] 7.2 Nettoyer les variables d'environnement
    - Supprimer `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_S3_REGION` des fichiers `.env.example` et `.env.local` (si présents)
    - S'assurer que `SUPABASE_SERVICE_ROLE_KEY` est documentée dans `.env.example`
    - _Requirements: 7.2_

- [x] 8. Checkpoint final — Vérifier l'ensemble
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Lint du code
  - [x] 9.1 Exécuter `bun run lint`
  - [x] 9.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 9.3 Corriger les erreurs et warnings de lint si nécessaire

- [x] 10. Build de production
  - [x] 10.1 Exécuter `bun run build`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 10.3 Corriger les erreurs de build si nécessaire

- [x] 11. README de la fonctionnalité
  - [x] 11.1 Créer `docs/README_supabase_storage_migration.md`
    - Description : résumé de la migration S3 → Supabase Storage
    - Accès : endpoints API `/api/upload` et `/api/upload/confirm`, composant `ImageUploader`
    - Prérequis : `SUPABASE_SERVICE_ROLE_KEY` configurée, migration SQL appliquée
    - Utilisation : flux d'upload (sélection, envoi via URL signée, confirmation)

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les tests de propriétés valident les propriétés universelles de correction (P1–P6 du design)
- Les tests unitaires valident les exemples spécifiques et cas d'erreur
- Lancer les tests avec `bun run test:all` (ne jamais ajouter `2>&1`)
