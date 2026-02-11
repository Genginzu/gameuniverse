# Document de Spécifications

## Introduction

Ce document décrit les exigences pour l'ajout d'une section d'administration des
personnages (CRUD) dans le panneau d'administration existant. Cette
fonctionnalité suit le même modèle que la gestion des jeux déjà en place,
permettant aux administrateurs de lister, créer, modifier et supprimer des
personnages de jeux vidéo avec support multilingue (FR/EN).

## Glossaire

- **Système_Admin_Personnages** : L'ensemble des composants (pages, API, hooks,
  formulaires) permettant la gestion CRUD des personnages dans le panneau
  d'administration.
- **Personnage** : Une entité représentant un personnage de jeu vidéo, stockée
  dans la table `characters` avec ses traductions, jeux associés et médias.
- **Administrateur** : Un utilisateur authentifié ayant le rôle `admin` ou
  `contributor` dans le système.
- **Traduction** : Un ensemble de champs localisés (nom, rôle, description,
  biographie) pour un personnage dans une langue donnée (FR ou EN).
- **Jeu_Associé** : Un jeu vidéo lié à un personnage via la table de liaison
  `character_games`, avec un indicateur de jeu principal.
- **Média** : Un élément visuel (screenshot, artwork, vidéo) associé à un
  personnage via la table `character_media`.
- **Formulaire_Personnage** : Le composant de formulaire multi-onglets
  permettant la saisie et modification des données d'un personnage.
- **Schéma_Validation** : Le schéma Zod définissant les règles de validation des
  données du formulaire personnage.

## Exigences

### Exigence 1 : Lister les personnages dans l'administration

**User Story :** En tant qu'administrateur, je veux voir la liste de tous les
personnages avec pagination, recherche et tri, afin de pouvoir gérer
efficacement le catalogue de personnages.

#### Critères d'acceptation

1. QUAND un administrateur accède à la page d'administration des personnages, LE
   Système_Admin_Personnages DOIT afficher un tableau paginé des personnages
   avec nom, image, rôle, jeu principal et date de mise à jour.
2. QUAND un administrateur effectue une recherche par nom, LE
   Système_Admin_Personnages DOIT filtrer les personnages dont le nom correspond
   au terme recherché dans la locale courante.
3. QUAND un administrateur clique sur un en-tête de colonne triable, LE
   Système_Admin_Personnages DOIT trier la liste selon le champ sélectionné en
   alternant entre ordre ascendant et descendant.
4. QUAND la liste contient plus de personnages que la limite par page, LE
   Système_Admin_Personnages DOIT afficher des contrôles de pagination
   permettant la navigation entre les pages.
5. SI aucun personnage ne correspond aux critères de recherche, ALORS LE
   Système_Admin_Personnages DOIT afficher un message indiquant qu'aucun
   résultat n'a été trouvé.

### Exigence 2 : Créer un nouveau personnage

**User Story :** En tant qu'administrateur, je veux créer un nouveau personnage
via un formulaire multi-onglets, afin d'enrichir le catalogue de personnages du
site.

#### Critères d'acceptation

1. QUAND un administrateur clique sur le bouton "Nouveau personnage", LE
   Système_Admin_Personnages DOIT afficher le Formulaire_Personnage en mode
   création avec les onglets : informations générales, images, traductions, jeux
   associés et médias.
2. QUAND un administrateur soumet le formulaire avec des données valides, LE
   Système_Admin_Personnages DOIT créer le personnage en base de données avec
   ses traductions, jeux associés et médias, puis rediriger vers la liste.
3. QUAND un administrateur soumet le formulaire avec un slug déjà existant, LE
   Système_Admin_Personnages DOIT afficher un message d'erreur indiquant que le
   slug est déjà utilisé.
4. LE Schéma_Validation DOIT exiger un slug valide (lettres minuscules, chiffres
   et tirets uniquement) et au moins une traduction avec un nom non vide.
5. QUAND un administrateur soumet le formulaire avec des données invalides, LE
   Système_Admin_Personnages DOIT afficher les erreurs de validation sur les
   champs concernés et naviguer vers l'onglet contenant la première erreur.

### Exigence 3 : Modifier un personnage existant

**User Story :** En tant qu'administrateur, je veux modifier les informations
d'un personnage existant, afin de corriger ou mettre à jour ses données.

#### Critères d'acceptation

1. QUAND un administrateur clique sur un personnage dans la liste, LE
   Système_Admin_Personnages DOIT charger les données existantes du personnage
   et les afficher dans le Formulaire_Personnage en mode édition.
