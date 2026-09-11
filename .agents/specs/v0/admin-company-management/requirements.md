# Document d'exigences — Gestion admin des entreprises

## Introduction

Ce document décrit les exigences pour la fonctionnalité de gestion CRUD des
entreprises (développeurs et éditeurs de jeux) dans l'interface
d'administration. Les entreprises sont stockées dans la table `companies` avec
des champs descriptifs (nom, slug, description, site web, logo, année de
fondation, siège social, type). Elles sont liées aux jeux via la table de
jonction `game_companies`. L'administrateur doit pouvoir lister, créer, modifier
et supprimer des entreprises, avec vérification d'usage avant suppression.

## Glossaire

- **Système_Admin_Entreprises** : Module d'administration responsable de la
  gestion CRUD des entreprises de jeux vidéo
- **Entreprise** : Entité représentant un développeur, éditeur ou les deux,
  identifiée par un slug unique et un nom unique
- **Slug** : Identifiant textuel unique d'une entreprise, composé de lettres
  minuscules, chiffres et tirets (ex : `cd-projekt-red`)
- **Type_Entreprise** : Classification d'une entreprise parmi `developer`,
  `publisher` ou `both`
- **Table_Jonction** : Table `game_companies` reliant les jeux aux entreprises
  avec un rôle et un indicateur principal
- **Administrateur** : Utilisateur authentifié disposant du rôle admin, vérifié
  par `requireAdmin()`
- **Schéma_Validation** : Schéma Zod utilisé pour valider les données de
  formulaire côté client et serveur

## Exigences

### Exigence 1 : Lister les entreprises avec pagination, recherche et tri

**User Story :** En tant qu'administrateur, je veux consulter la liste des
entreprises avec pagination, recherche et tri, afin de retrouver rapidement une
entreprise spécifique.

#### Critères d'acceptation

1. WHEN un administrateur accède à la page de liste des entreprises, THE
   Système_Admin_Entreprises SHALL afficher les entreprises avec leur nom, slug,
   type (developer/publisher/both), et le nombre de jeux associés
2. WHEN un administrateur saisit un terme de recherche, THE
   Système_Admin_Entreprises SHALL filtrer les entreprises dont le nom ou le
   slug contient le terme recherché (insensible à la casse)
3. WHEN un administrateur change le critère de tri, THE
   Système_Admin_Entreprises SHALL réordonner la liste selon le champ choisi
   (name ou slug) et l'ordre choisi (ascendant ou descendant)
4. WHEN le nombre d'entreprises dépasse la limite par page, THE
   Système_Admin_Entreprises SHALL paginer les résultats et afficher les
   contrôles de navigation entre pages
5. IF un utilisateur non authentifié ou non administrateur tente d'accéder à
   l'API admin des entreprises, THEN THE Système_Admin_Entreprises SHALL
   retourner une erreur 403

### Exigence 2 : Créer une entreprise

**User Story :** En tant qu'administrateur, je veux créer une nouvelle
entreprise avec ses informations détaillées, afin d'enrichir le catalogue
d'entreprises associables aux jeux.

#### Critères d'acceptation

1. WHEN un administrateur soumet le formulaire de création avec un nom valide,
   un slug valide et un type valide, THE Système_Admin_Entreprises SHALL créer
   l'entreprise dans la base de données
2. WHEN un administrateur soumet un nom ou un slug déjà existant, THE
   Système_Admin_Entreprises SHALL rejeter la création et afficher un message
   d'erreur indiquant le doublon
3. WHEN un administrateur soumet un formulaire avec un slug invalide (caractères
   non autorisés, vide, ou trop long), THE Système_Admin_Entreprises SHALL
   rejeter la soumission et afficher les erreurs de validation
4. THE Schéma_Validation SHALL valider que le slug contient uniquement des
   lettres minuscules, des chiffres et des tirets, commence par une lettre, et a
   entre 2 et 100 caractères
5. THE Schéma_Validation SHALL valider que le nom est non vide et ne dépasse pas
   255 caractères
6. THE Schéma_Validation SHALL valider que le type est l'une des valeurs
   autorisées : `developer`, `publisher` ou `both`
7. THE Schéma_Validation SHALL valider que la description ne dépasse pas 2000
   caractères lorsqu'elle est fournie
8. THE Schéma_Validation SHALL valider que l'URL du site web est une URL valide
   lorsqu'elle est fournie
9. THE Schéma_Validation SHALL valider que l'année de fondation est un entier
   compris entre 1800 et l'année courante lorsqu'elle est fournie

### Exigence 3 : Modifier une entreprise

**User Story :** En tant qu'administrateur, je veux modifier une entreprise
existante, afin de corriger ou mettre à jour ses informations.

#### Critères d'acceptation

1. WHEN un administrateur accède à la page d'édition d'une entreprise, THE
   Système_Admin_Entreprises SHALL pré-remplir le formulaire avec les données
   actuelles de l'entreprise
2. WHEN un administrateur soumet le formulaire d'édition avec des données
   valides, THE Système_Admin_Entreprises SHALL mettre à jour l'entreprise dans
   la base de données
3. WHILE une entreprise est en cours d'édition, THE Système_Admin_Entreprises
   SHALL empêcher la modification du slug (champ en lecture seule)
4. IF l'entreprise demandée n'existe pas, THEN THE Système_Admin_Entreprises
   SHALL retourner une erreur 404

### Exigence 4 : Supprimer une entreprise

**User Story :** En tant qu'administrateur, je veux supprimer une entreprise,
afin de retirer les entrées obsolètes ou erronées.

#### Critères d'acceptation

1. WHEN un administrateur demande la suppression d'une entreprise non utilisée
   par aucun jeu, THE Système_Admin_Entreprises SHALL supprimer l'entreprise de
   la base de données
2. WHEN un administrateur demande la suppression d'une entreprise utilisée par
   des jeux, THE Système_Admin_Entreprises SHALL afficher un dialogue de
   confirmation indiquant le nombre de jeux associés
3. WHEN un administrateur confirme la suppression forcée d'une entreprise
   utilisée, THE Système_Admin_Entreprises SHALL supprimer les associations dans
   game_companies, puis supprimer l'entreprise
4. IF la suppression échoue en base de données, THEN THE
   Système_Admin_Entreprises SHALL afficher un message d'erreur et conserver
   l'entreprise intacte

### Exigence 5 : Validation des données de formulaire

**User Story :** En tant qu'administrateur, je veux que les données saisies
soient validées côté client et serveur, afin d'éviter les données incohérentes
en base.

#### Critères d'acceptation

1. THE Schéma_Validation SHALL être partagé entre le client (react-hook-form +
   Zod) et le serveur (route API)
2. WHEN des données invalides sont soumises à l'API, THE
   Système_Admin_Entreprises SHALL retourner une erreur 400 avec le détail des
   erreurs de validation
3. WHEN des données invalides sont saisies dans le formulaire, THE
   Système_Admin_Entreprises SHALL afficher les messages d'erreur en temps réel
   sous les champs concernés
