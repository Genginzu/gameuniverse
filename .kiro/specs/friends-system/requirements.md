# Document d'Exigences — Système d'Amis

## Introduction

Le système d'amis permet aux joueurs de Game Universe de se connecter entre eux
via des demandes d'amitié. Un joueur authentifié peut envoyer une demande d'ami
à un autre joueur, qui peut l'accepter ou la refuser. Les amis confirmés
apparaissent dans l'onglet « Amis » du profil joueur (onglet déjà présent dans
`PlayerProfileTabs` mais sans contenu). Le compteur d'amis affiché dans la
bannière du profil (`PlayerProfileBanner`) est actuellement codé en dur à 0 et
doit refléter le nombre réel d'amis. Le système inclut également la gestion des
demandes en attente et la possibilité de retirer un ami.

## Glossaire

- **Friendship** : Relation bidirectionnelle entre deux joueurs confirmée par
  les deux parties.
- **Friend_Request** : Demande d'amitié envoyée par un Joueur_Expéditeur à un
  Joueur_Destinataire, en attente d'acceptation ou de refus.
- **Joueur_Expéditeur** : Joueur authentifié qui initie une demande d'amitié.
- **Joueur_Destinataire** : Joueur qui reçoit une demande d'amitié.
- **Friend_API** : Ensemble des endpoints API qui gèrent les opérations liées
  aux amis (envoi, acceptation, refus, suppression, liste).
- **Friend_Service** : Service côté client qui encapsule les appels au
  Friend_API.
- **Friend_List** : Composant qui affiche la liste des amis confirmés d'un
  joueur dans l'onglet « Amis ».
- **Friend_Request_List** : Composant qui affiche les demandes d'amitié en
  attente (reçues et envoyées) pour le propriétaire du profil.
- **Visiteur** : Tout utilisateur (authentifié ou non) qui consulte le profil
  d'un joueur.
- **Propriétaire** : Le joueur authentifié qui consulte son propre profil.
- **Joueur_Cible** : Le joueur dont le profil est consulté.

## Exigences

### Exigence 1 : Table de base de données des amitiés

**User Story :** En tant que développeur, je veux une table de base de données
pour stocker les relations d'amitié, afin de persister les demandes et les amis
confirmés.

#### Critères d'acceptation

1. THE Friendship SHALL stocker un identifiant unique, l'identifiant du
   Joueur_Expéditeur, l'identifiant du Joueur_Destinataire, un statut
   (`pending`, `accepted`, `declined`), la date de création et la date de mise à
   jour.
2. THE Friendship SHALL imposer une contrainte d'unicité sur la paire
   (Joueur_Expéditeur, Joueur_Destinataire) pour empêcher les demandes en
   double.
3. THE Friendship SHALL imposer une contrainte CHECK garantissant que le
   Joueur_Expéditeur est différent du Joueur_Destinataire.
4. THE Friendship SHALL référencer la table `profiles` via des clés étrangères
   avec suppression en cascade.
5. THE Friendship SHALL activer Row Level Security avec des politiques
   permettant : la lecture publique des amitiés acceptées, la lecture des
   demandes en attente uniquement par les joueurs concernés, et la modification
   uniquement par les joueurs concernés.

### Exigence 2 : Endpoints API des amitiés

**User Story :** En tant que développeur front-end, je veux des endpoints API
pour gérer les opérations d'amitié, afin de pouvoir envoyer, accepter, refuser
et supprimer des demandes d'amitié.

#### Critères d'acceptation

1. WHEN un Joueur_Expéditeur authentifié envoie une demande d'ami à un
   Joueur_Destinataire, THE Friend_API SHALL créer une Friend_Request avec le
   statut `pending` et retourner un code 201.
2. IF le Joueur_Expéditeur tente d'envoyer une demande à un joueur avec lequel
   une relation existe déjà (pending ou accepted), THEN THE Friend_API SHALL
   retourner une erreur 409 avec un message descriptif.
3. IF le Joueur_Expéditeur tente de s'envoyer une demande à lui-même, THEN THE
   Friend_API SHALL retourner une erreur 400 avec un message descriptif.
4. WHEN le Joueur_Destinataire accepte une Friend_Request, THE Friend_API SHALL
   mettre à jour le statut à `accepted` et retourner un code 200.