2. QUAND un administrateur soumet le formulaire de modification avec des données
   valides, LE Système_Admin_Personnages DOIT mettre à jour le personnage en
   base de données avec toutes ses relations (traductions, jeux, médias), puis
   rediriger vers la liste.
3. QUAND un administrateur modifie le slug vers un slug déjà utilisé par un
   autre personnage, LE Système_Admin_Personnages DOIT afficher un message
   d'erreur de doublon.
4. LE Schéma_Validation DOIT appliquer les mêmes règles en mode édition qu'en
   mode création.

### Exigence 4 : Supprimer un personnage

**User Story :** En tant qu'administrateur, je veux supprimer un personnage,
afin de retirer les personnages obsolètes ou erronés du catalogue.

#### Critères d'acceptation

1. QUAND un administrateur ayant le droit de suppression clique sur le bouton
   supprimer d'un personnage, LE Système_Admin_Personnages DOIT afficher une
   boîte de dialogue de confirmation avec le nom du personnage.
2. QUAND un administrateur confirme la suppression, LE Système_Admin_Personnages
   DOIT supprimer le personnage et toutes ses données associées (traductions,
   jeux, médias) de la base de données grâce aux cascades, puis rafraîchir la
   liste.
3. SI la suppression échoue, ALORS LE Système_Admin_Personnages DOIT afficher un
   message d'erreur et conserver le personnage dans la liste.
4. TANT QUE la suppression est en cours, LE Système_Admin_Personnages DOIT
   désactiver les boutons de la boîte de dialogue pour empêcher les actions
   multiples.

### Exigence 5 : Validation des données du formulaire

**User Story :** En tant qu'administrateur, je veux que les données saisies
soient validées avant soumission, afin de garantir l'intégrité des données en
base.

#### Critères d'acceptation

1. LE Schéma_Validation DOIT valider que le slug contient uniquement des lettres
   minuscules, des chiffres et des tirets, avec une longueur entre 1 et 255
   caractères.
2. LE Schéma_Validation DOIT valider qu'au moins une traduction possède un nom
   non vide.
3. LE Schéma_Validation DOIT valider que les URLs d'images sont des URLs valides
   ou des chaînes vides.
4. LE Schéma_Validation DOIT valider que la couleur de fond est un code
   hexadécimal valide de 7 caractères (ex: #0f172a) ou une chaîne vide.
5. POUR TOUTE donnée de formulaire valide, la sérialisation en payload API puis
   la désérialisation DOIT produire des données équivalentes aux données
   d'origine.

### Exigence 6 : Navigation et intégration dans l'administration

**User Story :** En tant qu'administrateur, je veux accéder à la gestion des
personnages depuis le menu de navigation de l'administration, afin de naviguer
facilement entre les différentes sections.

#### Critères d'acceptation

1. LE Système_Admin_Personnages DOIT ajouter un lien "Personnages" dans la barre
   latérale de l'administration, entre les liens existants.
2. QUAND un administrateur navigue vers la section personnages, LE
   Système_Admin_Personnages DOIT mettre en surbrillance le lien correspondant
   dans la barre latérale.
3. LE Système_Admin_Personnages DOIT supporter l'internationalisation (FR/EN)
   pour tous les libellés, messages d'erreur et textes de l'interface.

### Exigence 7 : API d'administration des personnages

**User Story :** En tant que développeur, je veux des routes API sécurisées pour
le CRUD des personnages, afin que le frontend puisse communiquer avec la base de
données de manière fiable.

#### Critères d'acceptation

1. QUAND une requête GET est reçue sur l'endpoint de liste, LE
   Système_Admin_Personnages DOIT retourner les personnages paginés avec les
   traductions dans la locale demandée.
2. QUAND une requête POST est reçue avec des données valides, LE
   Système_Admin_Personnages DOIT créer le personnage avec toutes ses relations
   et retourner le personnage créé.
3. QUAND une requête PUT est reçue avec des données valides et un ID existant,
   LE Système_Admin_Personnages DOIT mettre à jour le personnage et ses
   relations, puis retourner le personnage mis à jour.
4. QUAND une requête DELETE est reçue avec un ID existant, LE
   Système_Admin_Personnages DOIT supprimer le personnage et retourner un statut
   de succès.
5. SI une requête est reçue sans authentification admin valide, ALORS LE
   Système_Admin_Personnages DOIT retourner une erreur 403.
6. SI une requête de création ou modification contient des données invalides,
   ALORS LE Système_Admin_Personnages DOIT retourner une erreur 400 avec les
   détails de validation.
