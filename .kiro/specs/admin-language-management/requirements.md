# Document des Exigences

## Introduction

Ce document définit les exigences pour la création d'une interface
d'administration unifiée de gestion des langues dans l'application GameUniverse.
Cette interface sera accessible uniquement aux administrateurs et regroupera
deux aspects de la gestion des langues au même endroit :

1. **Langues supportées par les jeux** (table `supported_languages`) : les
   langues dans lesquelles un jeu peut être disponible (audio, sous-titres,
   interface). CRUD complet via Supabase.
2. **Locales du site** : les langues de traduction de l'interface web (fr, en),
   actuellement hardcodées dans `src/i18n/routing.ts` et
   `src/app/api/admin/reference-data/route.ts`. Consultation et configuration
   depuis l'interface admin.

Le projet dispose déjà d'une table `supported_languages` pré-seedée avec ~40
langues et d'une fonction utilitaire `getAvailableSupportedLanguages()` dans
`src/lib/admin-utils.ts`.

## Glossaire

- **Système_Admin_Langues**: L'interface d'administration unifiée pour la
  gestion de toutes les langues (jeux et site)
- **Administrateur**: Utilisateur avec tous les droits de gestion (création,
  modification, suppression)
- **Langue_Supportée**: Entité représentant une langue disponible pour les jeux
  (audio, sous-titres, interface) dans la table `supported_languages` (code,
  name, native_name)
- **Locale_Site**: Langue de traduction de l'interface du site web (fr, en),
  définie dans `src/i18n/routing.ts`. Chaque locale a un fichier de messages
  JSON associé dans `src/messages/`
- **Tableau_Langues**: Composant affichant la liste paginée des langues
  supportées par les jeux
- **Formulaire_Langue**: Composant permettant la création ou modification d'une
  langue supportée
- **Code_Langue**: Identifiant unique d'une langue supportée (ex: "fr", "en",
  "ja"), clé primaire VARCHAR(10)

## Exigences

### Exigence 1: Contrôle d'Accès

**User Story:** En tant qu'administrateur, je veux que seuls les administrateurs
puissent gérer les langues, afin de protéger les données de référence.

#### Critères d'Acceptation

1. QUAND un utilisateur non authentifié tente d'accéder aux routes API des
   langues ALORS le Système_Admin_Langues DOIT retourner une erreur 401
2. QUAND un utilisateur sans rôle admin tente d'accéder aux routes API des
   langues ALORS le Système_Admin_Langues DOIT retourner une erreur 403
3. QUAND un administrateur accède aux routes API des langues ALORS le
   Système_Admin_Langues DOIT autoriser l'opération

### Exigence 2: Navigation et Intégration dans l'Admin

**User Story:** En tant qu'administrateur, je veux accéder à la gestion des
langues depuis le menu admin, afin de naviguer facilement entre les sections.

#### Critères d'Acceptation

1. LE Système_Admin_Langues DOIT ajouter un lien "Langues" dans le composant
   AdminSidebar
2. LE Système_Admin_Langues DOIT être accessible via la route
   `/[locale]/admin/languages`
3. QUAND l'administrateur clique sur "Langues" dans le menu ALORS le
   Système_Admin_Langues DOIT afficher la page de gestion des langues avec deux
   sections : langues des jeux et locales du site
4. LE Système_Admin_Langues DOIT supporter l'internationalisation (français et
   anglais)

### Exigence 3: Liste des Langues Supportées par les Jeux (Read)

**User Story:** En tant qu'administrateur, je veux voir la liste de toutes les
langues supportées par les jeux, afin de pouvoir les gérer.

#### Critères d'Acceptation

1. QUAND l'administrateur accède à la page des langues ALORS le
   Système_Admin_Langues DOIT afficher une liste paginée des langues supportées
2. POUR CHAQUE langue dans la liste, le Système_Admin_Langues DOIT afficher le
   code, le nom anglais et le nom natif
3. LE Système_Admin_Langues DOIT permettre de rechercher des langues par code ou
   par nom
4. LE Système_Admin_Langues DOIT permettre de trier les langues par code ou par
   nom
5. LE Système_Admin_Langues DOIT afficher le nombre total de langues et la
   pagination

### Exigence 4: Création d'une Langue Supportée (Create)

**User Story:** En tant qu'administrateur, je veux ajouter une nouvelle langue
supportée, afin d'enrichir les options de langues disponibles pour les jeux.

#### Critères d'Acceptation

1. QUAND l'administrateur clique sur "Nouvelle langue" ALORS le
   Système_Admin_Langues DOIT afficher le Formulaire_Langue vide
2. LE Formulaire_Langue DOIT contenir les champs: code (obligatoire, max 10
   caractères), nom anglais (obligatoire, max 100 caractères), nom natif
   (optionnel, max 100 caractères)
