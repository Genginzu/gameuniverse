# Document d'exigences — Pages dédiées pour les notes de classification

## Introduction

Cette fonctionnalité transforme la gestion des notes (ratings) au sein d'un
système de classification d'âge. Actuellement, les notes sont créées et
modifiées via un formulaire inline dans l'onglet « Notes » de la page d'édition
d'un système de classification. L'objectif est double :

1. Créer des pages dédiées de création et d'édition pour les notes (comme il en
   existe déjà pour les systèmes de classification eux-mêmes).
2. Ajouter le support des traductions multilingues pour le champ `description`
   des notes, en suivant le même patron que les traductions des descripteurs de
   contenu (`content_descriptor_translations`).

## Glossaire

- **Système_de_classification** : Entité représentant un organisme de
  classification d'âge (ex. PEGI, ESRB, CERO). Correspond à la table
  `rating_systems`.
- **Note** : Entité représentant un niveau de classification au sein d'un
  système (ex. PEGI 3, ESRB E). Correspond à la table `ratings`.
- **Traduction_de_note** : Entité associant une description traduite à une note
  pour un code de langue donné. Correspondra à la nouvelle table
  `rating_translations`.
- **Onglet_Notes** : Composant `RatingsTab` affichant la liste des notes d'un
  système de classification dans la page d'édition.
- **Formulaire_Note** : Composant `RatingForm` permettant de saisir ou modifier
  les champs d'une note.
- **Page_Création_Note** : Page dédiée accessible via
  `/admin/age-classifications/[id]/ratings/new`.
- **Page_Édition_Note** : Page dédiée accessible via
  `/admin/age-classifications/[id]/ratings/[ratingId]/edit`.
- **API_Notes** : Routes API REST pour la gestion des notes (`GET`, `POST`,
  `PUT`, `DELETE`).
- **Schéma_Validation** : Schéma Zod définissant les règles de validation du
  formulaire de note.

## Exigences

### Exigence 1 : Migration de base de données pour les traductions de notes

**User Story :** En tant qu'administrateur, je veux que les descriptions des
notes soient stockées avec leurs traductions, afin de pouvoir afficher les
descriptions dans la langue de l'utilisateur.

#### Critères d'acceptation

1. THE Système_de_classification SHALL disposer d'une table
   `rating_translations` avec les colonnes `id` (UUID, clé primaire),
   `rating_id` (UUID, référence vers `ratings`), `language_code` (VARCHAR,
   référence vers `languages`), et `description` (TEXT).
2. WHEN une Note est supprimée, THEN THE Système_de_classification SHALL
   supprimer en cascade toutes les Traduction_de_note associées.
3. THE Système_de_classification SHALL garantir l'unicité de la combinaison
   (`rating_id`, `language_code`) dans la table `rating_translations`.
4. THE Système_de_classification SHALL créer un index sur la colonne `rating_id`
   de la table `rating_translations` pour optimiser les requêtes.

### Exigence 2 : Mise à jour du schéma de validation

**User Story :** En tant que développeur, je veux que le schéma de validation du
formulaire de note inclue les traductions, afin de garantir l'intégrité des
données soumises.

#### Critères d'acceptation

1. THE Schéma_Validation SHALL inclure un champ `translations` de type tableau
   d'objets contenant `language_code` (chaîne non vide) et `description`
   (chaîne, max 500 caractères).
2. WHEN un formulaire de note est soumis sans traductions, THEN THE
   Schéma_Validation SHALL accepter un tableau vide de traductions.
3. THE Schéma_Validation SHALL conserver les champs existants (`code`,
   `display_name`, `minimum_age`, `color_hex`, `icon_url`, `sort_order`) sans
   modification.
4. WHEN le champ `description` racine est soumis, THEN THE Schéma_Validation
   SHALL le supprimer du schéma car la description est désormais gérée via les
   traductions.

### Exigence 3 : Mise à jour des types TypeScript

**User Story :** En tant que développeur, je veux que les types TypeScript
reflètent la nouvelle structure avec traductions, afin de bénéficier du typage
statique dans tout le code.

#### Critères d'acceptation

1. THE Système_de_classification SHALL définir une interface `RatingTranslation`
   avec les champs `language_code` (string) et `description` (string).
2. THE Système_de_classification SHALL mettre à jour l'interface `AdminRating`
   pour inclure un champ `translations` de type `RatingTranslation[]`.
3. THE Système_de_classification SHALL retirer le champ `description` de
   l'interface `AdminRating` car la description est désormais portée par les
   traductions.

### Exigence 4 : Mise à jour des routes API pour les notes

