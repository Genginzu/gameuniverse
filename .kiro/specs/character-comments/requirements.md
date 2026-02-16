# Document de Requirements

## Introduction

La fonctionnalité "Commentaires sur les personnages" permet aux joueurs
authentifiés de laisser un commentaire textuel sur un personnage depuis un
nouvel onglet "Commentaires" de la page de détails du personnage. Chaque joueur
peut laisser un seul commentaire par personnage (texte simple, 1000 caractères
max). Les administrateurs peuvent consulter, modifier et supprimer les
commentaires depuis le panneau d'administration, en suivant le même pattern que
la gestion admin des avis (reviews).

## Glossaire

- **Comment_System** : Le système principal qui gère la création, la validation,
  l'affichage et la modération des commentaires sur les personnages
- **Comment** : Un commentaire textuel laissé par un joueur sur un personnage,
  comprenant uniquement du texte simple (pas de rich text)
- **Comment_Form** : Le formulaire permettant à un joueur de soumettre ou
  modifier un commentaire sur un personnage
- **Comment_List** : La liste des commentaires affichés dans l'onglet
  "Commentaires" d'un personnage
- **Admin_Comment_System** : Le système de gestion des commentaires côté
  administration, comprenant la liste, l'édition et la suppression
- **Admin_Comment_List** : La page admin listant tous les commentaires avec
  pagination, recherche et tri
- **Admin_Comment_Form** : Le formulaire d'édition d'un commentaire par un
  administrateur
- **Admin_Comment_API** : Les routes API sous `/api/admin/comments` permettant
  les opérations CRUD sur les commentaires
- **Comment_API** : La route API sous `/api/comments` permettant la lecture et
  la soumission de commentaires côté joueur
- **Player** : Un utilisateur authentifié de la plateforme pouvant soumettre des
  commentaires
- **Administrator** : Un utilisateur authentifié disposant du rôle
  administrateur dans les métadonnées Supabase
- **Character** : Un personnage de jeu vidéo existant dans la base de données

## Requirements

### Requirement 1 : Soumettre un commentaire

**User Story :** En tant que joueur, je veux soumettre un commentaire sur un
personnage, afin de partager mon avis avec la communauté.

#### Acceptance Criteria

1. WHEN un joueur authentifié accède à l'onglet "Commentaires" d'un personnage,
   THE Comment_System SHALL afficher le Comment_Form permettant de soumettre un
   commentaire
2. WHEN un joueur remplit le Comment_Form avec un texte valide et le soumet, THE
   Comment_System SHALL créer un nouveau Comment associé au joueur et au
   personnage
3. WHEN un joueur a déjà soumis un Comment pour un personnage, THE
   Comment_System SHALL empêcher la soumission d'un second commentaire pour le
   même personnage
4. WHEN un joueur a déjà soumis un Comment pour un personnage, THE
   Comment_System SHALL afficher le commentaire existant avec la possibilité de
   le modifier
5. WHEN un joueur non authentifié accède à l'onglet "Commentaires", THE
   Comment_System SHALL afficher un message invitant le joueur à se connecter

### Requirement 2 : Valider un commentaire

**User Story :** En tant que joueur, je veux que mon commentaire soit validé
avant soumission, afin de garantir la qualité du contenu.

#### Acceptance Criteria

1. WHEN un joueur soumet le Comment_Form avec un contenu vide ou composé
   uniquement d'espaces, THE Comment_Form SHALL rejeter la soumission et
   afficher un message d'erreur
2. WHEN un joueur soumet le Comment_Form avec un contenu dépassant 1000
   caractères, THE Comment_Form SHALL rejeter la soumission et afficher un
   message d'erreur
3. IF la validation du Comment_Form échoue, THEN THE Comment_System SHALL
   afficher les messages d'erreur correspondants sans perdre le texte saisi par
   le joueur

### Requirement 3 : Consulter les commentaires

**User Story :** En tant qu'utilisateur, je veux consulter les commentaires sur
un personnage, afin de lire les avis de la communauté.

#### Acceptance Criteria

1. WHEN un utilisateur accède à l'onglet "Commentaires" d'un personnage, THE
   Comment_List SHALL afficher tous les commentaires soumis pour ce personnage,
   triés par date de création décroissante
2. WHEN la Comment_List affiche un Comment, THE Comment_List SHALL montrer le
   nom du joueur, le texte du commentaire et la date de création
3. WHEN aucun Comment n'existe pour un personnage, THE Comment_List SHALL
   afficher un message invitant les joueurs à soumettre le premier commentaire
4. WHEN l'onglet "Commentaires" est affiché, THE Comment_System SHALL afficher
   le nombre total de commentaires pour le personnage

### Requirement 4 : Gestion admin — Liste des commentaires

