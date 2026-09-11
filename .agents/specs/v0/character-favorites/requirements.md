# Document de Spécifications : Favoris de Personnages

## Introduction

Le système de favoris de personnages permet aux utilisateurs authentifiés de
marquer des personnages comme favoris, à l'image du système de bibliothèque
existant pour les jeux. Cette fonctionnalité inclut une table
`character_favorites` en base de données, un compteur de favoris visible sur la
fiche de chaque personnage, un bouton pour ajouter/retirer un personnage de ses
favoris, et une page « Mes personnages favoris » accessible depuis le profil du
joueur.

## Glossaire

- **Favorite_System** : Le système responsable de la gestion des favoris de
  personnages (ajout, suppression, comptage)
- **Character_Detail_Page** : La page de détails d'un personnage affichant ses
  informations complètes
- **Favorite_Button** : Le composant interactif permettant d'ajouter ou retirer
  un personnage des favoris
- **Favorite_Counter** : Le compteur affichant le nombre total de fois qu'un
  personnage a été mis en favori
- **Favorites_Page** : La page listant tous les personnages favoris d'un joueur
- **Player_Profile** : La page de profil public d'un joueur affichant ses
  informations et collections
- **Authenticated_User** : Un utilisateur connecté à la plateforme via Supabase
  Auth

## Exigences

### Exigence 1 : Ajouter et retirer un personnage des favoris

**User Story :** En tant qu'utilisateur authentifié, je veux pouvoir ajouter ou
retirer un personnage de mes favoris, afin de constituer une collection de
personnages que j'apprécie.

#### Critères d'acceptation

1. WHEN un Authenticated_User clique sur le Favorite_Button d'un personnage qui
   n'est pas dans ses favoris, THEN le Favorite_System SHALL ajouter le
   personnage aux favoris de l'utilisateur et mettre à jour le Favorite_Button
   pour refléter l'état favori
2. WHEN un Authenticated_User clique sur le Favorite_Button d'un personnage déjà
   dans ses favoris, THEN le Favorite_System SHALL retirer le personnage des
   favoris de l'utilisateur et mettre à jour le Favorite_Button pour refléter
   l'état non-favori
3. WHEN un utilisateur non authentifié consulte la Character_Detail_Page, THEN
   le Favorite_Button SHALL être masqué ou désactivé
4. IF une erreur réseau survient lors de l'ajout ou du retrait d'un favori, THEN
   le Favorite_System SHALL afficher un message d'erreur et restaurer l'état
   précédent du Favorite_Button

### Exigence 2 : Compteur de favoris sur la fiche personnage

**User Story :** En tant qu'utilisateur, je veux voir combien de personnes ont
mis un personnage en favori, afin de connaître sa popularité.

#### Critères d'acceptation

1. WHEN un utilisateur consulte la Character_Detail_Page, THEN le
   Favorite_Counter SHALL afficher le nombre total d'utilisateurs ayant mis ce
   personnage en favori
2. WHEN un Authenticated_User ajoute un personnage à ses favoris, THEN le
   Favorite_Counter SHALL s'incrémenter de 1 immédiatement dans l'interface
3. WHEN un Authenticated_User retire un personnage de ses favoris, THEN le
   Favorite_Counter SHALL se décrémenter de 1 immédiatement dans l'interface
4. WHEN le compteur de favoris est égal à zéro, THEN le Favorite_Counter SHALL
   afficher « 0 » ou un état vide approprié

### Exigence 3 : Page des personnages favoris

**User Story :** En tant qu'utilisateur authentifié, je veux consulter la liste
de mes personnages favoris, afin de retrouver facilement les personnages que
j'apprécie.

#### Critères d'acceptation

1. WHEN un Authenticated_User accède à la Favorites_Page, THEN le
   Favorite_System SHALL afficher la liste de ses personnages favoris triés par
   date d'ajout décroissante
2. WHEN la Favorites_Page affiche des personnages, THEN le Favorite_System SHALL
   montrer pour chaque personnage son image, son nom, son rôle et son jeu
   principal
3. WHEN un Authenticated_User n'a aucun personnage favori, THEN la
   Favorites_Page SHALL afficher un message d'état vide avec un lien vers la
   page des personnages
4. WHEN un utilisateur non authentifié tente d'accéder à la Favorites_Page, THEN
   le Favorite_System SHALL rediriger vers la page de connexion

### Exigence 4 : Favoris visibles sur le profil joueur

**User Story :** En tant qu'utilisateur, je veux voir les personnages favoris
d'un joueur sur son profil, afin de découvrir ses préférences.

#### Critères d'acceptation

1. WHEN un utilisateur consulte le Player_Profile d'un joueur, THEN le
   Favorite_System SHALL afficher une section montrant les personnages favoris
   de ce joueur
2. WHEN un joueur a plus de personnages favoris que l'espace disponible, THEN le
   Player_Profile SHALL afficher un lien « Voir tous les favoris » menant à la
   liste complète
3. WHEN un joueur n'a aucun personnage favori, THEN la section favoris du
   Player_Profile SHALL afficher un message approprié

### Exigence 5 : Persistance et intégrité des données

**User Story :** En tant qu'administrateur système, je veux que les données de
favoris soient stockées de manière fiable et sécurisée, afin de garantir
l'intégrité du système.

#### Critères d'acceptation

1. THE Favorite_System SHALL stocker chaque favori avec l'identifiant de
   l'utilisateur, l'identifiant du personnage et la date d'ajout dans la table
   `character_favorites`
2. THE Favorite_System SHALL empêcher un utilisateur de mettre le même
   personnage en favori plus d'une fois via une contrainte d'unicité
3. WHEN un personnage est supprimé de la base de données, THEN le
   Favorite_System SHALL supprimer automatiquement tous les favoris associés via
   une suppression en cascade
4. WHEN un utilisateur est supprimé, THEN le Favorite_System SHALL supprimer
   automatiquement tous ses favoris via une suppression en cascade
5. THE Favorite_System SHALL appliquer des politiques RLS pour que chaque
   utilisateur puisse uniquement créer et supprimer ses propres favoris, tout en
   permettant la lecture publique des favoris
