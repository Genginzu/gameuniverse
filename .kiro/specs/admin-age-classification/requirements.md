# Document d'exigences — Administration des classifications d'âge

## Introduction

Cette fonctionnalité permet aux administrateurs de gérer les classifications
d'âge des jeux vidéo depuis le panneau d'administration. Elle couvre la gestion
complète (CRUD) des systèmes de classification (PEGI, ESRB, CERO, USK…), des
notes individuelles au sein de chaque système, et des descripteurs de contenu
avec leurs traductions multilingues. La page est accessible à
`/[locale]/admin/age-classifications` et suit les conventions CRUD admin
existantes du projet.

## Glossaire

- **Système_de_Classification** : Un organisme de classification d'âge (ex.
  PEGI, ESRB, CERO, USK). Correspond à la table `rating_systems`.
- **Note** : Une note d'âge individuelle au sein d'un système (ex. PEGI 3, PEGI
  7, ESRB E, ESRB T). Correspond à la table `ratings`.
- **Descripteur_de_Contenu** : Un descripteur décrivant le type de contenu d'un
  jeu (ex. Violence, Langage, Peur). Correspond à la table
  `content_descriptors`.
- **Traduction_Descripteur** : La traduction d'un descripteur de contenu dans
  une langue supportée. Correspond à la table `content_descriptor_translations`.
- **Administrateur** : Un utilisateur authentifié avec le rôle admin, vérifié
  via `requireAdmin()`.
- **Page_Classifications** : La page d'administration accessible à
  `/[locale]/admin/age-classifications`.
- **Formulaire_Système** : Le formulaire de création/édition d'un système de
  classification.
- **Formulaire_Note** : Le formulaire de création/édition d'une note.
- **Formulaire_Descripteur** : Le formulaire de création/édition d'un
  descripteur de contenu.

## Exigences

### Exigence 1 : Navigation et accès à la page

**User Story :** En tant qu'administrateur, je veux accéder à la gestion des
classifications d'âge depuis la barre latérale admin, afin de pouvoir gérer les
systèmes de classification rapidement.

#### Critères d'acceptation

1. WHEN un administrateur accède au panneau admin, THE Page_Classifications
   SHALL être accessible via un lien dans la barre latérale sous la catégorie «
   Jeux »
2. WHEN un utilisateur non-admin tente d'accéder à la Page_Classifications, THE
   Système SHALL refuser l'accès et retourner une erreur 403

### Exigence 2 : Lister les systèmes de classification

**User Story :** En tant qu'administrateur, je veux voir la liste de tous les
systèmes de classification, afin d'avoir une vue d'ensemble des organismes
configurés.

#### Critères d'acceptation

1. WHEN un administrateur visite la Page_Classifications, THE Système SHALL
   afficher la liste des systèmes de classification avec leur code, nom, pays et
   URL du site web
2. WHEN un administrateur saisit un terme de recherche, THE Système SHALL
   filtrer les systèmes de classification dont le code ou le nom correspond au
   terme
3. WHEN un administrateur clique sur un en-tête de colonne triable, THE Système
   SHALL trier la liste selon le champ sélectionné en ordre ascendant ou
   descendant
4. WHEN la liste contient plus d'éléments que la limite par page, THE Système
   SHALL afficher des contrôles de pagination

### Exigence 3 : Créer un système de classification

**User Story :** En tant qu'administrateur, je veux créer un nouveau système de
classification, afin d'ajouter un organisme de classification manquant.

#### Critères d'acceptation

1. WHEN un administrateur soumet le Formulaire_Système avec des données valides
   (code unique, nom), THE Système SHALL créer le système de classification et
   rediriger vers la liste
2. WHEN un administrateur soumet le Formulaire_Système avec un code déjà
   existant, THE Système SHALL afficher un message d'erreur de conflit sans
   créer de doublon
3. WHEN un administrateur soumet le Formulaire_Système avec des champs
   obligatoires manquants, THE Système SHALL afficher les erreurs de validation
   sur les champs concernés

### Exigence 4 : Modifier un système de classification

**User Story :** En tant qu'administrateur, je veux modifier un système de
classification existant, afin de corriger ou mettre à jour ses informations.

#### Critères d'acceptation

1. WHEN un administrateur ouvre le formulaire d'édition d'un système, THE
   Formulaire_Système SHALL pré-remplir tous les champs avec les données
   actuelles du système
2. WHEN un administrateur soumet des modifications valides, THE Système SHALL
   mettre à jour le système de classification et rediriger vers la liste
3. WHEN un administrateur tente de modifier un système inexistant, THE Système
   SHALL afficher une erreur 404

### Exigence 5 : Supprimer un système de classification

**User Story :** En tant qu'administrateur, je veux supprimer un système de
classification, afin de retirer un organisme obsolète.

#### Critères d'acceptation

1. WHEN un administrateur demande la suppression d'un système, THE Système SHALL
   afficher un dialogue de confirmation avant de procéder
2. WHEN un administrateur confirme la suppression, THE Système SHALL supprimer
   le système de classification et rafraîchir la liste
3. IF un système de classification possède des notes ou descripteurs associés,
   THEN THE Système SHALL empêcher la suppression et afficher un message
   explicatif

### Exigence 6 : Lister les notes d'un système

**User Story :** En tant qu'administrateur, je veux voir les notes d'un système
de classification, afin de gérer les niveaux d'âge disponibles.

#### Critères d'acceptation

1. WHEN un administrateur consulte un système de classification, THE Système
   SHALL afficher la liste des notes avec leur code, nom d'affichage, âge
   minimum, couleur et ordre de tri