**User Story :** En tant qu'administrateur, je veux consulter la liste de tous
les commentaires des joueurs, afin de pouvoir surveiller et modérer le contenu.

#### Acceptance Criteria

1. WHEN un administrateur accède à la page Admin_Comment_List, THE
   Admin_Comment_System SHALL afficher la liste paginée de tous les commentaires
   existants
2. WHEN la Admin_Comment_List affiche un Comment, THE Admin_Comment_System SHALL
   montrer le nom du joueur, le nom du personnage, un extrait du contenu et la
   date de création
3. WHEN un administrateur saisit un terme de recherche, THE Admin_Comment_System
   SHALL filtrer les commentaires par nom de joueur ou nom de personnage
   correspondant au terme
4. WHEN un administrateur clique sur un en-tête de colonne triable, THE
   Admin_Comment_System SHALL trier la liste selon la colonne sélectionnée en
   ordre ascendant ou descendant
5. WHEN aucun Comment n'existe dans le système, THE Admin_Comment_List SHALL
   afficher un message indiquant qu'aucun commentaire n'a été trouvé

### Requirement 5 : Gestion admin — Modification d'un commentaire

**User Story :** En tant qu'administrateur, je veux modifier un commentaire
existant, afin de corriger du contenu inapproprié.

#### Acceptance Criteria

1. WHEN un administrateur clique sur le bouton d'édition d'un Comment, THE
   Admin_Comment_System SHALL afficher le Admin_Comment_Form pré-rempli avec les
   données actuelles du commentaire
2. WHEN un administrateur modifie le contenu du Admin_Comment_Form et soumet,
   THE Admin_Comment_System SHALL mettre à jour le Comment en base de données
   avec la nouvelle valeur
3. WHEN un administrateur soumet le Admin_Comment_Form, THE Admin_Comment_System
   SHALL valider que le contenu est non vide après suppression des espaces et
   que le texte ne dépasse pas 1000 caractères
4. IF la validation du Admin_Comment_Form échoue, THEN THE Admin_Comment_System
   SHALL afficher les messages d'erreur correspondants sans perdre les données
   saisies
5. WHEN la mise à jour réussit, THE Admin_Comment_System SHALL afficher une
   notification de succès et rediriger vers la Admin_Comment_List
6. WHEN un administrateur modifie un Comment, THE Admin_Comment_System SHALL
   mettre à jour le champ `updated_at` du commentaire avec la date et heure
   courante

### Requirement 6 : Gestion admin — Suppression d'un commentaire

**User Story :** En tant qu'administrateur, je veux supprimer un commentaire,
afin de retirer du contenu inapproprié de la plateforme.

#### Acceptance Criteria

1. WHEN un administrateur clique sur le bouton de suppression d'un Comment, THE
   Admin_Comment_System SHALL afficher une boîte de dialogue de confirmation
   indiquant le nom du joueur et le nom du personnage
2. WHEN un administrateur confirme la suppression, THE Admin_Comment_System
   SHALL supprimer le Comment de la base de données
3. WHEN la suppression réussit, THE Admin_Comment_System SHALL afficher une
   notification de succès et rafraîchir la Admin_Comment_List
4. IF la suppression échoue, THEN THE Admin_Comment_System SHALL afficher un
   message d'erreur sans modifier l'état de la liste

### Requirement 7 : Sécurité

**User Story :** En tant qu'administrateur, je veux que les opérations sur les
commentaires soient sécurisées, afin que seuls les utilisateurs autorisés
puissent effectuer les actions appropriées.

#### Acceptance Criteria

1. THE Admin_Comment_API SHALL vérifier que l'utilisateur authentifié possède le
   rôle administrateur avant toute opération de lecture, modification ou
   suppression
2. IF un utilisateur non administrateur tente d'accéder à la Admin_Comment_API,
   THEN THE Admin_Comment_API SHALL retourner une réponse HTTP 403
3. THE Comment_System SHALL utiliser des politiques RLS Supabase permettant la
   lecture publique des commentaires, l'insertion et la modification par
   l'auteur authentifié, et la modification et suppression par les
   administrateurs
4. THE Comment_API SHALL vérifier que l'utilisateur est authentifié avant de
   permettre la création ou la modification d'un commentaire

### Requirement 8 : Validation cohérente

**User Story :** En tant que développeur, je veux que la validation des
commentaires soit cohérente entre le côté joueur et le côté admin, afin de
maintenir l'intégrité des données.

#### Acceptance Criteria

1. THE Comment_System SHALL utiliser un schéma de validation Zod unique
   (`commentSchema`) partagé entre le Comment_Form et le Admin_Comment_Form
2. THE Comment_API SHALL valider les données entrantes avec le `commentSchema`
   avant toute opération d'écriture en base de données