5. WHEN le Joueur_Destinataire refuse une Friend_Request, THE Friend_API SHALL
   supprimer la Friend_Request et retourner un code 200.
6. WHEN un joueur supprime une Friendship acceptée, THE Friend_API SHALL
   supprimer la ligne correspondante et retourner un code 200.
7. IF un utilisateur non authentifié tente une opération de modification, THEN
   THE Friend_API SHALL retourner une erreur 401.
8. IF le Joueur_Destinataire n'existe pas, THEN THE Friend_API SHALL retourner
   une erreur 404 avec un message descriptif.

### Exigence 3 : Endpoint API de liste d'amis

**User Story :** En tant que développeur front-end, je veux un endpoint API qui
retourne la liste des amis d'un joueur, afin d'alimenter l'onglet Amis et le
compteur de la bannière.

#### Critères d'acceptation

1. WHEN un Visiteur requête la liste d'amis d'un Joueur_Cible, THE Friend_API
   SHALL retourner les amis confirmés (statut `accepted`) triés par date
   d'acceptation décroissante.
2. THE Friend_API SHALL retourner pour chaque ami : l'identifiant, le nom
   d'affichage, l'URL de l'avatar, le niveau et la date d'acceptation de
   l'amitié.
3. WHEN un paramètre `page` est fourni, THE Friend_API SHALL retourner la page
   correspondante avec un maximum de 20 amis par page.
4. THE Friend_API SHALL inclure le nombre total d'amis confirmés et les
   informations de pagination dans la réponse.
5. WHEN le Propriétaire requête sa propre liste d'amis, THE Friend_API SHALL
   inclure également les demandes en attente reçues (statut `pending`) dans un
   champ séparé.

### Exigence 4 : Affichage de l'onglet Amis

**User Story :** En tant que visiteur, je veux voir la liste des amis d'un
joueur dans l'onglet Amis de son profil, afin de découvrir ses connexions sur la
plateforme.

#### Critères d'acceptation

1. WHEN le Visiteur sélectionne l'onglet « Amis », THE Friend_List SHALL
   afficher la liste des amis confirmés du Joueur_Cible sous forme de cartes.
2. THE Friend_List SHALL afficher pour chaque ami : l'avatar, le nom
   d'affichage, le niveau et un lien vers le profil de cet ami.
3. WHILE les amis sont en cours de chargement, THE Friend_List SHALL afficher un
   indicateur de chargement (skeleton).
4. IF le Joueur_Cible n'a aucun ami confirmé, THEN THE Friend_List SHALL
   afficher un message indiquant l'absence d'amis.
5. WHEN le Visiteur fait défiler la liste jusqu'en bas, THE Friend_List SHALL
   charger automatiquement la page suivante d'amis (scroll infini).
6. THE Friend_List SHALL permettre de rechercher un ami par nom dans la liste.

### Exigence 5 : Gestion des demandes d'amitié (vue propriétaire)

**User Story :** En tant que propriétaire de mon profil, je veux voir et gérer
mes demandes d'amitié en attente, afin de pouvoir accepter ou refuser les
demandes reçues.

#### Critères d'acceptation

1. WHILE le Propriétaire consulte l'onglet « Amis » de son propre profil, THE
   Friend_Request_List SHALL afficher une section dédiée aux demandes en attente
   reçues, au-dessus de la liste d'amis.
2. THE Friend_Request_List SHALL afficher pour chaque demande reçue : l'avatar
   et le nom du Joueur_Expéditeur, la date de la demande, et des boutons «
   Accepter » et « Refuser ».
3. WHEN le Propriétaire clique sur « Accepter », THE Friend_Request_List SHALL
   appeler le Friend_API pour accepter la demande et mettre à jour la liste sans
   rechargement complet de la page.
4. WHEN le Propriétaire clique sur « Refuser », THE Friend_Request_List SHALL
   appeler le Friend_API pour refuser la demande et retirer la demande de la
   liste sans rechargement complet de la page.
5. IF aucune demande en attente n'existe, THEN THE Friend_Request_List SHALL
   masquer la section des demandes en attente.
6. WHILE une opération d'acceptation ou de refus est en cours, THE
   Friend_Request_List SHALL désactiver les boutons d'action et afficher un
   indicateur de chargement sur le bouton concerné.

### Exigence 6 : Bouton d'ajout d'ami sur le profil

