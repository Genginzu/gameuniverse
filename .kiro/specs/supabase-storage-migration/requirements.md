# Requirements Document

## Introduction

Migration du système d'upload d'images (avatars et bannières de profil) depuis
AWS S3 vers Supabase Storage. Le projet utilise actuellement un flux en 3 étapes
: génération d'une URL présignée S3, upload direct du navigateur vers S3, puis
confirmation côté serveur. L'objectif est de remplacer entièrement la dépendance
AWS S3 par Supabase Storage tout en conservant les mêmes fonctionnalités
utilisateur (sélection de fichier, prévisualisation, progression, confirmation,
suppression).

## Glossaire

- **Upload_Service** : Module serveur (`src/lib/services/uploadService.ts`)
  responsable de la génération d'URL d'upload et de la suppression de fichiers
  dans le stockage distant.
- **Upload_API** : Routes API Next.js (`src/app/api/upload/`) qui exposent les
  endpoints d'upload et de confirmation.
- **Upload_Hook** : Hook React (`src/hooks/useImageUpload.ts`) qui orchestre le
  flux d'upload côté client (sélection, envoi, confirmation).
- **ImageUploader** : Composant React
  (`src/components/shared/ImageUploader.tsx`) fournissant l'interface
  utilisateur d'upload d'images.
- **Upload_Utils** : Module utilitaire (`src/lib/utils/uploadUtils.ts`)
  contenant les fonctions de génération de chemins et d'extraction de clés de
  stockage.
- **Upload_Validation** : Module de validation Zod
  (`src/lib/validations/uploadValidation.ts`) pour les schémas de requêtes
  d'upload.
- **Supabase_Storage** : Service de stockage de fichiers intégré à Supabase,
  utilisé comme remplacement d'AWS S3.
- **Storage_Bucket** : Conteneur Supabase Storage nommé qui héberge les fichiers
  uploadés. Chaque type d'image dispose de son propre bucket dédié.
- **Avatars_Bucket** : Storage_Bucket nommé `avatars`, dédié aux photos de
  profil des utilisateurs.
- **Banners_Bucket** : Storage_Bucket nommé `banners`, dédié aux images de
  bannière/arrière-plan des profils utilisateurs.
- **Upload_Context** : Type discriminant le contexte d'upload (`"avatars"` ou
  `"banners"`), déterminant le bucket de destination.
- **Profil** : Enregistrement utilisateur dans la table `profiles` contenant les
  champs `avatar_url` et `banner_url`.

## Requirements

### Requirement 1 : Création des buckets Supabase Storage par type d'image

**User Story :** En tant que développeur, je veux que chaque type d'image
dispose de son propre bucket Supabase Storage dédié, afin d'organiser clairement
les fichiers par besoin (avatars, bannières) et de faciliter la gestion des
politiques de sécurité.

#### Acceptance Criteria

1. THE Supabase_Storage SHALL disposer d'un Avatars_Bucket nommé `avatars` dédié
   aux photos de profil des utilisateurs.
2. THE Supabase_Storage SHALL disposer d'un Banners_Bucket nommé `banners` dédié
   aux images de bannière/arrière-plan des profils.
3. THE Avatars_Bucket SHALL organiser les fichiers selon le pattern
   `{userId}/{timestamp}-{randomId}.{extension}`.
4. THE Banners_Bucket SHALL organiser les fichiers selon le pattern
   `{userId}/{timestamp}-{randomId}.{extension}`.
5. WHEN un fichier est uploadé dans un Storage_Bucket, THE Supabase_Storage
   SHALL rendre le fichier accessible via une URL publique.
6. WHEN un nouveau type d'image est ajouté au projet, THE Upload_Service SHALL
   permettre l'ajout d'un nouveau bucket dédié sans modifier la logique
   existante.

### Requirement 2 : Remplacement du service d'upload S3

**User Story :** En tant que développeur, je veux remplacer le service d'upload
S3 par Supabase Storage, afin d'éliminer la dépendance AWS.

#### Acceptance Criteria

