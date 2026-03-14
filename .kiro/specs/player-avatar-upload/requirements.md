# Document de Exigences — Upload Avatar & Bannière Joueur

## Introduction

Cette fonctionnalité permet aux joueurs d'uploader un avatar et une image de
bannière depuis l'onglet Paramètres de leur profil. Les images sont stockées
dans un bucket AWS S3 (tier gratuit 5 Go). Le service d'upload est conçu de
manière générique et réutilisable pour d'autres contextes d'upload d'images dans
le futur (ex : images de collections, posts, etc.).

### Guide de mise en place du bucket S3

#### 1. Créer le bucket S3

1. Se connecter à la console AWS → S3 → **Create bucket**
2. Nom du bucket : `gameuniverse-uploads` (ou un nom unique)
3. Région : `eu-west-3` (Paris) ou la région la plus proche des utilisateurs
4. **Object Ownership** : ACLs disabled (recommandé)
5. **Block Public Access** : décocher "Block all public access" et cocher
   uniquement "Block public access to buckets and objects granted through new
   access control lists (ACLs)"
6. Laisser le versioning désactivé
7. Chiffrement : SSE-S3 (par défaut)

#### 2. Configurer la politique du bucket (Bucket Policy)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::gameuniverse-uploads/public/*"
    }
  ]
}
```

Cela permet la lecture publique uniquement des fichiers dans le préfixe
`public/` (avatars, bannières).

#### 3. Configurer CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:3000", "https://votre-domaine.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

#### 4. Créer un utilisateur IAM

1. IAM → Users → **Create user** : `gameuniverse-s3-uploader`
2. Attacher une politique inline :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::gameuniverse-uploads/public/*"
    }
  ]
}
```

3. Créer une **Access Key** (type : Application running outside AWS)
4. Copier l'Access Key ID et le Secret Access Key

#### 5. Variables d'environnement

Ajouter dans `.env.local` :

```
AWS_S3_BUCKET_NAME=gameuniverse-uploads
AWS_S3_REGION=eu-west-3
AWS_S3_ACCESS_KEY_ID=AKIA...
AWS_S3_SECRET_ACCESS_KEY=...
```

#### 6. Surveillance du tier gratuit

Le tier gratuit AWS S3 offre :

- 5 Go de stockage standard
- 20 000 requêtes GET / mois
- 2 000 requêtes PUT / mois

Configurer une alerte de facturation dans AWS Budgets pour éviter les
dépassements.

---

## Glossaire

- **Upload_Service** : Service générique côté serveur responsable de l'upload de
  fichiers vers AWS S3, de la génération d'URLs publiques et de la suppression
  de fichiers. Conçu pour être réutilisable dans différents contextes (avatars,
  bannières, images de collections, etc.).
- **Image_Uploader** : Composant React réutilisable permettant à l'utilisateur
  de sélectionner, prévisualiser et soumettre une image pour upload.
- **Upload_API** : Route API Next.js (`/api/upload`) qui reçoit les fichiers,
  les valide et délègue le stockage au Upload_Service.
- **Settings_Page** : Page de paramètres du joueur (`/[locale]/settings/`)
  contenant les formulaires de profil, sécurité et la nouvelle section
  d'apparence.
- **Profil** : Enregistrement dans la table `profiles` de Supabase contenant les
  données du joueur, incluant `avatar_url` et `banner_url`.
- **Presigned_URL** : URL pré-signée générée côté serveur permettant un upload
  direct du navigateur vers S3 sans exposer les credentials.

## Exigences

### Exigence 1 : Service d'upload générique vers S3

**User Story :** En tant que développeur, je veux un service d'upload générique
vers S3, afin de pouvoir réutiliser la logique d'upload pour différents types
d'images dans le projet.

#### Critères d'acceptation

1. THE Upload_Service SHALL générer une URL pré-signée (presigned PUT URL) pour
   permettre l'upload direct du navigateur vers S3
2. THE Upload_Service SHALL organiser les fichiers dans S3 avec un chemin
   structuré suivant le pattern
   `public/{context}/{userId}/{timestamp}-{randomId}.{extension}` (ex :
   `public/avatars/uuid-123/1700000000-abc123.webp`)
3. THE Upload_Service SHALL supprimer l'ancien fichier S3 lorsqu'un nouveau
   fichier remplace un existant pour le même contexte et utilisateur
4. THE Upload_Service SHALL accepter un paramètre de contexte (ex : `avatars`,
   `banners`, `collections`) pour déterminer le sous-dossier S3
5. THE Upload_Service SHALL retourner l'URL publique complète du fichier uploadé
   après un upload réussi

### Exigence 2 : Route API d'upload

**User Story :** En tant que développeur front-end, je veux une route API
d'upload sécurisée, afin de pouvoir envoyer des images depuis le navigateur de
manière authentifiée.

#### Critères d'acceptation

1. WHEN un utilisateur authentifié envoie une requête POST à l'Upload_API avec
   un contexte et un type MIME, THE Upload_API SHALL retourner une URL
   pré-signée et l'URL publique finale du fichier
2. WHEN un utilisateur non authentifié envoie une requête à l'Upload_API, THE
   Upload_API SHALL retourner une erreur 401
3. THE Upload_API SHALL valider que le type MIME du fichier est une image
   autorisée (image/jpeg, image/png, image/webp, image/gif)
