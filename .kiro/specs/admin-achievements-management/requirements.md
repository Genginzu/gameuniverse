# Document d'Exigences — Gestion Admin des Succès

## Introduction

Ce document décrit les exigences pour l'interface d'administration CRUD du
catalogue de succès (achievements). La table `achievement_catalog` existe déjà
en base de données (créée par la spec `achievements-system`). Cette feature
ajoute les pages d'administration permettant de lister, créer, modifier et
supprimer les entrées du catalogue depuis l'interface admin existante, en
suivant les mêmes patterns que les autres entités admin (genres, companies,
languages, etc.).

## Glossaire

- **Admin_Achievements_API** : Ensemble de routes API protégées par
  authentification admin, responsables des opérations CRUD sur la table
  `achievement_catalog`
- **Admin_Achievements_Page** : Page d'administration listant tous les succès du
  catalogue avec pagination, recherche et tri
- **Achievement_Form** : Formulaire de création et d'édition d'un succès, avec
  validation Zod des champs
- **Achievement_Catalog** : Table de référence existante en base de données
  contenant la définition de chaque succès (clé, catégorie, palier, seuil, XP,
  icône, traductions FR/EN)
- **Admin_Sidebar** : Barre latérale de navigation de l'interface admin,
  contenant les liens vers les différentes sections de gestion
- **Delete_Achievement_Dialog** : Dialogue de confirmation avant suppression
  d'un succès du catalogue
- **Player_Achievements_Table** : Table existante `player_achievements` stockant
  les succès débloqués par joueur (user_id, achievement_key, unlocked_at)
- **Player_XP_Table** : Table existante `player_xp` stockant le total d'XP
  accumulé par joueur (user_id, xp_total), utilisée pour calculer le niveau
  (level = floor(0.3 × √(xp_total)) + 1)
- **Player_Achievement_Manager** : Interface admin permettant de rechercher un
  joueur, visualiser ses succès débloqués et verrouillés, et attribuer ou
  retirer manuellement un succès
- **Assign_Achievement_Dialog** : Dialogue de confirmation avant attribution
  manuelle d'un succès à un joueur
- **Revoke_Achievement_Dialog** : Dialogue de confirmation avant retrait d'un
  succès d'un joueur

## Exigences

### Exigence 1 : Liste des succès avec pagination, recherche et tri

**User Story :** En tant qu'administrateur, je veux voir la liste de tous les
succès du catalogue avec pagination, recherche et tri, afin de naviguer
facilement dans le catalogue existant.

#### Critères d'acceptation

1. WHEN un administrateur accède à la page de gestion des succès, THE
   Admin_Achievements_Page SHALL afficher la liste des succès du catalogue sous
   forme de tableau avec les colonnes : clé, catégorie, palier, seuil, XP, nom
   (dans la locale active)
2. THE Admin_Achievements_Page SHALL paginer les résultats avec un nombre
   configurable d'éléments par page
3. WHEN un administrateur saisit un terme de recherche, THE
   Admin_Achievements_Page SHALL filtrer les succès par clé ou par nom (dans la
   locale active)
4. WHEN un administrateur clique sur un en-tête de colonne, THE
   Admin_Achievements_Page SHALL trier les résultats par cette colonne en ordre
   ascendant ou descendant
5. THE Admin_Achievements_Page SHALL afficher un indicateur de chargement
   pendant la récupération des données
6. WHEN le catalogue ne contient aucun succès, THE Admin_Achievements_Page SHALL
   afficher un message indiquant que le catalogue est vide

### Exigence 2 : Création d'un succès

**User Story :** En tant qu'administrateur, je veux créer un nouveau succès dans
le catalogue, afin d'enrichir le système de succès sans intervention technique.

#### Critères d'acceptation

1. WHEN un administrateur accède au formulaire de création, THE Achievement_Form
   SHALL afficher les champs : clé, catégorie (sélection parmi library,
   playtime, reviews, social, collections), palier (sélection parmi bronze,
   silver, gold), seuil, valeur XP, icône, nom FR, nom EN, description FR,
   description EN, ordre d'affichage
2. THE Achievement_Form SHALL valider que tous les champs obligatoires sont
   remplis avant soumission
