# Document d'exigences — Gestion admin des genres

## Introduction

Ce document décrit les exigences pour la fonctionnalité de gestion CRUD des
genres de jeux dans l'interface d'administration. Les genres sont multilingues
(nom + description par langue supportée) et liés aux jeux via une table de
jonction `game_genres`. L'administrateur doit pouvoir lister, créer, modifier et
supprimer des genres, avec vérification d'usage avant suppression.

## Glossaire

- **Système_Admin_Genres** : Module d'administration responsable de la gestion
  CRUD des genres de jeux
- **Genre** : Catégorie de jeu vidéo identifiée par un slug unique, avec des
  traductions (nom, description) par langue supportée
- **Traduction_Genre** : Paire nom/description associée à un genre pour une
  langue supportée donnée
- **Slug** : Identifiant textuel unique d'un genre, composé de lettres
  minuscules et de tirets (ex : `tower-defense`)
- **Table_Jonction** : Table `game_genres` reliant les jeux aux genres
- **Administrateur** : Utilisateur authentifié disposant du rôle admin, vérifié
  par `requireAdmin()`
- **Schéma_Validation** : Schéma Zod utilisé pour valider les données de
  formulaire côté client et serveur

## Exigences

### Exigence 1 : Lister les genres avec pagination, recherche et tri

**User Story :** En tant qu'administrateur, je veux consulter la liste des
genres avec pagination, recherche et tri, afin de retrouver rapidement un genre
spécifique.

#### Critères d'acceptation

1. WHEN un administrateur accède à la page de liste des genres, THE
   Système_Admin_Genres SHALL afficher les genres avec leur slug, nom traduit
   dans la locale courante, et le nombre de jeux associés
2. WHEN un administrateur saisit un terme de recherche, THE Système_Admin_Genres
   SHALL filtrer les genres dont le slug ou le nom traduit contient le terme
   recherché
3. WHEN un administrateur change le critère de tri, THE Système_Admin_Genres
   SHALL réordonner la liste selon le champ choisi (slug ou nom) et l'ordre
   choisi (ascendant ou descendant)
4. WHEN le nombre de genres dépasse la limite par page, THE Système_Admin_Genres
   SHALL paginer les résultats et afficher les contrôles de navigation entre
   pages
5. IF un utilisateur non authentifié ou non administrateur tente d'accéder à
   l'API admin des genres, THEN THE Système_Admin_Genres SHALL retourner une
   erreur 403

### Exigence 2 : Créer un genre

**User Story :** En tant qu'administrateur, je veux créer un nouveau genre avec
ses traductions, afin d'enrichir le catalogue de catégories de jeux.

#### Critères d'acceptation

1. WHEN un administrateur soumet le formulaire de création avec un slug valide
   et au moins une traduction, THE Système_Admin_Genres SHALL créer le genre et
   ses traductions dans la base de données
2. WHEN un administrateur soumet un slug déjà existant, THE Système_Admin_Genres
   SHALL rejeter la création et afficher un message d'erreur indiquant le
   doublon
3. WHEN un administrateur soumet un formulaire avec un slug invalide (caractères
   non autorisés, vide, ou trop long), THE Système_Admin_Genres SHALL rejeter la
   soumission et afficher les erreurs de validation
4. THE Schéma_Validation SHALL valider que le slug contient uniquement des
   lettres minuscules et des tirets, commence par une lettre, et a entre 2 et 50
   caractères
5. THE Schéma_Validation SHALL valider que le nom de chaque traduction est non
   vide et ne dépasse pas 100 caractères
6. THE Schéma_Validation SHALL valider que la description de chaque traduction
   ne dépasse pas 500 caractères

### Exigence 3 : Modifier un genre

**User Story :** En tant qu'administrateur, je veux modifier un genre existant
et ses traductions, afin de corriger ou mettre à jour les informations.

#### Critères d'acceptation

1. WHEN un administrateur accède à la page d'édition d'un genre, THE
   Système_Admin_Genres SHALL pré-remplir le formulaire avec les données
   actuelles du genre et de ses traductions
2. WHEN un administrateur soumet le formulaire d'édition avec des données
   valides, THE Système_Admin_Genres SHALL mettre à jour le genre et ses
   traductions dans la base de données
3. WHILE un genre est en cours d'édition, THE Système_Admin_Genres SHALL
   empêcher la modification du slug (champ en lecture seule)
4. IF le genre demandé n'existe pas, THEN THE Système_Admin_Genres SHALL
   retourner une erreur 404

### Exigence 4 : Supprimer un genre

**User Story :** En tant qu'administrateur, je veux supprimer un genre, afin de
retirer les catégories obsolètes ou erronées.

#### Critères d'acceptation

1. WHEN un administrateur demande la suppression d'un genre non utilisé par
   aucun jeu, THE Système_Admin_Genres SHALL supprimer le genre et ses
   traductions de la base de données
2. WHEN un administrateur demande la suppression d'un genre utilisé par des
   jeux, THE Système_Admin_Genres SHALL afficher un dialogue de confirmation
   indiquant le nombre de jeux associés
3. WHEN un administrateur confirme la suppression forcée d'un genre utilisé, THE
   Système_Admin_Genres SHALL supprimer les associations dans game_genres, puis
   supprimer le genre et ses traductions
4. IF la suppression échoue en base de données, THEN THE Système_Admin_Genres
   SHALL afficher un message d'erreur et conserver le genre intact

### Exigence 5 : Validation des données de formulaire

**User Story :** En tant qu'administrateur, je veux que les données saisies
soient validées côté client et serveur, afin d'éviter les données incohérentes
en base.

#### Critères d'acceptation

1. THE Schéma_Validation SHALL être partagé entre le client (react-hook-form +
   Zod) et le serveur (route API)
2. WHEN des données invalides sont soumises à l'API, THE Système_Admin_Genres
   SHALL retourner une erreur 400 avec le détail des erreurs de validation
3. WHEN des données invalides sont saisies dans le formulaire, THE
   Système_Admin_Genres SHALL afficher les messages d'erreur en temps réel sous
   les champs concernés

### Exigence 6 : Gestion des traductions multilingues

**User Story :** En tant qu'administrateur, je veux gérer les traductions (nom
et description) d'un genre pour chaque langue supportée, afin que les genres
soient affichés correctement dans toutes les langues du site.

#### Critères d'acceptation

1. WHEN un administrateur crée ou modifie un genre, THE Système_Admin_Genres
   SHALL afficher un champ nom et un champ description pour chaque langue
   supportée dans la base de données
2. WHEN un administrateur soumet le formulaire, THE Système_Admin_Genres SHALL
   enregistrer les traductions via upsert dans la table genre_translations
3. IF une langue supportée n'a pas de traduction renseignée pour un genre, THEN
   THE Système_Admin_Genres SHALL accepter la soumission avec les traductions
   fournies uniquement