**User Story :** En tant que joueur authentifié, je veux pouvoir envoyer une
demande d'ami depuis le profil d'un autre joueur, afin de me connecter avec des
joueurs qui m'intéressent.

#### Critères d'acceptation

1. WHILE un joueur authentifié consulte le profil d'un autre joueur avec lequel
   aucune relation n'existe, THE Player_Profile SHALL afficher un bouton «
   Ajouter en ami ».
2. WHEN le joueur authentifié clique sur « Ajouter en ami », THE Player_Profile
   SHALL envoyer une demande d'amitié via le Friend_API et mettre à jour le
   bouton pour indiquer « Demande envoyée ».
3. WHILE une demande d'amitié est en attente (envoyée par le joueur
   authentifié), THE Player_Profile SHALL afficher un bouton « Demande envoyée »
   désactivé.
4. WHILE une demande d'amitié est en attente (reçue par le joueur authentifié),
   THE Player_Profile SHALL afficher des boutons « Accepter » et « Refuser ».
5. WHILE les deux joueurs sont amis confirmés, THE Player_Profile SHALL afficher
   un bouton « Retirer des amis » avec une confirmation avant suppression.
6. IF le joueur n'est pas authentifié, THEN THE Player_Profile SHALL masquer le
   bouton d'ajout d'ami.

### Exigence 7 : Compteur d'amis dans la bannière

**User Story :** En tant que visiteur, je veux voir le nombre réel d'amis d'un
joueur dans la bannière de son profil, afin d'avoir une vue d'ensemble de sa
présence sociale.

#### Critères d'acceptation

1. THE Player_Profile SHALL afficher le nombre réel d'amis confirmés du
   Joueur_Cible dans le compteur « FRIEND » de la bannière (remplaçant la valeur
   codée en dur à 0).
2. WHEN une amitié est acceptée ou supprimée sur le profil du Joueur_Cible, THE
   Player_Profile SHALL mettre à jour le compteur d'amis sans rechargement
   complet de la page.

### Exigence 8 : Service client des amitiés

**User Story :** En tant que développeur front-end, je veux un service client
qui encapsule les appels à l'API d'amitié, afin de centraliser la logique de
communication.

#### Critères d'acceptation

1. THE Friend_Service SHALL exposer des méthodes pour : envoyer une demande
   d'ami, accepter une demande, refuser une demande, supprimer un ami, récupérer
   la liste d'amis avec pagination, et récupérer le statut de relation entre
   deux joueurs.
2. IF un appel API échoue, THEN THE Friend_Service SHALL propager une erreur
   avec un message descriptif.
3. THE Friend_Service SHALL utiliser les alias de chemins (`@/`) pour les
   imports, conformément à la configuration du projet.

### Exigence 9 : Internationalisation

**User Story :** En tant que visiteur francophone ou anglophone, je veux que le
système d'amis soit traduit dans ma langue, afin de comprendre le contenu
affiché.

#### Critères d'acceptation

1. THE Friend_List SHALL utiliser les clés de traduction `next-intl` pour tous
   les libellés affichés (titres, boutons, messages vides, états des demandes).
2. THE Friend_Request_List SHALL utiliser les clés de traduction `next-intl`
   pour les boutons « Accepter », « Refuser », les messages de confirmation et
   les états de chargement.
3. THE Player_Profile SHALL utiliser les clés de traduction `next-intl` pour le
   bouton d'ajout d'ami et ses différents états.

### Exigence 10 : Accessibilité

**User Story :** En tant que visiteur, je veux que le système d'amis soit
accessible, afin d'avoir une expérience inclusive.

#### Critères d'acceptation

1. THE Friend_List SHALL utiliser des attributs ARIA appropriés pour la liste
   d'amis (`role="list"`, `aria-label`).
2. THE Friend_Request_List SHALL associer des attributs `aria-label` descriptifs
   aux boutons « Accepter » et « Refuser » incluant le nom du joueur concerné.
3. WHILE une opération est en cours, THE Friend_Request_List SHALL indiquer
   l'état de chargement via `aria-busy="true"`.
4. THE Friend_List SHALL être navigable au clavier (les liens vers les profils
   des amis sont focusables et activables via Entrée).
5. THE Player_Profile SHALL fournir un retour visuel et accessible (via
   `aria-live`) lors de l'envoi, l'acceptation ou le refus d'une demande
   d'amitié.
