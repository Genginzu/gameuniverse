# Upload Avatar & Bannière Joueur

## Description

Système d'upload d'images (avatar et bannière) pour les profils joueurs,
utilisant AWS S3 avec des URLs pré-signées. L'architecture repose sur un
composant `ImageUploader` réutilisable et un service d'upload générique, conçus
pour être étendus à d'autres contextes d'upload (collections, posts, etc.).

Le flux d'upload suit le pattern **presigned URL** : le client demande une URL
pré-signée au serveur, puis uploade directement vers S3 depuis le navigateur,
sans faire transiter le fichier par le serveur Next.js.

## Accès

Page Paramètres → section **Apparence** (entre Profil et Sécurité).

Route : `/[locale]/settings/`

## Prérequis

- **Bucket AWS S3** configuré (voir le guide détaillé dans `requirements.md` de
  la spec)
- **Variables d'environnement** dans `.env.local` :
  ```
  AWS_S3_BUCKET_NAME=gameuniverse-uploads
  AWS_S3_REGION=eu-west-3
  AWS_S3_ACCESS_KEY_ID=AKIA...
  AWS_S3_SECRET_ACCESS_KEY=...
  ```
- **CORS S3** configuré pour autoriser les requêtes PUT depuis le domaine de
  l'application
- **Packages npm** : `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner`

## Utilisation

1. Naviguer vers **Paramètres → Apparence**
2. Cliquer sur la zone avatar ou bannière, ou glisser-déposer une image
3. Formats supportés : JPEG, PNG, WebP, GIF (max 5 Mo)
4. Cliquer **Confirmer** pour uploader, ou **Annuler** pour abandonner
5. Cliquer **Supprimer** pour retirer l'image actuelle

## Architecture

| Élément             | Chemin                                                              |
| ------------------- | ------------------------------------------------------------------- |
| Types partagés      | `src/types/upload.ts`                                               |
| Validations Zod     | `src/lib/validations/uploadValidation.ts`                           |
| Utilitaires         | `src/lib/utils/uploadUtils.ts`                                      |
| Service S3          | `src/lib/services/uploadService.ts`                                 |
| Route presigned URL | `src/app/api/upload/route.ts`                                       |
| Route confirmation  | `src/app/api/upload/confirm/route.ts`                               |
| Composant upload    | `src/components/shared/ImageUploader.tsx`                           |
| Section Apparence   | `src/components/settings/AppearanceSection.tsx`                     |
| Hook upload         | `src/hooks/useImageUpload.ts`                                       |
| Traductions FR      | `src/messages/fr.json` (namespace `upload` + `settings.appearance`) |
| Traductions EN      | `src/messages/en.json` (namespace `upload` + `settings.appearance`) |
