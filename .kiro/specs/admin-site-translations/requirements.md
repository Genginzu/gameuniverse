# Document des Exigences

## Introduction

Ce document définit les exigences pour la migration du système de traductions du
site GameUniverse depuis des fichiers JSON statiques vers une base de données
Supabase, et la création d'une interface d'administration pour gérer les locales
du site et leurs traductions clé/valeur.

**Contexte** : Actuellement, les traductions sont stockées dans des fichiers
JSON statiques (`src/messages/fr.json`, `src/messages/en.json`) et les locales
sont hardcodées dans `src/i18n/routing.ts`. Sur Vercel (hébergement cible), le
filesystem est en lecture seule en production, ce qui empêche la modification
directe des fichiers. La migration vers Supabase permet une gestion dynamique
des traductions depuis l'interface admin.

**Prérequis** : Le spec `admin-language-management` doit être implémenté en
premier (CRUD des langues supportées par les jeux + consultation des locales).

## Glossaire

- **Système_Admin_Traductions**: L'interface d'administration pour la gestion
  des locales du site et de leurs traductions
- **Administrateur**: Utilisateur avec tous les droits de gestion
- **Locale_Site**: Langue de traduction du site (ex: fr, en), stockée dans la
  table `site_locales`
- **Traduction**: Paire clé/valeur associée à une locale (ex: clé
  `admin.games.title`, valeur `Gestion des jeux` pour la locale `fr`)
- **Namespace**: Regroupement logique de clés de traduction (ex: `admin`,
  `navigation`, `common`)
- **Fichier_Messages**: Fichier JSON statique existant (`src/messages/*.json`)
  servant de seed initial et de fallback

## Exigences

### Exigence 1: Modèle de Données pour les Traductions

**User Story:** En tant qu'administrateur, je veux que les traductions soient
stockées en base de données, afin de pouvoir les modifier sans redéployer.

#### Critères d'Acceptation

1. LE Système_Admin_Traductions DOIT créer une table `site_locales` avec les
   colonnes: code (PK, VARCHAR(10)), name (VARCHAR(100)), native_name
   (VARCHAR(100)), is_default (BOOLEAN)
2. LE Système_Admin_Traductions DOIT créer une table `site_translations` avec
   les colonnes: id (UUID, PK), locale_code (FK vers site_locales), namespace
   (VARCHAR(100)), key (VARCHAR(255)), value (TEXT)
3. LE Système_Admin_Traductions DOIT avoir une contrainte d'unicité sur
   (locale_code, namespace, key) dans la table `site_translations`
4. LE Système_Admin_Traductions DOIT seeder les tables avec les données des
   fichiers JSON existants (`src/messages/fr.json`, `src/messages/en.json`)

### Exigence 2: Chargement des Traductions depuis la BDD

**User Story:** En tant que développeur, je veux que next-intl charge les
traductions depuis Supabase, afin que les modifications admin soient reflétées
sur le site.

#### Critères d'Acceptation

1. LE Système_Admin_Traductions DOIT modifier `src/i18n.ts` pour charger les
   traductions depuis Supabase via `getRequestConfig`
2. LE Système_Admin_Traductions DOIT implémenter un cache serveur avec un TTL
   configurable (défaut: 5 minutes) pour éviter des requêtes BDD à chaque page
3. LE Système_Admin_Traductions DOIT utiliser les fichiers JSON statiques comme
   fallback si la BDD est indisponible
4. QUAND un administrateur modifie une traduction ALORS le
   Système_Admin_Traductions DOIT invalider le cache pour la locale concernée
5. LE Système_Admin_Traductions DOIT charger les locales disponibles depuis la
   table `site_locales` au lieu de la configuration hardcodée

### Exigence 3: CRUD des Locales du Site

**User Story:** En tant qu'administrateur, je veux ajouter, modifier et
supprimer des locales du site, afin de gérer les langues de traduction
disponibles.

#### Critères d'Acceptation

1. QUAND l'administrateur ajoute une nouvelle locale ALORS le
   Système_Admin_Traductions DOIT créer l'entrée dans `site_locales` et
   initialiser les traductions avec les valeurs de la locale par défaut
2. LE Système_Admin_Traductions DOIT permettre de modifier le nom et le nom
   natif d'une locale
3. LE Système_Admin_Traductions DOIT empêcher la suppression de la locale par
   défaut
4. QUAND l'administrateur supprime une locale ALORS le Système_Admin_Traductions
   DOIT supprimer toutes les traductions associées
5. LE Système_Admin_Traductions DOIT permettre de changer la locale par défaut

### Exigence 4: Éditeur de Traductions

**User Story:** En tant qu'administrateur, je veux modifier les traductions
clé/valeur directement depuis l'interface admin, afin de corriger ou adapter les
textes du site sans intervention technique.

#### Critères d'Acceptation

1. LE Système_Admin_Traductions DOIT afficher les traductions groupées par
   namespace avec un éditeur clé/valeur
2. LE Système_Admin_Traductions DOIT permettre de filtrer les traductions par
   namespace et par recherche textuelle
3. QUAND l'administrateur modifie une valeur de traduction ALORS le
   Système_Admin_Traductions DOIT sauvegarder la modification via l'API
4. LE Système_Admin_Traductions DOIT mettre en évidence les clés manquantes
   (présentes dans la locale par défaut mais absentes dans une autre locale)
5. LE Système_Admin_Traductions DOIT permettre de comparer les traductions entre
   deux locales côte à côte
6. QUAND l'administrateur ajoute une nouvelle clé de traduction ALORS le
   Système_Admin_Traductions DOIT créer l'entrée pour toutes les locales
   existantes

### Exigence 5: Contrôle d'Accès

**User Story:** En tant qu'administrateur, je veux que seuls les administrateurs
puissent modifier les traductions, afin de protéger le contenu du site.

#### Critères d'Acceptation

1. QUAND un utilisateur non authentifié tente d'accéder aux routes API des
   traductions ALORS le Système_Admin_Traductions DOIT retourner une erreur 401
2. QUAND un utilisateur sans rôle admin tente de modifier des traductions ALORS
   le Système_Admin_Traductions DOIT retourner une erreur 403
3. LE Système_Admin_Traductions DOIT utiliser le même système d'authentification
   que le reste de l'admin (`requireAdmin()`)

### Exigence 6: Performance et Fiabilité

**User Story:** En tant qu'utilisateur du site, je veux que les traductions se
chargent rapidement, afin que la navigation reste fluide.

#### Critères d'Acceptation

1. LE Système_Admin_Traductions DOIT charger les traductions en moins de 100ms
   en cache hit
2. SI la connexion à Supabase échoue ALORS le Système_Admin_Traductions DOIT
   servir les traductions depuis les fichiers JSON de fallback
3. LE Système_Admin_Traductions DOIT supporter la revalidation on-demand du
   cache via une route API dédiée
4. LE Système_Admin_Traductions DOIT logger les erreurs de chargement sans
   impacter l'expérience utilisateur
