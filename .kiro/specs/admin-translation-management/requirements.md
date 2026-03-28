# Requirements Document

## Introduction

Ce document décrit les exigences pour la création d'une page d'administration
dédiée à la gestion des traductions à l'adresse `/admin/translations`. Le site
Game Universe importe ses données depuis IGDB en anglais et supporte deux
langues : français (par défaut) et anglais. Les tables de traductions existent
déjà (`game_translations`, `character_translations`, `genre_translations`,
`company_translations`), mais de nombreuses entrées n'ont pas de traduction
française. Cette fonctionnalité permet de visualiser l'état des traductions, de
traduire automatiquement l'anglais vers le français via l'API OpenAI (modèle
GPT-5.4 Nano), et de sauvegarder les résultats en base de données.

## Glossaire

- **System** : L'application Game Universe dans son ensemble
- **Translation_Dashboard** : Page d'administration `/admin/translations`
  affichant l'état global des traductions
- **Translation_Service** : Service côté serveur responsable de l'appel à l'API
  OpenAI pour la traduction automatique
- **Translation_API** : Routes API Next.js sous `/api/admin/translations/`
  gérant les requêtes de traduction
- **OpenAI_Client** : Client configuré pour appeler l'API OpenAI avec le modèle
  GPT-5.4 Nano
- **Translation_Queue** : Mécanisme côté client gérant le traitement séquentiel
  des traductions par lot
- **Translation_Stats** : Compteurs affichant le nombre d'éléments non traduits,
  partiellement traduits et entièrement traduits
- **Review_Modal** : Modale permettant à l'administrateur de relire et modifier
  une traduction avant sauvegarde
- **Entity_Type** : Type d'entité traduisible : jeu (game), personnage
  (character), genre ou entreprise (company)

## Requirements

### Requirement 1: API de détection des traductions manquantes

**User Story:** En tant qu'administrateur, je veux pouvoir récupérer la liste
des jeux et personnages dont la traduction française est manquante ou
incomplète, afin de savoir ce qui reste à traduire.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route GET
   `/api/admin/translations/missing` retournant la liste des entités avec
   traduction française manquante ou incomplète
2. WHEN la route est appelée avec le paramètre `type=games`, THE Translation_API
   SHALL retourner les jeux dont la ligne `fr` dans `game_translations` est
   absente, ou dont les champs `title` ou `description` sont NULL ou vides
3. WHEN la route est appelée avec le paramètre `type=characters`, THE
   Translation_API SHALL retourner les personnages dont la ligne `fr` dans
   `character_translations` est absente, ou dont les champs `name` ou
   `description` sont NULL ou vides
4. THE Translation_API SHALL inclure pour chaque entité retournée :
   l'identifiant, le slug, le titre/nom anglais, le titre/nom français actuel
   (si existant), et le statut de traduction (manquante, partielle, complète)
5. THE Translation_API SHALL supporter la pagination avec les paramètres `page`
   et `limit`
6. THE Translation_API SHALL supporter un paramètre `search` pour filtrer par
   titre/nom anglais ou français
7. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 2: API de statistiques de traduction

**User Story:** En tant qu'administrateur, je veux voir des compteurs résumant
l'état des traductions pour chaque type d'entité, afin d'avoir une vue
d'ensemble rapide de la couverture de traduction.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route GET
   `/api/admin/translations/stats` retournant les compteurs de traduction pour
   chaque type d'entité
2. THE Translation_API SHALL retourner pour les jeux : le nombre total, le
   nombre sans traduction française, le nombre avec traduction partielle, et le
   nombre avec traduction complète
3. THE Translation_API SHALL retourner pour les personnages : le nombre total,
   le nombre sans traduction française, le nombre avec traduction partielle, et
   le nombre avec traduction complète
4. THE Translation_API SHALL considérer une traduction de jeu comme "complète"
   lorsque les champs `title` et `description` de la ligne `fr` dans
   `game_translations` sont renseignés et non vides
5. THE Translation_API SHALL considérer une traduction de personnage comme
   "complète" lorsque les champs `name` et `description` de la ligne `fr` dans
   `character_translations` sont renseignés et non vides
6. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 3: Service de traduction automatique via OpenAI

**User Story:** En tant qu'administrateur, je veux que le système traduise
automatiquement du texte anglais vers le français via l'API OpenAI GPT-5.4 Nano,
afin de gagner du temps sur la traduction manuelle.

#### Acceptance Criteria

1. THE Translation_Service SHALL appeler l'API OpenAI avec le modèle
   `gpt-5.4-nano` pour traduire du texte anglais vers le français
2. THE Translation_Service SHALL envoyer un prompt système indiquant le contexte
   de traduction (site de jeux vidéo, terminologie gaming, ton adapté)
3. THE Translation_Service SHALL traduire tous les champs textuels d'une entité
   en un seul appel API (par exemple : title et description pour un jeu)
4. THE Translation_Service SHALL retourner un objet structuré contenant les
   champs traduits, correspondant au schéma de la table de traduction cible
5. IF l'API OpenAI retourne une erreur, THEN THE Translation_Service SHALL
   propager l'erreur avec un message descriptif incluant le code d'erreur OpenAI
6. IF l'API OpenAI ne répond pas dans un délai de 30 secondes, THEN THE
   Translation_Service SHALL annuler la requête et retourner une erreur de
   timeout
7. THE Translation_Service SHALL lire la clé API OpenAI depuis la variable
   d'environnement `OPENAI_API_KEY`

### Requirement 4: API de traduction individuelle avec sauvegarde

**User Story:** En tant qu'administrateur, je veux pouvoir déclencher la
traduction automatique d'un jeu ou d'un personnage spécifique et sauvegarder le
résultat en base de données, afin de traduire les entités une par une.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route POST
   `/api/admin/translations/translate` acceptant un corps JSON avec `entityType`
   (game ou character) et `entityId` (UUID)
2. WHEN la route est appelée, THE Translation_API SHALL récupérer le texte
   anglais de l'entité depuis la table de traduction correspondante
3. WHEN le texte anglais est récupéré, THE Translation_API SHALL appeler le
   Translation_Service pour obtenir la traduction française
4. WHEN la traduction est obtenue, THE Translation_API SHALL insérer ou mettre à
   jour (upsert) la ligne `fr` dans la table de traduction correspondante
5. THE Translation_API SHALL retourner la traduction générée dans la réponse
   avec un code HTTP 200
6. IF l'entité spécifiée n'existe pas, THEN THE Translation_API SHALL retourner
   un code HTTP 404 avec un message d'erreur descriptif
7. IF l'entité ne possède pas de texte anglais à traduire, THEN THE
   Translation_API SHALL retourner un code HTTP 400 indiquant l'absence de
   contenu source
8. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 5: API de traduction par lot

