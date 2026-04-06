# Migration S3 → Supabase Storage

## Description

Remplacement complet d'AWS S3 par Supabase Storage pour l'upload d'images
(avatars et bannières de profil). Le flux utilisateur reste identique :
sélection de fichier, upload direct via URL signée, confirmation côté serveur.
Deux buckets dédiés (`avatars` et `banners`) organisent les fichiers avec des
politiques RLS pour la sécurité.

## Accès

### Endpoints API

| Endpoint              | Méthode | Description                                          |
| --------------------- | ------- | ---------------------------------------------------- |
| `/api/upload`         | POST    | Génère une URL signée Supabase et l'URL publique     |
| `/api/upload/confirm` | POST    | Met à jour le profil avec l'URL de la nouvelle image |

### Composant

Le composant `ImageUploader` (`src/components/shared/ImageUploader.tsx`) fournit
l'interface d'upload. Il utilise le hook `useImageUpload`
(`src/hooks/useImageUpload.ts`) qui orchestre le flux complet côté client.

## Prérequis

1. **Variable d'environnement** : `SUPABASE_SERVICE_ROLE_KEY` doit être
   configurée (utilisée par le client admin pour générer les URL signées et
   supprimer des fichiers).

2. **Migration SQL** : la migration
   `supabase/migrations/20240316000001_create_storage_buckets.sql` doit être
   appliquée. Elle crée les buckets `avatars` et `banners` avec les politiques
   RLS suivantes :
   - Lecture publique (SELECT) pour tous
   - Upload (INSERT) réservé aux utilisateurs authentifiés
   - Suppression (DELETE) réservée au propriétaire du fichier
   - Types MIME autorisés : `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - Taille maximale : 5 Mo

## Utilisation — Flux d'upload

```
1. Sélection     L'utilisateur choisit un fichier via ImageUploader.
                  Le hook valide le type MIME et la taille côté client.

2. URL signée    Le client envoie POST /api/upload {context, contentType, fileSize}.
                  Le serveur génère une URL signée via Supabase Storage
                  et retourne {signedUrl, publicUrl}.

3. Upload        Le client envoie le fichier directement vers Supabase Storage
                  via PUT sur l'URL signée (avec progression en temps réel).

4. Confirmation  Le client envoie POST /api/upload/confirm {context, publicUrl}.
                  Le serveur met à jour le profil (avatar_url ou banner_url).
                  L'ancienne image est supprimée automatiquement.
```

## Architecture des fichiers

| Fichier                                   | Rôle                                     |
| ----------------------------------------- | ---------------------------------------- |
| `src/types/upload.ts`                     | Types (`SignedUploadUrlParams`, etc.)    |
| `src/lib/utils/uploadUtils.ts`            | Génération de chemins, extraction d'URLs |
| `src/lib/services/uploadService.ts`       | Client Supabase admin, URL signées       |
| `src/lib/validations/uploadValidation.ts` | Schémas Zod de validation                |
| `src/app/api/upload/route.ts`             | Route API génération URL signée          |
| `src/app/api/upload/confirm/route.ts`     | Route API confirmation d'upload          |
| `src/hooks/useImageUpload.ts`             | Hook client orchestrant le flux          |
| `src/components/shared/ImageUploader.tsx` | Composant UI d'upload                    |