**User Story :** En tant que développeur, je veux que les routes API gèrent les
traductions des notes, afin que le frontend puisse créer et modifier des notes
avec leurs descriptions traduites.

#### Critères d'acceptation

1. WHEN l'API_Notes reçoit une requête GET pour la liste des notes, THEN
   l'API_Notes SHALL inclure le tableau `translations` pour chaque note
   retournée.
2. WHEN l'API_Notes reçoit une requête GET pour une note individuelle, THEN
   l'API_Notes SHALL inclure le tableau `translations` de cette note.
3. WHEN l'API_Notes reçoit une requête POST avec des traductions, THEN
   l'API_Notes SHALL créer la note et insérer les traductions dans la table
   `rating_translations`.
4. WHEN l'API_Notes reçoit une requête PUT avec des traductions, THEN
   l'API_Notes SHALL mettre à jour la note et remplacer les traductions
   existantes (suppression puis insertion).
5. WHEN l'API_Notes reçoit une requête DELETE pour une note, THEN l'API_Notes
   SHALL supprimer les traductions associées avant de supprimer la note.
6. IF la création des traductions échoue après la création de la note, THEN
   l'API_Notes SHALL annuler la création de la note et retourner une erreur 500.

### Exigence 5 : Pages dédiées de création et d'édition

**User Story :** En tant qu'administrateur, je veux accéder à des pages dédiées
pour créer et modifier les notes, afin d'avoir plus d'espace et une meilleure
expérience utilisateur.

#### Critères d'acceptation

1. WHEN un administrateur accède à
   `/admin/age-classifications/[id]/ratings/new`, THEN THE Page_Création_Note
   SHALL afficher le Formulaire_Note en mode création avec un bouton de retour
   vers la page d'édition du système.
2. WHEN un administrateur accède à
   `/admin/age-classifications/[id]/ratings/[ratingId]/edit`, THEN THE
   Page_Édition_Note SHALL charger les données de la note (y compris les
   traductions) et afficher le Formulaire_Note en mode édition.
3. WHEN la note demandée en édition est introuvable, THEN THE Page_Édition_Note
   SHALL afficher un message d'erreur et proposer un retour à la page du
   système.
4. WHEN une note est créée avec succès, THEN THE Page_Création_Note SHALL
   afficher une notification de succès et rediriger vers la page d'édition du
   système de classification.
5. WHEN une note est modifiée avec succès, THEN THE Page_Édition_Note SHALL
   afficher une notification de succès et rediriger vers la page d'édition du
   système de classification.

### Exigence 6 : Mise à jour de l'onglet Notes

**User Story :** En tant qu'administrateur, je veux que l'onglet Notes serve
uniquement de liste avec navigation, afin de garder une vue d'ensemble claire et
accéder facilement aux pages dédiées.

#### Critères d'acceptation

1. THE Onglet_Notes SHALL supprimer le formulaire inline de création et
   d'édition.
2. WHEN un administrateur clique sur le bouton « Nouvelle note », THEN THE
   Onglet_Notes SHALL naviguer vers la Page_Création_Note
   (`/admin/age-classifications/[id]/ratings/new`).
3. WHEN un administrateur clique sur le bouton d'édition d'une note ou sur la
   ligne du tableau, THEN THE Onglet*Notes SHALL naviguer vers la
   Page*Édition_Note
   (`/admin/age-classifications/[id]/ratings/[ratingId]/edit`).
4. THE Onglet_Notes SHALL conserver la fonctionnalité de recherche et la boîte
   de dialogue de suppression.

### Exigence 7 : Mise à jour du formulaire de note avec traductions

**User Story :** En tant qu'administrateur, je veux pouvoir saisir des
descriptions traduites dans le formulaire de note, afin de fournir des
descriptions dans plusieurs langues.

#### Critères d'acceptation

1. THE Formulaire_Note SHALL afficher une section « Traductions » permettant
   d'ajouter, modifier et supprimer des traductions de description.
2. WHEN un administrateur ajoute une traduction, THEN THE Formulaire_Note SHALL
   afficher un nouveau bloc avec les champs `language_code` et `description`.
3. THE Formulaire_Note SHALL supprimer le champ `description` en texte brut
   existant, remplacé par la section traductions.
4. THE Formulaire_Note SHALL conserver tous les autres champs existants (`code`,
   `display_name`, `minimum_age`, `color_hex`, `icon_url`, `sort_order`) sans
   modification.
5. WHEN le formulaire est utilisé en mode édition, THEN THE Formulaire_Note
   SHALL pré-remplir les traductions existantes de la note.