**User Story:** En tant qu'administrateur, je veux pouvoir déclencher la
traduction de plusieurs entités en une seule action, afin de traduire
efficacement un grand nombre d'éléments.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route POST
   `/api/admin/translations/translate-batch` acceptant un corps JSON avec
   `entityType` (game ou character) et `entityIds` (tableau d'UUID)
2. WHEN la route est appelée, THE Translation_API SHALL traiter chaque entité
   séquentiellement pour respecter les limites de débit de l'API OpenAI
3. THE Translation_API SHALL retourner un flux de réponse (streaming) au format
   NDJSON, envoyant un objet JSON par ligne pour chaque entité traitée avec son
   statut (succès ou erreur)
4. WHEN une entité est traduite avec succès, THE Translation_API SHALL
   sauvegarder la traduction en base de données avant de passer à l'entité
   suivante
5. IF la traduction d'une entité échoue, THEN THE Translation_API SHALL inclure
   l'erreur dans le flux et continuer avec l'entité suivante sans interrompre le
   lot
6. THE Translation_API SHALL limiter la taille du lot à 50 entités par requête
7. IF le tableau `entityIds` dépasse 50 éléments, THEN THE Translation_API SHALL
   retourner un code HTTP 400
8. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 6: Page dashboard des traductions

**User Story:** En tant qu'administrateur, je veux accéder à une page
`/admin/translations` affichant l'état des traductions avec des compteurs et la
liste des éléments à traduire, afin de piloter la traduction du site.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher des cartes de statistiques montrant
   pour chaque type d'entité (jeux, personnages) : le nombre total, le nombre
   traduit, le nombre non traduit, et le pourcentage de couverture
2. THE Translation_Dashboard SHALL afficher une barre de progression globale
   indiquant le pourcentage de traduction complète tous types confondus
3. THE Translation_Dashboard SHALL afficher un tableau filtrable par type
   d'entité (jeux ou personnages) listant les éléments avec traduction manquante
   ou incomplète
4. THE Translation_Dashboard SHALL afficher pour chaque ligne du tableau : le
   titre/nom anglais, le titre/nom français actuel (ou un indicateur
   "manquant"), et le statut (manquant, partiel, complet)
5. THE Translation_Dashboard SHALL supporter la pagination du tableau avec 20
   éléments par page
6. THE Translation_Dashboard SHALL supporter la recherche par titre/nom dans le
   tableau
7. THE Translation_Dashboard SHALL utiliser le design system glassmorphism avec
   support du dark mode et le gradient cyan → violet pour les éléments d'accent
8. THE Translation_Dashboard SHALL utiliser SWR pour le fetching des données
   avec revalidation automatique après chaque action de traduction
9. THE Translation_Dashboard SHALL fournir les traductions i18n en français et
   en anglais pour tous les textes de l'interface

### Requirement 7: Traduction individuelle depuis le dashboard

**User Story:** En tant qu'administrateur, je veux pouvoir cliquer sur un bouton
"Traduire" à côté de chaque élément du tableau pour déclencher sa traduction
automatique, afin de traduire les éléments un par un.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher un bouton "Traduire" sur chaque
   ligne du tableau dont la traduction est manquante ou incomplète
2. WHEN l'administrateur clique sur le bouton "Traduire", THE
   Translation_Dashboard SHALL appeler la route POST
   `/api/admin/translations/translate` avec l'identifiant et le type de l'entité
3. WHILE la traduction est en cours, THE Translation_Dashboard SHALL afficher un
   indicateur de chargement sur le bouton et désactiver le bouton
4. WHEN la traduction est terminée avec succès, THE Translation_Dashboard SHALL
   mettre à jour la ligne du tableau avec la nouvelle traduction et afficher une
   notification de succès
5. IF la traduction échoue, THEN THE Translation_Dashboard SHALL afficher une
   notification d'erreur avec le message retourné par l'API
6. WHEN la traduction est terminée avec succès, THE Translation_Dashboard SHALL
   revalider les statistiques via SWR

### Requirement 8: Traduction par lot depuis le dashboard

**User Story:** En tant qu'administrateur, je veux pouvoir sélectionner
plusieurs éléments ou cliquer sur "Tout traduire" pour lancer la traduction en
lot avec une indication de progression, afin de traduire efficacement un grand
nombre d'éléments.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher des cases à cocher sur chaque ligne
   du tableau pour permettre la sélection multiple
2. THE Translation_Dashboard SHALL afficher un bouton "Traduire la sélection"
   lorsque au moins un élément est sélectionné, et un bouton "Tout traduire"
   pour traduire tous les éléments non traduits du type d'entité actif
3. WHEN l'administrateur clique sur "Traduire la sélection" ou "Tout traduire",
   THE Translation_Dashboard SHALL appeler la route POST
   `/api/admin/translations/translate-batch`
4. WHILE le lot est en cours de traitement, THE Translation_Dashboard SHALL
   afficher une barre de progression indiquant le nombre d'éléments traités sur
   le total
5. WHILE le lot est en cours de traitement, THE Translation_Dashboard SHALL
   mettre à jour le tableau en temps réel au fur et à mesure que chaque
   traduction est complétée (via le flux NDJSON)
6. WHEN le lot est terminé, THE Translation_Dashboard SHALL afficher un résumé
   indiquant le nombre de traductions réussies et échouées
7. THE Translation_Dashboard SHALL permettre à l'administrateur d'annuler le
   traitement du lot en cours via un bouton "Annuler"
8. WHEN l'administrateur annule le lot, THE Translation_Dashboard SHALL
   interrompre le flux et conserver les traductions déjà sauvegardées

### Requirement 9: Relecture et modification avant sauvegarde

**User Story:** En tant qu'administrateur, je veux pouvoir relire et modifier
une traduction générée par l'IA avant de la sauvegarder, afin de corriger
d'éventuelles erreurs de traduction.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher un bouton "Traduire et relire" à
   côté du bouton "Traduire" sur chaque ligne du tableau
2. WHEN l'administrateur clique sur "Traduire et relire", THE
   Translation_Dashboard SHALL appeler l'API de traduction sans sauvegarder
   automatiquement en base de données
3. WHEN la traduction est générée, THE Review_Modal SHALL s'ouvrir et afficher
   côte à côte le texte anglais original et la traduction française générée dans
   des champs éditables
4. THE Review_Modal SHALL afficher les champs éditables correspondant au type
   d'entité : title et description pour les jeux ; name, description et
   biography pour les personnages
5. WHEN l'administrateur modifie le texte dans la Review_Modal et clique sur
   "Sauvegarder", THE System SHALL enregistrer la traduction modifiée en base de
   données via un appel API dédié
6. WHEN l'administrateur clique sur "Annuler" dans la Review_Modal, THE System
   SHALL fermer la modale sans sauvegarder
7. THE Review_Modal SHALL utiliser le design system glassmorphism avec support
   du dark mode
8. THE Review_Modal SHALL fournir les traductions i18n en français et en anglais

### Requirement 10: API de sauvegarde manuelle de traduction

**User Story:** En tant que développeur front-end, je veux disposer d'une route
API pour sauvegarder une traduction modifiée manuellement, afin de supporter le
workflow de relecture.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route PUT
   `/api/admin/translations/save` acceptant un corps JSON avec `entityType`,
   `entityId`, et `translations` (objet contenant les champs traduits)
2. WHEN la route est appelée avec des données valides, THE Translation_API SHALL
   insérer ou mettre à jour (upsert) la ligne `fr` dans la table de traduction
   correspondante
3. THE Translation_API SHALL valider les données entrantes avec un schéma Zod
   correspondant aux champs de la table de traduction cible
4. IF les données ne respectent pas le schéma de validation, THEN THE
   Translation_API SHALL retourner un code HTTP 400 avec les erreurs de
   validation
5. IF l'entité spécifiée n'existe pas, THEN THE Translation_API SHALL retourner
   un code HTTP 404
6. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 11: Configuration de la variable d'environnement OpenAI

**User Story:** En tant que développeur, je veux que la clé API OpenAI soit
configurée via une variable d'environnement documentée, afin de sécuriser
l'accès à l'API et faciliter le déploiement.

#### Acceptance Criteria

1. THE System SHALL lire la clé API OpenAI depuis la variable d'environnement
   `OPENAI_API_KEY`
2. THE System SHALL documenter la variable `OPENAI_API_KEY` dans le fichier
   `.env.example`
3. IF la variable `OPENAI_API_KEY` n'est pas définie, THEN THE
   Translation_Service SHALL retourner une erreur explicite indiquant que la clé
   API est manquante
4. THE System SHALL utiliser la variable `OPENAI_API_KEY` uniquement côté
   serveur (jamais exposée au client)

### Requirement 12: Traductions i18n de l'interface

**User Story:** En tant qu'administrateur, je veux que la page de gestion des
traductions soit disponible en français et en anglais, afin de respecter le
support multilingue du site.

#### Acceptance Criteria

1. THE System SHALL ajouter les clés i18n nécessaires dans le namespace
   `admin.translations` des fichiers `fr.json` et `en.json`
2. THE System SHALL inclure les traductions pour : les titres de page, les
   labels de statistiques, les labels de colonnes du tableau, les textes des
   boutons, les messages de succès et d'erreur, et les textes de la modale de
   relecture
3. THE Translation_Dashboard SHALL utiliser
   `useTranslations("admin.translations")` pour afficher tous les textes de
   l'interface
4. THE System SHALL ajouter les clés simultanément dans les deux fichiers de
   langue (fr.json et en.json)
