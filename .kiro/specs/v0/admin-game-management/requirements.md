# Document des Exigences

## Introduction

Ce document définit les exigences pour la création d'une interface
d'administration backend permettant la gestion des jeux (CRUD). Cette interface
sera accessible uniquement aux utilisateurs autorisés (administrateurs et
contributeurs) et permettra de créer, lire, modifier et supprimer des jeux dans
la base de données.

Le projet utilise déjà des API admin pour les jeux (`src/app/api/admin/games/`)
avec une vérification d'accès basée sur le domaine email. Cette fonctionnalité
vise à créer l'interface utilisateur correspondante.

## Glossaire

- **Système_Admin**: L'interface d'administration backend pour la gestion des
  jeux
- **Administrateur**: Utilisateur avec tous les droits de gestion (création,
  modification, suppression)
- **Contributeur**: Utilisateur avec des droits limités (création, modification,
  pas de suppression)
- **Jeu**: Entité principale contenant les informations d'un jeu vidéo (titre,
  description, images, etc.)
- **CRUD**: Opérations Create, Read, Update, Delete sur les entités
- **Tableau_de_bord_Admin**: Page principale de l'interface d'administration
  affichant la liste des jeux
- **Formulaire_Jeu**: Composant permettant la création ou modification d'un jeu
- **Garde_de_Route**: Mécanisme de protection des routes réservées aux
  utilisateurs autorisés

## Exigences

### Exigence 1: Authentification et Autorisation

**User Story:** En tant qu'administrateur ou contributeur, je veux accéder à une
interface d'administration sécurisée, afin de gérer les jeux du site.

#### Critères d'Acceptation

1. QUAND un utilisateur non authentifié tente d'accéder à l'interface admin
   ALORS le Système_Admin DOIT rediriger vers la page de connexion
2. QUAND un utilisateur authentifié sans rôle admin/contributeur tente d'accéder
   à l'interface admin ALORS le Système_Admin DOIT afficher une page d'erreur
   403 (accès refusé)
3. QUAND un administrateur se connecte ALORS le Système_Admin DOIT lui accorder
   l'accès complet (création, lecture, modification, suppression)
4. QUAND un contributeur se connecte ALORS le Système_Admin DOIT lui accorder un
   accès limité (création, lecture, modification sans suppression)
5. LE Système_Admin DOIT vérifier les permissions à chaque action sensible
   (création, modification, suppression)

### Exigence 2: Navigation et Structure de l'Interface Admin

**User Story:** En tant qu'utilisateur autorisé, je veux naviguer facilement
dans l'interface d'administration, afin de gérer efficacement les jeux.

#### Critères d'Acceptation

1. LE Système_Admin DOIT afficher un menu de navigation latéral avec les
   sections disponibles
2. LE Système_Admin DOIT afficher le rôle de l'utilisateur connecté dans
   l'en-tête
3. QUAND l'utilisateur clique sur "Jeux" dans le menu ALORS le Système_Admin
   DOIT afficher le Tableau_de_bord_Admin des jeux
4. LE Système_Admin DOIT être accessible via la route `/[locale]/admin/games`
5. LE Système_Admin DOIT supporter l'internationalisation (français et anglais)

### Exigence 3: Liste des Jeux (Read)

**User Story:** En tant qu'utilisateur autorisé, je veux voir la liste de tous
les jeux, afin de pouvoir les gérer.

#### Critères d'Acceptation

1. QUAND l'utilisateur accède au Tableau_de_bord_Admin ALORS le Système_Admin
   DOIT afficher une liste paginée des jeux
2. POUR CHAQUE jeu dans la liste, le Système_Admin DOIT afficher le titre,
   l'image de couverture, la date de sortie et la date de dernière modification
3. LE Système_Admin DOIT permettre de rechercher des jeux par titre
4. LE Système_Admin DOIT permettre de trier les jeux par titre, date de sortie
   ou date de modification
5. LE Système_Admin DOIT afficher le nombre total de jeux et la pagination
6. QUAND l'utilisateur clique sur un jeu ALORS le Système_Admin DOIT naviguer
   vers le formulaire de modification

### Exigence 4: Création d'un Jeu (Create)