1. THE Upload_Service SHALL utiliser le client Supabase Storage au lieu du
   client AWS S3 pour toutes les opérations de stockage.
2. WHEN une demande d'upload est reçue, THE Upload_Service SHALL sélectionner le
   Storage_Bucket correspondant à l'Upload_Context (`avatars` ou `banners`) et
   générer une URL signée Supabase Storage permettant l'upload direct depuis le
   navigateur.
3. THE Upload_Service SHALL retourner l'URL signée et l'URL publique finale du
   fichier.
4. WHEN une demande de suppression est reçue, THE Upload_Service SHALL supprimer
   le fichier correspondant du Storage_Bucket Supabase.
5. IF le client Supabase Storage retourne une erreur, THEN THE Upload_Service
   SHALL propager une erreur descriptive.

### Requirement 3 : Adaptation de la route API d'upload

**User Story :** En tant que développeur, je veux que la route API d'upload
utilise Supabase Storage, afin que le endpoint reste fonctionnel avec le nouveau
backend de stockage.

#### Acceptance Criteria

1. WHEN un utilisateur authentifié envoie une requête POST à `/api/upload`, THE
   Upload_API SHALL retourner une URL signée Supabase Storage et l'URL publique
   du fichier.
2. WHEN un utilisateur non authentifié envoie une requête POST à `/api/upload`,
   THE Upload_API SHALL retourner une erreur 401.
3. WHEN la requête contient un `contentType` non autorisé, THE Upload_API SHALL
   retourner une erreur 400.
4. WHEN la requête contient un `fileSize` dépassant 5 Mo, THE Upload_API SHALL
   retourner une erreur 400.
5. IF la génération de l'URL signée Supabase échoue, THEN THE Upload_API SHALL
   retourner une erreur 503.

### Requirement 4 : Adaptation de la route API de confirmation

**User Story :** En tant que développeur, je veux que la route de confirmation
d'upload fonctionne avec les URLs Supabase Storage, afin que la mise à jour du
profil reste cohérente.

#### Acceptance Criteria

1. WHEN un utilisateur authentifié confirme un upload avec une URL publique
   Supabase valide, THE Upload_API SHALL mettre à jour le champ correspondant du
   Profil (`avatar_url` ou `banner_url`).
2. IF la mise à jour du Profil échoue, THEN THE Upload_API SHALL supprimer le
   fichier nouvellement uploadé du Storage_Bucket correspondant à
   l'Upload_Context (rollback).
3. WHEN le Profil possède déjà une image et qu'une nouvelle image est confirmée,
   THE Upload_API SHALL supprimer l'ancienne image du Storage_Bucket
   correspondant à l'Upload_Context.
4. IF la suppression de l'ancienne image échoue, THEN THE Upload_API SHALL
   journaliser l'erreur sans bloquer la réponse.

### Requirement 5 : Adaptation du hook client d'upload

**User Story :** En tant que développeur, je veux que le hook `useImageUpload`
fonctionne avec Supabase Storage, afin que le flux d'upload côté client reste
opérationnel.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne un fichier, THE Upload_Hook SHALL valider le
   type MIME et la taille du fichier avant tout envoi.
2. WHEN l'utilisateur confirme l'upload, THE Upload_Hook SHALL envoyer le
   fichier directement vers Supabase Storage via l'URL signée.
3. WHILE l'upload est en cours, THE Upload_Hook SHALL exposer la progression en
   pourcentage.
4. IF l'upload vers Supabase Storage échoue, THEN THE Upload_Hook SHALL exposer
   un message d'erreur exploitable.
5. WHEN l'upload et la confirmation réussissent, THE Upload_Hook SHALL appeler
   le callback `onUploadSuccess` avec l'URL publique Supabase.

### Requirement 6 : Adaptation des utilitaires d'upload

**User Story :** En tant que développeur, je veux que les fonctions utilitaires
d'upload génèrent des chemins compatibles Supabase Storage, afin que la
structure de stockage soit cohérente.

#### Acceptance Criteria