4. THE Upload_API SHALL valider que la taille déclarée du fichier ne dépasse pas
   5 Mo
5. IF le contexte fourni est invalide ou manquant, THEN THE Upload_API SHALL
   retourner une erreur 400 avec un message descriptif
6. WHEN un upload est effectué avec le contexte `avatars` ou `banners`, THE
   Upload_API SHALL mettre à jour le champ correspondant (`avatar_url` ou
   `banner_url`) dans le Profil de l'utilisateur

### Exigence 3 : Validation et traitement des images

**User Story :** En tant que joueur, je veux que mes images soient validées
avant l'upload, afin d'éviter les erreurs et garantir une bonne qualité
d'affichage.

#### Critères d'acceptation

1. THE Image_Uploader SHALL valider côté client que le fichier sélectionné est
   une image (jpeg, png, webp, gif)
2. THE Image_Uploader SHALL valider côté client que la taille du fichier ne
   dépasse pas 5 Mo
3. THE Image_Uploader SHALL afficher un message d'erreur traduit (FR/EN) lorsque
   la validation échoue
4. IF le fichier sélectionné dépasse 5 Mo, THEN THE Image_Uploader SHALL
   afficher un message indiquant la taille maximale autorisée
5. IF le fichier sélectionné n'est pas un format d'image autorisé, THEN THE
   Image_Uploader SHALL afficher un message listant les formats acceptés

### Exigence 4 : Composant d'upload d'image réutilisable

**User Story :** En tant que développeur, je veux un composant d'upload d'image
réutilisable, afin de l'intégrer facilement dans différentes pages du projet.

#### Critères d'acceptation

1. THE Image_Uploader SHALL afficher une prévisualisation de l'image actuelle
   lorsqu'une URL existe déjà
2. THE Image_Uploader SHALL afficher une prévisualisation de la nouvelle image
   sélectionnée avant la confirmation de l'upload
3. THE Image_Uploader SHALL afficher un indicateur de progression pendant
   l'upload vers S3
4. THE Image_Uploader SHALL accepter des props configurables : contexte
   d'upload, ratio d'aspect (1:1 pour avatar, 16:5 pour bannière), taille
   maximale, et callback de succès
5. THE Image_Uploader SHALL respecter le design system glassmorphism du projet
   avec support du dark mode
6. THE Image_Uploader SHALL permettre la suppression de l'image actuelle en
   remettant l'URL à null
7. WHEN l'upload est en cours, THE Image_Uploader SHALL désactiver le bouton de
   soumission et afficher un état de chargement

### Exigence 5 : Intégration dans la page Paramètres

**User Story :** En tant que joueur, je veux pouvoir modifier mon avatar et ma
bannière depuis mes paramètres, afin de personnaliser mon profil.

#### Critères d'acceptation

1. THE Settings_Page SHALL afficher une nouvelle section "Apparence" entre les
   sections "Profil" et "Sécurité"
2. THE Settings_Page SHALL afficher l'upload d'avatar avec un aperçu circulaire
   (ratio 1:1)
3. THE Settings_Page SHALL afficher l'upload de bannière avec un aperçu
   rectangulaire (ratio 16:5)
4. WHEN un avatar est uploadé avec succès, THE Settings_Page SHALL mettre à jour
   l'aperçu immédiatement sans rechargement de page
5. WHEN une bannière est uploadée avec succès, THE Settings_Page SHALL mettre à
   jour l'aperçu immédiatement sans rechargement de page
6. THE Settings_Page SHALL afficher un avatar par défaut (icône utilisateur)
   lorsqu'aucun avatar n'est défini
7. THE Settings_Page SHALL afficher un placeholder de bannière (dégradé)
   lorsqu'aucune bannière n'est définie

### Exigence 6 : Traductions i18n

**User Story :** En tant que joueur francophone ou anglophone, je veux que tous
les textes liés à l'upload soient traduits, afin de comprendre l'interface dans
ma langue.

#### Critères d'acceptation

1. THE Settings_Page SHALL afficher tous les labels, messages d'erreur et textes
   d'aide en français et en anglais via next-intl
2. THE Image_Uploader SHALL afficher les messages de validation (taille, format)
   traduits dans la langue active
3. WHEN une erreur d'upload survient, THE Image_Uploader SHALL afficher un
   message d'erreur traduit décrivant le problème

### Exigence 7 : Sécurité et gestion des erreurs

**User Story :** En tant que joueur, je veux que l'upload soit sécurisé et que
les erreurs soient gérées proprement, afin de protéger mon compte et comprendre
les problèmes.

#### Critères d'acceptation

1. THE Upload_API SHALL vérifier que l'utilisateur authentifié ne peut uploader
   que pour son propre profil
2. THE Upload_Service SHALL générer des noms de fichiers uniques incluant un
   identifiant aléatoire pour éviter les collisions et l'énumération
3. IF la connexion à S3 échoue, THEN THE Upload_API SHALL retourner une erreur
   503 avec un message indiquant une indisponibilité temporaire
4. IF la mise à jour du Profil échoue après un upload S3 réussi, THEN THE
   Upload_API SHALL tenter de supprimer le fichier uploadé sur S3 pour éviter
   les fichiers orphelins
5. THE Upload_API SHALL limiter les contextes autorisés à une liste prédéfinie
   configurable (avatars, banners)