**User Story:** En tant qu'utilisateur autorisé, je veux créer un nouveau jeu,
afin d'enrichir le catalogue du site.

#### Critères d'Acceptation

1. QUAND l'utilisateur clique sur "Nouveau jeu" ALORS le Système_Admin DOIT
   afficher le Formulaire_Jeu vide
2. LE Formulaire_Jeu DOIT contenir les champs: slug, titre (multilingue),
   description (multilingue), image de couverture, date de sortie, genres et
   entreprises
3. QUAND l'utilisateur soumet un formulaire valide ALORS le Système_Admin DOIT
   créer le jeu via l'API et afficher un message de succès
4. SI le slug existe déjà ALORS le Système_Admin DOIT afficher un message
   d'erreur approprié
5. QUAND l'utilisateur soumet un formulaire invalide ALORS le Système_Admin DOIT
   afficher les erreurs de validation sans soumettre
6. LE Système_Admin DOIT valider que les champs obligatoires (slug, titre en
   langue par défaut) sont remplis

### Exigence 5: Modification d'un Jeu (Update)

**User Story:** En tant qu'utilisateur autorisé, je veux modifier un jeu
existant, afin de corriger ou mettre à jour ses informations.

#### Critères d'Acceptation

1. QUAND l'utilisateur accède à la page de modification ALORS le Système_Admin
   DOIT pré-remplir le Formulaire_Jeu avec les données existantes
2. LE Système_Admin DOIT permettre de modifier tous les champs du jeu
3. QUAND l'utilisateur soumet les modifications ALORS le Système_Admin DOIT
   mettre à jour le jeu via l'API et afficher un message de succès
4. SI une erreur survient lors de la mise à jour ALORS le Système_Admin DOIT
   afficher un message d'erreur et conserver les données du formulaire
5. LE Système_Admin DOIT afficher un indicateur de chargement pendant la
   soumission

### Exigence 6: Suppression d'un Jeu (Delete)

**User Story:** En tant qu'administrateur, je veux supprimer un jeu, afin de
retirer du contenu obsolète ou erroné.

#### Critères d'Acceptation

1. QUAND un administrateur clique sur "Supprimer" ALORS le Système_Admin DOIT
   afficher une modale de confirmation
2. LA modale de confirmation DOIT afficher le titre du jeu et avertir que
   l'action est irréversible
3. QUAND l'administrateur confirme la suppression ALORS le Système_Admin DOIT
   supprimer le jeu via l'API et actualiser la liste
4. SI un contributeur tente de supprimer un jeu ALORS le Système_Admin DOIT
   masquer ou désactiver le bouton de suppression
5. SI une erreur survient lors de la suppression ALORS le Système_Admin DOIT
   afficher un message d'erreur

### Exigence 7: Gestion des Erreurs et Feedback

**User Story:** En tant qu'utilisateur autorisé, je veux recevoir des retours
clairs sur mes actions, afin de comprendre le résultat de mes opérations.

#### Critères d'Acceptation

1. QUAND une opération réussit ALORS le Système_Admin DOIT afficher une
   notification de succès
2. QUAND une erreur survient ALORS le Système_Admin DOIT afficher une
   notification d'erreur avec un message explicatif
3. PENDANT le chargement des données ALORS le Système_Admin DOIT afficher un
   indicateur de chargement
4. SI la connexion à l'API échoue ALORS le Système_Admin DOIT afficher un
   message d'erreur et proposer de réessayer
5. LE Système_Admin DOIT gérer gracieusement les erreurs réseau et les timeouts

### Exigence 8: Responsive Design et Accessibilité

**User Story:** En tant qu'utilisateur autorisé, je veux utiliser l'interface
admin sur différents appareils, afin de gérer les jeux depuis n'importe où.

#### Critères d'Acceptation

1. LE Système_Admin DOIT être utilisable sur desktop, tablette et mobile
2. LE Système_Admin DOIT respecter les standards d'accessibilité WCAG 2.1 niveau
   AA
3. LE Système_Admin DOIT supporter la navigation au clavier
4. LE Système_Admin DOIT avoir des contrastes de couleurs suffisants pour la
   lisibilité