1. THE Upload_Utils SHALL générer des chemins de stockage au format
   `{userId}/{timestamp}-{randomId}.{extension}`, le bucket de destination étant
   déterminé par l'Upload_Context.
2. THE Upload_Utils SHALL résoudre le nom du Storage_Bucket à partir de
   l'Upload_Context (`"avatars"` → bucket `avatars`, `"banners"` → bucket
   `banners`).
3. THE Upload_Utils SHALL extraire le chemin de stockage et le nom du bucket à
   partir d'une URL publique Supabase Storage.
4. WHEN une URL ne correspond pas au format Supabase Storage attendu, THE
   Upload_Utils SHALL retourner `null`.
5. THE Upload_Utils SHALL conserver la fonction `getExtensionFromMimeType` sans
   modification.

### Requirement 7 : Suppression de la dépendance AWS S3

**User Story :** En tant que développeur, je veux supprimer toute dépendance AWS
S3 du projet, afin de simplifier la maintenance et réduire les coûts.

#### Acceptance Criteria

1. THE Upload_Service SHALL fonctionner sans les packages `@aws-sdk/client-s3`
   et `@aws-sdk/s3-request-presigner`.
2. THE Upload_Service SHALL fonctionner sans les variables d'environnement
   `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` et
   `AWS_S3_REGION`.
3. THE Upload_Utils SHALL fonctionner sans référence au nom de bucket S3 ni au
   préfixe d'URL S3.

### Requirement 8 : Mise à jour des types et validations

**User Story :** En tant que développeur, je veux que les types et schémas de
validation reflètent le nouveau backend Supabase Storage, afin de maintenir la
cohérence du typage.

#### Acceptance Criteria

1. THE Upload_Validation SHALL valider les URLs publiques Supabase Storage dans
   le schéma de confirmation.
2. THE Upload_Service SHALL utiliser des types adaptés à Supabase Storage
   (remplacement de `s3Key` par `storagePath`).
3. THE Upload_Service SHALL conserver les types `UploadContext`,
   `AllowedMimeType` et `MAX_FILE_SIZE_BYTES` sans modification.

### Requirement 9 : Mise à jour des tests

**User Story :** En tant que développeur, je veux que tous les tests existants
soient adaptés à Supabase Storage, afin de maintenir la couverture de tests.

#### Acceptance Criteria

1. THE Upload_Service tests SHALL mocker le client Supabase Storage au lieu du
   client AWS S3.
2. THE Upload_Utils tests SHALL valider la génération de chemins, la résolution
   du nom de bucket à partir de l'Upload_Context, et l'extraction de chemins à
   partir d'URLs Supabase Storage.
3. THE Upload_Validation tests SHALL utiliser des URLs Supabase Storage dans les
   cas de test.
4. WHEN tous les tests sont exécutés, THE test suite SHALL passer sans erreur.

### Requirement 10 : Politiques de sécurité des Storage_Buckets

**User Story :** En tant que développeur, je veux que chaque bucket Supabase
Storage soit protégé par des politiques RLS, afin que seuls les utilisateurs
authentifiés puissent uploader et que les fichiers soient publiquement lisibles.

#### Acceptance Criteria

1. THE Avatars_Bucket et THE Banners_Bucket SHALL autoriser la lecture publique
   des fichiers (politique SELECT pour `anon` et `authenticated`).
2. THE Avatars_Bucket et THE Banners_Bucket SHALL autoriser l'upload uniquement
   aux utilisateurs authentifiés (politique INSERT pour `authenticated`).
3. THE Avatars_Bucket et THE Banners_Bucket SHALL autoriser la suppression
   uniquement aux utilisateurs authentifiés qui possèdent le fichier (politique
   DELETE pour `authenticated` avec vérification du chemin utilisateur).
4. THE Avatars_Bucket et THE Banners_Bucket SHALL limiter les types MIME
   acceptés aux formats `image/jpeg`, `image/png`, `image/webp` et `image/gif`.
5. THE Avatars_Bucket et THE Banners_Bucket SHALL limiter la taille maximale des
   fichiers à 5 Mo.