2. WHEN un administrateur saisit un terme de recherche dans la liste des notes,
   THE Système SHALL filtrer les notes dont le code ou le nom d'affichage
   correspond au terme

### Exigence 7 : Créer une note

**User Story :** En tant qu'administrateur, je veux créer une nouvelle note dans
un système de classification, afin d'ajouter un niveau d'âge manquant.

#### Critères d'acceptation

1. WHEN un administrateur soumet le Formulaire_Note avec des données valides
   (code unique dans le système, nom d'affichage, âge minimum), THE Système
   SHALL créer la note et rafraîchir la liste
2. WHEN un administrateur soumet le Formulaire_Note avec un code déjà existant
   dans le même système, THE Système SHALL afficher un message d'erreur de
   conflit
3. WHEN un administrateur soumet le Formulaire_Note avec un âge minimum négatif,
   THE Système SHALL rejeter la soumission avec une erreur de validation

### Exigence 8 : Modifier une note

**User Story :** En tant qu'administrateur, je veux modifier une note existante,
afin de corriger ses informations.

#### Critères d'acceptation

1. WHEN un administrateur ouvre le formulaire d'édition d'une note, THE
   Formulaire_Note SHALL pré-remplir tous les champs avec les données actuelles
2. WHEN un administrateur soumet des modifications valides, THE Système SHALL
   mettre à jour la note et rafraîchir la liste

### Exigence 9 : Supprimer une note

**User Story :** En tant qu'administrateur, je veux supprimer une note, afin de
retirer un niveau d'âge obsolète.

#### Critères d'acceptation

1. WHEN un administrateur demande la suppression d'une note, THE Système SHALL
   afficher un dialogue de confirmation
2. WHEN un administrateur confirme la suppression, THE Système SHALL supprimer
   la note et rafraîchir la liste
3. IF une note est associée à des jeux via `game_ratings`, THEN THE Système
   SHALL empêcher la suppression et afficher un message explicatif

### Exigence 10 : Lister les descripteurs de contenu d'un système

**User Story :** En tant qu'administrateur, je veux voir les descripteurs de
contenu d'un système de classification, afin de gérer les types de contenu
disponibles.

#### Critères d'acceptation

1. WHEN un administrateur consulte un système de classification, THE Système
   SHALL afficher la liste des descripteurs de contenu avec leur code et leurs
   traductions disponibles
2. WHEN un administrateur saisit un terme de recherche dans la liste des
   descripteurs, THE Système SHALL filtrer les descripteurs dont le code ou le
   nom traduit correspond au terme

### Exigence 11 : Créer un descripteur de contenu avec traductions

**User Story :** En tant qu'administrateur, je veux créer un descripteur de
contenu avec ses traductions, afin d'ajouter un type de contenu manquant.

#### Critères d'acceptation

1. WHEN un administrateur soumet le Formulaire_Descripteur avec des données
   valides (code unique dans le système), THE Système SHALL créer le descripteur
   et ses traductions puis rafraîchir la liste
2. WHEN un administrateur soumet le Formulaire_Descripteur avec un code déjà
   existant dans le même système, THE Système SHALL afficher un message d'erreur
   de conflit
3. WHEN un administrateur fournit des traductions, THE Système SHALL enregistrer
   le nom et la description pour chaque langue supportée

### Exigence 12 : Modifier un descripteur de contenu avec traductions

**User Story :** En tant qu'administrateur, je veux modifier un descripteur de
contenu et ses traductions, afin de corriger ou compléter les informations.

#### Critères d'acceptation

1. WHEN un administrateur ouvre le formulaire d'édition d'un descripteur, THE
   Formulaire_Descripteur SHALL pré-remplir le code et toutes les traductions
   existantes
2. WHEN un administrateur soumet des modifications valides, THE Système SHALL
   mettre à jour le descripteur et ses traductions

### Exigence 13 : Supprimer un descripteur de contenu

**User Story :** En tant qu'administrateur, je veux supprimer un descripteur de
contenu, afin de retirer un type de contenu obsolète.

#### Critères d'acceptation

1. WHEN un administrateur demande la suppression d'un descripteur, THE Système
   SHALL afficher un dialogue de confirmation
2. WHEN un administrateur confirme la suppression, THE Système SHALL supprimer
   le descripteur, ses traductions associées, et rafraîchir la liste
3. IF un descripteur est associé à des jeux via `game_rating_descriptors`, THEN
   THE Système SHALL empêcher la suppression et afficher un message explicatif

### Exigence 14 : Validation des données côté serveur

**User Story :** En tant qu'administrateur, je veux que les données soient
validées côté serveur, afin de garantir l'intégrité de la base de données.

#### Critères d'acceptation

1. WHEN une requête API reçoit des données invalides, THE Système SHALL
   retourner une erreur 400 avec le détail des erreurs de validation Zod
2. WHEN une requête API est envoyée sans authentification admin, THE Système
   SHALL retourner une erreur 403
3. WHEN une requête API cible une ressource inexistante, THE Système SHALL
   retourner une erreur 404
4. WHEN une requête API tente de créer un doublon (contrainte d'unicité), THE
   Système SHALL retourner une erreur 409

### Exigence 15 : Retour utilisateur

**User Story :** En tant qu'administrateur, je veux recevoir un retour visuel
après chaque action, afin de savoir si l'opération a réussi ou échoué.

#### Critères d'acceptation

1. WHEN une opération CRUD réussit, THE Système SHALL afficher une notification
   toast de succès
2. WHEN une opération CRUD échoue, THE Système SHALL afficher une notification
   toast d'erreur avec un message descriptif