3. THE Achievement_Form SHALL valider que la clé est unique dans le catalogue
4. THE Achievement_Form SHALL valider que le seuil et la valeur XP sont des
   entiers positifs
5. WHEN le formulaire est soumis avec des données valides, THE
   Admin_Achievements_API SHALL insérer le succès dans la table
   achievement_catalog et retourner le succès créé
6. WHEN le formulaire est soumis avec une clé déjà existante, THE
   Admin_Achievements_API SHALL retourner une erreur 409 avec un message
   descriptif
7. IF la création échoue en base de données, THEN THE Admin_Achievements_API
   SHALL retourner une erreur 500 avec un message descriptif
8. WHEN la création réussit, THE Achievement_Form SHALL afficher une
   notification de succès et rediriger vers la liste des succès

### Exigence 3 : Modification d'un succès

**User Story :** En tant qu'administrateur, je veux modifier un succès existant
du catalogue, afin de corriger ou ajuster les paramètres d'un succès.

#### Critères d'acceptation

1. WHEN un administrateur accède au formulaire d'édition d'un succès, THE
   Achievement_Form SHALL pré-remplir tous les champs avec les valeurs actuelles
   du succès
2. THE Achievement_Form SHALL appliquer les mêmes validations que lors de la
   création (champs obligatoires, entiers positifs, unicité de la clé)
3. WHEN le formulaire est soumis avec des données valides, THE
   Admin_Achievements_API SHALL mettre à jour le succès dans la table
   achievement_catalog et retourner le succès modifié
4. IF le succès demandé n'existe pas, THEN THE Admin_Achievements_API SHALL
   retourner une erreur 404 avec un message descriptif
5. WHEN la modification réussit, THE Achievement_Form SHALL afficher une
   notification de succès et rediriger vers la liste des succès

### Exigence 4 : Suppression d'un succès

**User Story :** En tant qu'administrateur, je veux supprimer un succès du
catalogue, afin de retirer un succès obsolète ou erroné.

#### Critères d'acceptation

1. WHEN un administrateur demande la suppression d'un succès, THE
   Delete_Achievement_Dialog SHALL afficher un dialogue de confirmation avec le
   nom du succès
2. THE Delete_Achievement_Dialog SHALL vérifier si des joueurs ont déjà débloqué
   ce succès et afficher le nombre de joueurs concernés dans le dialogue
3. WHEN l'administrateur confirme la suppression, THE Admin_Achievements_API
   SHALL supprimer le succès de la table achievement_catalog
4. IF des joueurs ont débloqué le succès, THEN THE Delete_Achievement_Dialog
   SHALL avertir l'administrateur et exiger une confirmation explicite (mode
   force) avant suppression
5. IF le succès demandé n'existe pas, THEN THE Admin_Achievements_API SHALL
   retourner une erreur 404 avec un message descriptif
6. WHEN la suppression réussit, THE Admin_Achievements_Page SHALL retirer le
   succès de la liste et afficher une notification de succès

### Exigence 5 : Protection par authentification admin

**User Story :** En tant que système, je veux que toutes les opérations CRUD sur
le catalogue de succès soient protégées par authentification admin, afin
d'empêcher les accès non autorisés.

#### Critères d'acceptation

1. THE Admin_Achievements_API SHALL vérifier que l'utilisateur est authentifié
   et possède le rôle admin avant chaque opération (GET, POST, PUT, DELETE)
2. IF l'utilisateur n'est pas authentifié ou ne possède pas le rôle admin, THEN
   THE Admin_Achievements_API SHALL retourner une erreur 403 avec le message «
   Admin access required »
3. THE Admin_Achievements_API SHALL valider les données d'entrée avec un schéma
   Zod avant toute opération d'écriture (POST, PUT)
4. IF les données d'entrée sont invalides, THEN THE Admin_Achievements_API SHALL
   retourner une erreur 400 avec les détails de validation

### Exigence 6 : Navigation admin

**User Story :** En tant qu'administrateur, je veux accéder à la gestion des
succès depuis la barre latérale admin, afin de naviguer facilement vers cette
section.

#### Critères d'acceptation

1. THE Admin_Sidebar SHALL afficher un lien vers la page de gestion des succès
   dans une catégorie appropriée de la navigation
2. WHEN l'administrateur se trouve sur la page de gestion des succès, THE
   Admin_Sidebar SHALL mettre en surbrillance le lien correspondant