3. QUAND l'administrateur soumet un formulaire valide ALORS le
   Système_Admin_Langues DOIT créer la langue via l'API et afficher un message
   de succès
4. SI le Code_Langue existe déjà ALORS le Système_Admin_Langues DOIT afficher un
   message d'erreur indiquant que le code est déjà utilisé
5. QUAND l'administrateur soumet un formulaire invalide ALORS le
   Système_Admin_Langues DOIT afficher les erreurs de validation sans soumettre
6. LE Système_Admin_Langues DOIT valider que le Code_Langue contient uniquement
   des lettres minuscules et des tirets, avec une longueur entre 2 et 10
   caractères

### Exigence 5: Modification d'une Langue Supportée (Update)

**User Story:** En tant qu'administrateur, je veux modifier une langue
existante, afin de corriger ou mettre à jour ses informations.

#### Critères d'Acceptation

1. QUAND l'administrateur clique sur "Modifier" pour une langue ALORS le
   Système_Admin_Langues DOIT afficher le Formulaire_Langue pré-rempli avec les
   données existantes
2. LE Système_Admin_Langues DOIT permettre de modifier le nom anglais et le nom
   natif
3. LE Système_Admin_Langues DOIT empêcher la modification du Code_Langue (clé
   primaire)
4. QUAND l'administrateur soumet les modifications ALORS le
   Système_Admin_Langues DOIT mettre à jour la langue via l'API et afficher un
   message de succès
5. SI une erreur survient lors de la mise à jour ALORS le Système_Admin_Langues
   DOIT afficher un message d'erreur et conserver les données du formulaire

### Exigence 6: Suppression d'une Langue Supportée (Delete)

**User Story:** En tant qu'administrateur, je veux supprimer une langue, afin de
retirer des langues obsolètes ou erronées.

#### Critères d'Acceptation

1. QUAND un administrateur clique sur "Supprimer" ALORS le Système_Admin_Langues
   DOIT afficher une modale de confirmation
2. LA modale de confirmation DOIT afficher le nom de la langue et avertir que
   l'action est irréversible
3. QUAND l'administrateur confirme la suppression ALORS le Système_Admin_Langues
   DOIT supprimer la langue via l'API et actualiser la liste
4. SI la langue est utilisée par des jeux ALORS le Système_Admin_Langues DOIT
   afficher un avertissement indiquant le nombre de jeux concernés et demander
   une confirmation supplémentaire
5. SI une erreur survient lors de la suppression ALORS le Système_Admin_Langues
   DOIT afficher un message d'erreur

### Exigence 7: Consultation des Locales du Site

**User Story:** En tant qu'administrateur, je veux voir les locales configurées
pour le site, afin de savoir quelles langues de traduction sont disponibles.

#### Critères d'Acceptation

1. LE Système_Admin_Langues DOIT afficher une section dédiée aux locales du site
   sur la page de gestion des langues
2. POUR CHAQUE locale configurée, le Système_Admin_Langues DOIT afficher le
   code, le nom, et indiquer si c'est la locale par défaut
3. LE Système_Admin_Langues DOIT indiquer clairement que les locales du site
   sont actuellement gérées via la configuration du code source
   (`src/i18n/routing.ts` et fichiers `src/messages/*.json`)
4. LE Système_Admin_Langues DOIT afficher le nombre de clés de traduction
   présentes pour chaque locale

### Exigence 8: Validation des Données

**User Story:** En tant qu'administrateur, je veux que les données saisies
soient validées, afin de garantir l'intégrité des données de langues.

#### Critères d'Acceptation

1. LE Système_Admin_Langues DOIT valider le Code_Langue côté client avec Zod
   avant soumission
2. LE Système_Admin_Langues DOIT valider le Code_Langue côté serveur avant
   insertion en base
3. QUAND un Code_Langue invalide est soumis (caractères spéciaux, trop long,
   vide) ALORS le Système_Admin_Langues DOIT rejeter la soumission avec un
   message d'erreur descriptif
4. QUAND un nom de langue dépasse 100 caractères ALORS le Système_Admin_Langues
   DOIT rejeter la soumission avec un message d'erreur

### Exigence 9: Feedback Utilisateur et Gestion des Erreurs

**User Story:** En tant qu'administrateur, je veux recevoir des retours clairs
sur mes actions, afin de comprendre le résultat de mes opérations.

#### Critères d'Acceptation

1. QUAND une opération réussit (création, modification, suppression) ALORS le
   Système_Admin_Langues DOIT afficher une notification de succès
2. QUAND une erreur survient ALORS le Système_Admin_Langues DOIT afficher une
   notification d'erreur avec un message explicatif
3. PENDANT le chargement des données ALORS le Système_Admin_Langues DOIT
   afficher un indicateur de chargement
4. SI la connexion à l'API échoue ALORS le Système_Admin_Langues DOIT afficher
   un message d'erreur et proposer de réessayer
