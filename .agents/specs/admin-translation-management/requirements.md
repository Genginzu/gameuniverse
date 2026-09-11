# Requirements Document

## Introduction

Ce document décrit les exigences pour la création d'une page d'administration
dédiée à la gestion des traductions à l'adresse `/admin/translations`. Le site
Game Universe importe ses données depuis IGDB en anglais et supporte
actuellement deux langues : français (par défaut) et anglais. Les tables de
traductions existent déjà (`game_translations`, `character_translations`,
`genre_translations`, `company_translations`, `platform_translations`,
`character_role_translations`, `gender_translations`, `species_translations`,
`content_descriptor_translations`, `rating_translations`), mais de nombreuses
entrées n'ont pas de traduction dans toutes les langues supportées. Cette
fonctionnalité permet de visualiser l'état des traductions pour chaque langue,
de traduire automatiquement vers n'importe quelle langue cible via Vercel AI
Gateway (modèle GPT-5.4 Nano d'OpenAI), et de sauvegarder les résultats en base
de données. Le système est conçu pour être extensible : si de nouvelles langues
sont ajoutées au site, elles seront automatiquement prises en charge par le
dashboard de traduction.

## Glossaire

- **System** : L'application Game Universe dans son ensemble
- **Translation_Dashboard** : Page d'administration `/admin/translations`
  affichant l'état global des traductions pour toutes les langues supportées
- **Translation_Service** : Service côté serveur responsable de l'appel à Vercel
  AI Gateway pour la traduction automatique entre n'importe quelle paire de
  langues supportées
- **Translation_API** : Routes API Next.js sous `/api/admin/translations/`
  gérant les requêtes de traduction
- **Vercel_AI_Gateway** : Proxy unifié Vercel permettant d'accéder au modèle
  GPT-5.4 Nano d'OpenAI via une clé API unique, sans markup sur les tokens
- **Translation_Queue** : Mécanisme côté client gérant le traitement séquentiel
  des traductions par lot
- **Translation_Stats** : Compteurs affichant le nombre d'éléments non traduits,
  partiellement traduits et entièrement traduits, ventilés par langue
- **Review_Modal** : Modale permettant à l'administrateur de relire et modifier
  une traduction avant sauvegarde
- **Entity_Type** : Type d'entité traduisible. Les 10 types supportés sont : jeu
  (game), personnage (character), genre, entreprise (company), plateforme
  (platform), rôle de personnage (character_role), genre de personnage (gender),
  espèce (species), descripteur de contenu (content_descriptor), classification
  (rating). Chaque type correspond à une table `*_translations` en base avec ses
  propres champs traduisibles
- **Source_Language** : Langue source utilisée comme base pour la traduction.
  Déterminée automatiquement : la première langue existante parmi les
  traductions de l'entité
- **Target_Language** : Langue cible vers laquelle traduire. Peut être n'importe
  quelle langue supportée par le site (actuellement `fr` ou `en`)
- **Supported_Languages** : Liste des langues supportées par le site, définie
  dans `src/i18n/routing.ts` (actuellement `["fr", "en"]`). Le système de
  traduction s'adapte automatiquement si de nouvelles langues sont ajoutées

## Requirements

### Requirement 1: API de détection des traductions manquantes

**User Story:** En tant qu'administrateur, je veux pouvoir récupérer la liste
des entités dont la traduction est manquante ou incomplète pour une langue
donnée, afin de savoir ce qui reste à traduire.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route GET
   `/api/admin/translations/missing` retournant la liste des entités avec
   traduction manquante ou incomplète pour la langue cible spécifiée
2. THE Translation_API SHALL supporter un paramètre `type` acceptant les valeurs
   suivantes : `games`, `characters`, `genres`, `companies`, `platforms`,
   `character_roles`, `genders`, `species`, `content_descriptors`, `ratings`
3. THE Translation_API SHALL supporter un paramètre `targetLang` spécifiant la
   langue cible à vérifier (ex: `fr`, `en`). Si omis, la valeur par défaut sera
   `fr`
4. WHEN la route est appelée avec un `type` donné, THE Translation_API SHALL
   retourner les entités dont la ligne correspondant à `targetLang` dans la
   table de traduction est absente, ou dont les champs obligatoires sont NULL ou
   vides. Les champs obligatoires par type sont :
   - games : `title`, `description`
   - characters : `name`, `description`
   - genres : `name`
   - companies : `description`
   - platforms : `name`
   - character_roles : `name`
   - genders : `name`
   - species : `name`
   - content_descriptors : `name`
   - ratings : `description`
5. THE Translation_API SHALL inclure pour chaque entité retournée :
   l'identifiant, le slug ou code, le texte dans la langue source disponible
   (priorité à l'anglais si existant, sinon la première langue trouvée), le
   texte dans la langue cible (si existant), et le statut de traduction
   (manquante, partielle, complète)
6. THE Translation_API SHALL supporter la pagination avec les paramètres `page`
   et `limit`
7. THE Translation_API SHALL supporter un paramètre `search` pour filtrer par
   titre/nom dans n'importe quelle langue
8. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 2: API de statistiques de traduction

**User Story:** En tant qu'administrateur, je veux voir des compteurs résumant
l'état des traductions pour chaque type d'entité et chaque langue supportée,
afin d'avoir une vue d'ensemble rapide de la couverture de traduction.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route GET
   `/api/admin/translations/stats` retournant les compteurs de traduction pour
   chaque type d'entité et chaque langue supportée
2. THE Translation_API SHALL retourner pour chacun des 10 types d'entités et
   pour chaque langue supportée (actuellement `fr` et `en`) : le nombre total
   d'entités, le nombre sans traduction dans cette langue, le nombre avec
   traduction partielle, et le nombre avec traduction complète
3. THE Translation_API SHALL considérer une traduction comme "complète" lorsque
   tous les champs textuels obligatoires de la ligne dans la langue cible sont
   renseignés et non vides. Les champs obligatoires par type sont :
   - games : `title`, `description`
   - characters : `name`, `description`
   - genres : `name`
   - companies : `description`
   - platforms : `name`
   - character_roles : `name`
   - genders : `name`
   - species : `name`
   - content_descriptors : `name`
   - ratings : `description`
4. THE Translation_API SHALL lire dynamiquement la liste des langues supportées
   depuis la configuration du site (`src/i18n/routing.ts`) afin de s'adapter
   automatiquement si de nouvelles langues sont ajoutées
5. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 3: Service de traduction automatique via Vercel AI Gateway

**User Story:** En tant qu'administrateur, je veux que le système traduise
automatiquement du texte d'une langue source vers une langue cible via Vercel AI
Gateway avec le modèle GPT-5.4 Nano, afin de gagner du temps sur la traduction
manuelle.

#### Acceptance Criteria

1. THE Translation_Service SHALL utiliser le Vercel AI SDK (`ai` package) avec
   le provider `@ai-sdk/openai` configuré pour passer par Vercel AI Gateway afin
   d'appeler le modèle `gpt-5.4-nano`
2. THE Translation_Service SHALL accepter une langue source (`sourceLang`) et
   une langue cible (`targetLang`) en paramètres, permettant la traduction entre
   n'importe quelle paire de langues supportées (ex: EN→FR, FR→EN)
3. THE Translation_Service SHALL envoyer un prompt système indiquant le contexte
   de traduction (site de jeux vidéo, terminologie gaming, ton adapté) et
   précisant la paire de langues source/cible
4. THE Translation_Service SHALL traduire tous les champs textuels d'une entité
   en un seul appel API (par exemple : title et description pour un jeu)
5. THE Translation_Service SHALL retourner un objet structuré contenant les
   champs traduits, correspondant au schéma de la table de traduction cible
6. IF Vercel AI Gateway retourne une erreur, THEN THE Translation_Service SHALL
   propager l'erreur avec un message descriptif incluant le code d'erreur
7. IF Vercel AI Gateway ne répond pas dans un délai de 30 secondes, THEN THE
   Translation_Service SHALL annuler la requête et retourner une erreur de
   timeout
8. THE Translation_Service SHALL s'authentifier via Vercel AI Gateway en
   utilisant la variable d'environnement `VERCEL_AI_GATEWAY_API_KEY`

### Requirement 4: API de traduction individuelle avec sauvegarde

**User Story:** En tant qu'administrateur, je veux pouvoir déclencher la
traduction automatique d'une entité spécifique vers une langue cible et
sauvegarder le résultat en base de données, afin de traduire les entités une par
une.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route POST
   `/api/admin/translations/translate` acceptant un corps JSON avec `entityType`
   (l'un des 10 types d'entités supportés), `entityId` (UUID), et `targetLang`
   (code langue cible, ex: `fr` ou `en`)
2. WHEN la route est appelée, THE Translation_API SHALL déterminer
   automatiquement la langue source en cherchant la première traduction
   existante de l'entité dans une autre langue que `targetLang`
3. WHEN le texte source est récupéré, THE Translation_API SHALL appeler le
   Translation_Service pour obtenir la traduction dans la langue cible
4. WHEN la traduction est obtenue, THE Translation_API SHALL insérer ou mettre à
   jour (upsert) la ligne correspondant à `targetLang` dans la table de
   traduction correspondante
5. THE Translation_API SHALL retourner la traduction générée dans la réponse
   avec un code HTTP 200
6. IF l'entité spécifiée n'existe pas, THEN THE Translation_API SHALL retourner
   un code HTTP 404 avec un message d'erreur descriptif
7. IF l'entité ne possède aucune traduction existante dans une autre langue,
   THEN THE Translation_API SHALL retourner un code HTTP 400 indiquant l'absence
   de contenu source
8. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 5: API de traduction par lot

**User Story:** En tant qu'administrateur, je veux pouvoir déclencher la
traduction de plusieurs entités vers une langue cible en une seule action, afin
de traduire efficacement un grand nombre d'éléments.

#### Acceptance Criteria

1. THE Translation_API SHALL exposer une route POST
   `/api/admin/translations/translate-batch` acceptant un corps JSON avec
   `entityType` (l'un des 10 types d'entités supportés), `entityIds` (tableau
   d'UUID), et `targetLang` (code langue cible)
2. WHEN la route est appelée, THE Translation_API SHALL traiter chaque entité
   séquentiellement pour respecter les limites de débit de Vercel AI Gateway
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
`/admin/translations` affichant l'état des traductions pour toutes les langues
supportées avec des compteurs et la liste des éléments à traduire, afin de
piloter la traduction du site.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher un sélecteur de langue cible
   permettant de choisir la langue pour laquelle afficher l'état des traductions
   (ex: Français, English). La liste des langues est lue dynamiquement depuis la
   configuration du site
2. THE Translation_Dashboard SHALL afficher des cartes de statistiques montrant
   pour chaque type d'entité (jeux, personnages, genres, entreprises,
   plateformes, rôles, genres de personnage, espèces, descripteurs de contenu,
   classifications) : le nombre total, le nombre traduit dans la langue
   sélectionnée, le nombre non traduit, et le pourcentage de couverture
3. THE Translation_Dashboard SHALL afficher une barre de progression globale
   indiquant le pourcentage de traduction complète tous types confondus pour la
   langue sélectionnée
4. THE Translation_Dashboard SHALL afficher un tableau filtrable par type
   d'entité (les 10 types supportés) listant les éléments avec traduction
   manquante ou incomplète pour la langue sélectionnée
5. THE Translation_Dashboard SHALL afficher pour chaque ligne du tableau : le
   texte dans la langue source disponible, le texte dans la langue cible
   sélectionnée (ou un indicateur "manquant"), et le statut (manquant, partiel,
   complet)
6. THE Translation_Dashboard SHALL supporter la pagination du tableau avec 20
   éléments par page
7. THE Translation_Dashboard SHALL supporter la recherche par titre/nom dans le
   tableau
8. THE Translation_Dashboard SHALL utiliser le design system glassmorphism avec
   support du dark mode et le gradient cyan → violet pour les éléments d'accent
9. THE Translation_Dashboard SHALL utiliser SWR pour le fetching des données
   avec revalidation automatique après chaque action de traduction
10. THE Translation_Dashboard SHALL fournir les traductions i18n en français et
    en anglais pour tous les textes de l'interface

### Requirement 7: Traduction individuelle depuis le dashboard

**User Story:** En tant qu'administrateur, je veux pouvoir cliquer sur un bouton
"Traduire" à côté de chaque élément du tableau pour déclencher sa traduction
automatique vers la langue cible sélectionnée, afin de traduire les éléments un
par un.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher un bouton "Traduire" sur chaque
   ligne du tableau dont la traduction est manquante ou incomplète pour la
   langue cible sélectionnée
2. WHEN l'administrateur clique sur le bouton "Traduire", THE
   Translation_Dashboard SHALL appeler la route POST
   `/api/admin/translations/translate` avec l'identifiant, le type de l'entité,
   et la langue cible sélectionnée
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
lot vers la langue cible sélectionnée avec une indication de progression, afin
de traduire efficacement un grand nombre d'éléments.

#### Acceptance Criteria

1. THE Translation_Dashboard SHALL afficher des cases à cocher sur chaque ligne
   du tableau pour permettre la sélection multiple
2. THE Translation_Dashboard SHALL afficher un bouton "Traduire la sélection"
   lorsque au moins un élément est sélectionné, et un bouton "Tout traduire"
   pour traduire tous les éléments non traduits du type d'entité actif pour la
   langue cible sélectionnée
3. WHEN l'administrateur clique sur "Traduire la sélection" ou "Tout traduire",
   THE Translation_Dashboard SHALL appeler la route POST
   `/api/admin/translations/translate-batch` avec la langue cible sélectionnée
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
   côte à côte le texte source et la traduction générée dans la langue cible,
   dans des champs éditables
4. THE Review_Modal SHALL afficher les champs éditables correspondant au type
   d'entité. Les champs par type sont :
   - games : title, description
   - characters : name, description, biography
   - genres : name, description
   - companies : description
   - platforms : name, abbreviation
   - character_roles : name, description
   - genders : name
   - species : name
   - content_descriptors : name, description
   - ratings : description
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
   `/api/admin/translations/save` acceptant un corps JSON avec `entityType`
   (l'un des 10 types d'entités supportés), `entityId`, `targetLang` (code
   langue cible), et `translations` (objet contenant les champs traduits)
2. WHEN la route est appelée avec des données valides, THE Translation_API SHALL
   insérer ou mettre à jour (upsert) la ligne correspondant à `targetLang` dans
   la table de traduction correspondante
3. THE Translation_API SHALL valider les données entrantes avec un schéma Zod
   correspondant aux champs de la table de traduction cible
4. IF les données ne respectent pas le schéma de validation, THEN THE
   Translation_API SHALL retourner un code HTTP 400 avec les erreurs de
   validation
5. IF l'entité spécifiée n'existe pas, THEN THE Translation_API SHALL retourner
   un code HTTP 404
6. IF un utilisateur non-administrateur appelle la route, THEN THE
   Translation_API SHALL retourner un code HTTP 401

### Requirement 11: Configuration de la variable d'environnement Vercel AI Gateway

**User Story:** En tant que développeur, je veux que la clé API Vercel AI
Gateway soit configurée via une variable d'environnement documentée, afin de
sécuriser l'accès à l'API et faciliter le déploiement.

#### Acceptance Criteria

1. THE System SHALL lire la clé API Vercel AI Gateway depuis la variable
   d'environnement `VERCEL_AI_GATEWAY_API_KEY`
2. THE System SHALL documenter la variable `VERCEL_AI_GATEWAY_API_KEY` dans le
   fichier `.env.example`
3. IF la variable `VERCEL_AI_GATEWAY_API_KEY` n'est pas définie, THEN THE
   Translation_Service SHALL retourner une erreur explicite indiquant que la clé
   API est manquante
4. THE System SHALL utiliser la variable `VERCEL_AI_GATEWAY_API_KEY` uniquement
   côté serveur (jamais exposée au client)

### Requirement 12: Traductions i18n de l'interface

**User Story:** En tant qu'administrateur, je veux que la page de gestion des
traductions soit disponible en français et en anglais, afin de respecter le
support multilingue du site.

#### Acceptance Criteria

1. THE System SHALL ajouter les clés i18n nécessaires dans le namespace
   `admin.translations` des fichiers `fr.json` et `en.json`
2. THE System SHALL inclure les traductions pour : les titres de page, les
   labels de statistiques, les labels de colonnes du tableau, les textes des
   boutons, les messages de succès et d'erreur, les textes de la modale de
   relecture, et les noms des langues dans le sélecteur
3. THE Translation_Dashboard SHALL utiliser
   `useTranslations("admin.translations")` pour afficher tous les textes de
   l'interface
4. THE System SHALL ajouter les clés simultanément dans les deux fichiers de
   langue (fr.json et en.json)
