# Document d'Exigences — Page de Gestion des Amis

## Introduction

La page de gestion des amis est une page dédiée accessible aux joueurs
authentifiés de Game Universe. Elle centralise toutes les fonctionnalités
sociales liées aux amitiés : consultation de la liste d'amis, approbation ou
refus des demandes reçues, recherche d'amis, et réception de notifications de
nouvelles demandes. Cette page complète le système d'amis existant (onglet «
Amis » dans le profil joueur) en offrant un point d'accès direct et complet
depuis la navigation principale.

## Glossaire

- **Friends_Page** : Page dédiée à la gestion des amis, accessible via la route
  `/friends` dans le layout authentifié.
- **Friends_Page_Content** : Composant principal qui orchestre l'affichage de la
  page (demandes en attente, liste d'amis, recherche).
- **Notification_Badge** : Indicateur visuel (pastille numérique) affiché sur le
  lien de navigation « Amis » indiquant le nombre de demandes en attente reçues.
- **Notification_API** : Endpoint API qui retourne le nombre de demandes
  d'amitié en attente reçues par le joueur authentifié.
- **Joueur_Authentifié** : Joueur connecté qui accède à la page de gestion des
  amis.
- **Friend_Request_Section** : Section de la page affichant les demandes
  d'amitié en attente reçues.
- **Friend_List_Section** : Section de la page affichant la liste des amis
  confirmés.
- **Friend_Service** : Service client existant qui encapsule les appels API
  d'amitié (déjà implémenté).
- **Sidebar_Nav** : Composant de navigation latérale du layout authentifié.

## Exigences

### Exigence 1 : Route et page dédiée

**User Story :** En tant que joueur authentifié, je veux accéder à une page
dédiée à la gestion de mes amis, afin de retrouver toutes les fonctionnalités
sociales en un seul endroit.

#### Critères d'acceptation

1. THE Friends_Page SHALL être accessible via la route `/[locale]/friends` dans
   le layout public authentifié.
2. WHEN un utilisateur non authentifié tente d'accéder à la Friends_Page, THE
   Friends_Page SHALL rediriger vers la page d'authentification.
3. THE Friends_Page SHALL utiliser le DashboardLayout existant pour conserver la
   navigation latérale et la barre supérieure.
4. THE Friends_Page SHALL afficher un titre de page traduit via next-intl.

### Exigence 2 : Lien de navigation dans la sidebar

**User Story :** En tant que joueur authentifié, je veux voir un lien « Amis »
dans la navigation latérale, afin d'accéder rapidement à la page de gestion des
amis.

#### Critères d'acceptation

1. WHILE le joueur est authentifié, THE Sidebar_Nav SHALL afficher un lien «
   Amis » dans la section « Mon espace » avec une icône appropriée.
2. WHEN le joueur navigue vers la Friends_Page, THE Sidebar_Nav SHALL mettre en
   surbrillance le lien « Amis » comme actif.
3. THE Sidebar_Nav SHALL afficher le lien « Amis » entre le lien « Collections »
   et le lien « Profil » dans la section « Mon espace ».

### Exigence 3 : Badge de notification des demandes en attente

**User Story :** En tant que joueur authentifié, je veux voir un badge indiquant
le nombre de demandes d'amitié en attente sur le lien de navigation, afin d'être
informé des nouvelles demandes sans ouvrir la page.

#### Critères d'acceptation

1. WHILE le joueur authentifié a des demandes d'amitié en attente reçues, THE
   Notification_Badge SHALL afficher le nombre de demandes sur le lien « Amis »
   dans la Sidebar_Nav.
2. IF le joueur authentifié n'a aucune demande en attente, THEN THE
   Notification_Badge SHALL être masqué.
3. WHEN le nombre de demandes en attente dépasse 9, THE Notification_Badge SHALL
   afficher « 9+ ».
4. WHEN une demande est acceptée ou refusée depuis la Friends_Page, THE
   Notification_Badge SHALL mettre à jour le compteur sans rechargement de la
   page.

### Exigence 4 : Endpoint API de comptage des demandes en attente

**User Story :** En tant que développeur front-end, je veux un endpoint API qui
retourne le nombre de demandes en attente, afin d'alimenter le badge de
notification.

#### Critères d'acceptation

1. WHEN le joueur authentifié requête le compteur de demandes en attente, THE
   Notification_API SHALL retourner le nombre de demandes d'amitié avec le
   statut `pending` où le joueur est destinataire.
2. IF un utilisateur non authentifié tente d'accéder au Notification_API, THEN
   THE Notification_API SHALL retourner une erreur 401.
3. THE Notification_API SHALL retourner la réponse en moins de 200ms pour une
   expérience fluide.

### Exigence 5 : Section des demandes d'amitié en attente

**User Story :** En tant que joueur authentifié, je veux voir et gérer mes
demandes d'amitié en attente sur la page dédiée, afin de pouvoir accepter ou
refuser les demandes reçues.

#### Critères d'acceptation

1. THE Friend_Request_Section SHALL afficher les demandes d'amitié en attente
   reçues par le Joueur_Authentifié en haut de la Friends_Page.
2. THE Friend_Request_Section SHALL afficher pour chaque demande : l'avatar du
   Joueur_Expéditeur, le nom d'affichage, la date de la demande, et des boutons
   « Accepter » et « Refuser ».
3. WHEN le Joueur_Authentifié clique sur « Accepter », THE
   Friend_Request_Section SHALL appeler le Friend_Service pour accepter la
   demande, retirer la demande de la liste, et ajouter le nouvel ami à la
   Friend_List_Section sans rechargement de la page.
4. WHEN le Joueur_Authentifié clique sur « Refuser », THE Friend_Request_Section
   SHALL appeler le Friend_Service pour refuser la demande et retirer la demande
   de la liste sans rechargement de la page.
5. IF aucune demande en attente n'existe, THEN THE Friend_Request_Section SHALL
   être masquée.
6. WHILE une opération d'acceptation ou de refus est en cours, THE
   Friend_Request_Section SHALL désactiver les boutons d'action et afficher un
   indicateur de chargement sur le bouton concerné.

### Exigence 6 : Liste des amis confirmés

**User Story :** En tant que joueur authentifié, je veux voir la liste complète
de mes amis sur la page dédiée, afin de retrouver facilement mes connexions.

#### Critères d'acceptation

1. THE Friend_List_Section SHALL afficher la liste des amis confirmés du
   Joueur_Authentifié sous forme de cartes.
2. THE Friend_List_Section SHALL afficher pour chaque ami : l'avatar, le nom
   d'affichage, le niveau, et un lien vers le profil de cet ami.
3. WHILE les amis sont en cours de chargement, THE Friend_List_Section SHALL
   afficher un indicateur de chargement (skeleton).
4. IF le Joueur_Authentifié n'a aucun ami confirmé, THEN THE Friend_List_Section
   SHALL afficher un message d'état vide avec une suggestion d'explorer la page
   des joueurs.
5. WHEN le Joueur_Authentifié fait défiler la liste jusqu'en bas, THE
   Friend_List_Section SHALL charger automatiquement la page suivante d'amis
   (scroll infini).
6. THE Friend_List_Section SHALL afficher le nombre total d'amis confirmés dans
   un en-tête de section.

### Exigence 7 : Recherche d'amis

**User Story :** En tant que joueur authentifié, je veux pouvoir rechercher un
ami par nom dans ma liste, afin de retrouver rapidement un ami spécifique.

#### Critères d'acceptation

1. THE Friends_Page SHALL afficher une barre de recherche au-dessus de la
   Friend_List_Section.
2. WHEN le Joueur_Authentifié saisit du texte dans la barre de recherche, THE
   Friend_List_Section SHALL filtrer la liste pour n'afficher que les amis dont
   le nom d'affichage contient le texte saisi (insensible à la casse).
3. WHEN le Joueur_Authentifié efface le texte de recherche, THE
   Friend_List_Section SHALL afficher la liste complète des amis.

### Exigence 8 : Suppression d'un ami depuis la page

**User Story :** En tant que joueur authentifié, je veux pouvoir retirer un ami
depuis la page de gestion, afin de gérer ma liste d'amis directement.

#### Critères d'acceptation

1. THE Friend_List_Section SHALL afficher un bouton de suppression sur chaque
   carte d'ami.
2. WHEN le Joueur_Authentifié clique sur le bouton de suppression, THE
   Friend_List_Section SHALL afficher une confirmation avant de procéder.
3. WHEN le Joueur_Authentifié confirme la suppression, THE Friend_List_Section
   SHALL appeler le Friend_Service pour retirer l'ami, retirer la carte de la
   liste, et mettre à jour le compteur d'amis sans rechargement de la page.
4. WHILE une opération de suppression est en cours, THE Friend_List_Section
   SHALL désactiver le bouton de suppression et afficher un indicateur de
   chargement.

### Exigence 9 : Internationalisation

**User Story :** En tant que joueur francophone ou anglophone, je veux que la
page de gestion des amis soit traduite dans ma langue, afin de comprendre le
contenu affiché.

#### Critères d'acceptation

1. THE Friends_Page SHALL utiliser les clés de traduction next-intl pour tous
   les libellés : titre de page, en-têtes de section, boutons, messages d'état
   vide, et texte du badge de notification.
2. THE Sidebar_Nav SHALL utiliser une clé de traduction next-intl pour le
   libellé du lien « Amis ».
3. THE Friends_Page SHALL réutiliser les clés de traduction existantes du
   namespace `friends` lorsque les libellés sont identiques à ceux de l'onglet
   Amis du profil.

### Exigence 10 : Accessibilité

**User Story :** En tant que joueur, je veux que la page de gestion des amis
soit accessible, afin d'avoir une expérience inclusive.

#### Critères d'acceptation

1. THE Friends_Page SHALL structurer le contenu avec des landmarks ARIA
   appropriés (`main`, `section` avec `aria-label`).
2. THE Friend_Request_Section SHALL associer des attributs `aria-label`
   descriptifs aux boutons « Accepter » et « Refuser » incluant le nom du joueur
   concerné.
3. WHILE une opération est en cours, THE Friend_Request_Section SHALL indiquer
   l'état de chargement via `aria-busy="true"`.
4. THE Friend_List_Section SHALL utiliser `role="list"` et `aria-label` pour la
   grille d'amis.
5. THE Notification_Badge SHALL utiliser un attribut `aria-label` décrivant le
   nombre de demandes en attente (ex: « 3 demandes d'amitié en attente »).
6. THE Friends_Page SHALL être entièrement navigable au clavier.
