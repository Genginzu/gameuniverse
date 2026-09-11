# Document de Requirements

## Introduction

La fonctionnalité "Gestion des avis (admin)" permet aux administrateurs de
consulter, modifier et supprimer les avis (reviews) soumis par les joueurs sur
les jeux. Elle s'intègre dans le panneau d'administration existant, en suivant
les mêmes patterns que la gestion des jeux, personnages et autres entités admin.
Les administrateurs accèdent à une liste paginée des avis avec recherche et tri,
peuvent éditer le contenu d'un avis (note, texte, points positifs/négatifs) et
supprimer un avis avec confirmation.

## Glossaire

- **Admin_Review_System** : Le système de gestion des avis côté administration,
  comprenant la liste, l'édition et la suppression des reviews
- **Admin_Review_List** : La page listant tous les avis avec pagination,
  recherche et tri
- **Admin_Review_Form** : Le formulaire d'édition d'un avis existant par un
  administrateur
- **Review** : Un avis soumis par un joueur sur un jeu, comprenant une note
  (rating), un contenu enrichi (HTML), des points positifs et des points
  négatifs
- **Rating** : La note attribuée par un joueur à un jeu, entier entre 0 et 20
- **Admin_API** : Les routes API sous `/api/admin/reviews` permettant les
  opérations CRUD sur les avis
- **Administrator** : Un utilisateur authentifié disposant du rôle
  administrateur dans les métadonnées Supabase

## Requirements

### Requirement 1

**User Story :** En tant qu'administrateur, je veux consulter la liste de tous
les avis des joueurs, afin de pouvoir surveiller et modérer le contenu.

#### Acceptance Criteria

1. WHEN un administrateur accède à la page Admin_Review_List, THE
   Admin_Review_System SHALL afficher la liste paginée de toutes les reviews
   existantes
2. WHEN la Admin_Review_List affiche une review, THE Admin_Review_System SHALL
   montrer le nom du joueur, le titre du jeu, la note sur 20, un extrait du
   contenu et la date de création
3. WHEN un administrateur saisit un terme de recherche, THE Admin_Review_System
   SHALL filtrer les reviews par nom de joueur ou titre de jeu correspondant au
   terme
4. WHEN un administrateur clique sur un en-tête de colonne triable, THE
   Admin_Review_System SHALL trier la liste selon la colonne sélectionnée en
   ordre ascendant ou descendant
5. WHEN aucune review n'existe dans le système, THE Admin_Review_List SHALL
   afficher un message indiquant qu'aucun avis n'a été trouvé

### Requirement 2

**User Story :** En tant qu'administrateur, je veux modifier un avis existant,
afin de corriger du contenu inapproprié ou des erreurs.

#### Acceptance Criteria

1. WHEN un administrateur clique sur le bouton d'édition d'une review, THE
   Admin_Review_System SHALL afficher le Admin_Review_Form pré-rempli avec les
   données actuelles de la review
2. WHEN un administrateur modifie les champs du Admin_Review_Form et soumet, THE
   Admin_Review_System SHALL mettre à jour la review en base de données avec les
   nouvelles valeurs
3. WHEN un administrateur soumet le Admin_Review_Form, THE Admin_Review_System
   SHALL valider que le Rating est un entier entre 0 et 20, que le contenu
   enrichi est non vide après suppression des balises HTML, que le texte brut ne
   dépasse pas 5000 caractères, et que chaque point positif et négatif est non
   vide et ne dépasse pas 200 caractères
4. IF la validation du Admin_Review_Form échoue, THEN THE Admin_Review_System
   SHALL afficher les messages d'erreur correspondants sans perdre les données
   saisies
5. WHEN la mise à jour réussit, THE Admin_Review_System SHALL afficher une
   notification de succès et rediriger vers la Admin_Review_List

### Requirement 3

**User Story :** En tant qu'administrateur, je veux supprimer un avis, afin de
retirer du contenu inapproprié de la plateforme.

#### Acceptance Criteria

1. WHEN un administrateur clique sur le bouton de suppression d'une review, THE
   Admin_Review_System SHALL afficher une boîte de dialogue de confirmation
   indiquant le nom du joueur et le titre du jeu
2. WHEN un administrateur confirme la suppression, THE Admin_Review_System SHALL
   supprimer la review de la base de données
3. WHEN la suppression réussit, THE Admin_Review_System SHALL afficher une
   notification de succès et rafraîchir la Admin_Review_List
4. IF la suppression échoue, THEN THE Admin_Review_System SHALL afficher un
   message d'erreur sans modifier l'état de la liste

### Requirement 4

**User Story :** En tant qu'administrateur, je veux que les opérations sur les
avis soient sécurisées, afin que seuls les administrateurs puissent modifier ou
supprimer des avis.

#### Acceptance Criteria

1. THE Admin_API SHALL vérifier que l'utilisateur authentifié possède le rôle
   administrateur avant toute opération de lecture, modification ou suppression
2. IF un utilisateur non administrateur tente d'accéder à la Admin_API, THEN THE
   Admin_API SHALL retourner une réponse HTTP 403
3. THE Admin_Review_System SHALL utiliser des politiques RLS Supabase permettant
   aux administrateurs de modifier et supprimer toute review indépendamment de
   l'auteur original

### Requirement 5

**User Story :** En tant qu'administrateur, je veux que la validation des avis
modifiés soit cohérente avec la validation côté joueur, afin de maintenir
l'intégrité des données.

#### Acceptance Criteria

1. THE Admin_Review_Form SHALL réutiliser le schéma de validation Zod existant
   (`reviewSchema`) pour valider les données avant soumission
2. WHEN un administrateur modifie un avis, THE Admin_Review_System SHALL mettre
   à jour le champ `updated_at` de la review avec la date et heure courante