3. THE Admin_Achievements_Page SHALL afficher un bouton de création permettant
   d'accéder au formulaire de nouveau succès

### Exigence 7 : Internationalisation

**User Story :** En tant qu'administrateur francophone ou anglophone, je veux
que l'interface de gestion des succès soit traduite dans ma langue, afin de
comprendre tous les éléments de l'interface.

#### Critères d'acceptation

1. THE Admin_Achievements_Page SHALL afficher tous les textes d'interface
   (titres, labels de colonnes, boutons, messages) en français et en anglais via
   next-intl
2. THE Achievement_Form SHALL afficher tous les labels de champs et messages de
   validation en français et en anglais via next-intl
3. THE Delete_Achievement_Dialog SHALL afficher tous les textes (titre, message
   de confirmation, boutons) en français et en anglais via next-intl
4. WHEN la langue du site est changée, THE Admin_Achievements_Page SHALL
   afficher les traductions correspondantes sans rechargement de page

### Exigence 8 : Attribution et retrait manuels de succès pour un joueur

**User Story :** En tant qu'administrateur, je veux pouvoir attribuer ou retirer
manuellement un succès à un joueur spécifique, afin de corriger des erreurs ou
récompenser des actions exceptionnelles.

#### Critères d'acceptation

1. WHEN un administrateur accède au Player_Achievement_Manager, THE
   Player_Achievement_Manager SHALL afficher un champ de recherche permettant de
   trouver un joueur par nom d'utilisateur ou identifiant
2. WHEN un administrateur sélectionne un joueur, THE Player_Achievement_Manager
   SHALL afficher la liste de tous les succès du catalogue, en distinguant
   visuellement les succès débloqués des succès verrouillés pour ce joueur
3. WHEN un administrateur demande l'attribution d'un succès verrouillé à un
   joueur, THE Assign_Achievement_Dialog SHALL afficher un dialogue de
   confirmation indiquant le nom du succès, le nom du joueur et la valeur XP qui
   sera ajoutée
4. WHEN l'administrateur confirme l'attribution, THE Admin_Achievements_API
   SHALL insérer une entrée dans la Player_Achievements_Table avec le user_id du
   joueur et la achievement_key du succès
5. WHEN l'attribution est confirmée, THE Admin_Achievements_API SHALL ajouter la
   valeur XP du succès au xp_total du joueur dans la Player_XP_Table et
   recalculer le niveau du joueur
6. IF le joueur ne possède pas encore de ligne dans la Player_XP_Table, THEN THE
   Admin_Achievements_API SHALL créer une ligne avec le xp_total initialisé à la
   valeur XP du succès attribué
7. IF le succès est déjà débloqué pour ce joueur, THEN THE
   Admin_Achievements_API SHALL retourner une erreur 409 avec un message
   indiquant que le succès est déjà attribué
8. WHEN un administrateur demande le retrait d'un succès débloqué d'un joueur,
   THE Revoke_Achievement_Dialog SHALL afficher un dialogue de confirmation
   indiquant le nom du succès, le nom du joueur et la valeur XP qui sera retirée
9. WHEN l'administrateur confirme le retrait, THE Admin_Achievements_API SHALL
   supprimer l'entrée correspondante de la Player_Achievements_Table
10. WHEN le retrait est confirmé, THE Admin_Achievements_API SHALL soustraire la
    valeur XP du succès du xp_total du joueur dans la Player_XP_Table et
    recalculer le niveau du joueur
11. THE Admin_Achievements_API SHALL garantir que le xp_total du joueur ne
    descend pas en dessous de zéro après un retrait
12. IF le succès demandé n'est pas débloqué pour ce joueur, THEN THE
    Admin_Achievements_API SHALL retourner une erreur 404 avec un message
    indiquant que le succès n'est pas attribué à ce joueur
13. THE Admin_Achievements_API SHALL vérifier que l'utilisateur possède le rôle
    admin avant toute opération d'attribution ou de retrait
14. WHEN une attribution ou un retrait réussit, THE Player_Achievement_Manager
    SHALL mettre à jour la liste des succès du joueur et afficher une
    notification de succès
15. THE Player_Achievement_Manager SHALL afficher tous les textes d'interface en
    français et en anglais via next-intl
