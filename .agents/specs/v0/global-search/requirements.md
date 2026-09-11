# Document d'exigences — Recherche globale

## Introduction

Le système dispose actuellement d'une recherche hybride limitée aux jeux
(Supabase local + IGDB). Cette fonctionnalité étend la recherche à l'ensemble
des entités du système — jeux, personnages et joueurs — via une barre de
recherche globale avec autocomplétion, résultats groupés par catégorie et
navigation au clavier.

## Glossaire

- **Global_Search_Service** : Service backend orchestrant la recherche parallèle
  sur les trois entités (jeux, personnages, joueurs)
- **Global_Search_API** : Point d'entrée API unifié retournant les résultats
  groupés par catégorie
- **GlobalSearchBar** : Composant UI de barre de recherche globale avec dropdown
  de résultats groupés
- **Search_Result_Category** : Section de résultats dans le dropdown
  correspondant à un type d'entité (jeux, personnages, joueurs)
- **Entité** : Un jeu, un personnage ou un joueur dans le système
- **Requête** : Chaîne de caractères saisie par l'utilisateur dans la barre de
  recherche

## Exigences

### Exigence 1 : Recherche multi-entités

**User Story :** En tant qu'utilisateur, je veux rechercher simultanément des
jeux, des personnages et des joueurs depuis une seule barre de recherche, afin
de trouver rapidement ce que je cherche sans naviguer entre les pages.

#### Critères d'acceptation

1. WHEN une Requête de 2 caractères ou plus est soumise, THE Global_Search_API
   SHALL retourner des résultats provenant des trois catégories : jeux,
   personnages et joueurs
2. WHEN une Requête est soumise, THE Global_Search_Service SHALL exécuter les
   recherches sur les trois entités en parallèle et agréger les résultats
3. WHEN une recherche de jeux est effectuée, THE Global_Search_Service SHALL
   conserver l'intégration IGDB existante pour les résultats de jeux
4. WHEN une Requête contient moins de 2 caractères, THE Global_Search_API SHALL
   retourner une erreur de validation sans exécuter de recherche
5. IF une des sources de recherche échoue, THEN THE Global_Search_Service SHALL
   retourner les résultats des sources disponibles sans erreur globale

### Exigence 2 : Résultats groupés par catégorie

**User Story :** En tant qu'utilisateur, je veux voir les résultats de recherche
organisés par catégorie (jeux, personnages, joueurs), afin de distinguer
facilement les types de résultats.

#### Critères d'acceptation

1. WHEN des résultats sont affichés, THE GlobalSearchBar SHALL regrouper les
   résultats par Search_Result_Category avec un en-tête visible pour chaque
   catégorie
2. WHEN des résultats sont affichés, THE GlobalSearchBar SHALL afficher les jeux
   en premier, puis les personnages, puis les joueurs
3. WHEN une catégorie ne contient aucun résultat, THE GlobalSearchBar SHALL
   masquer cette catégorie du dropdown
4. WHEN aucune catégorie ne contient de résultat, THE GlobalSearchBar SHALL
   afficher un message « aucun résultat »
5. THE Global_Search_API SHALL limiter les résultats à un maximum configurable
   par catégorie (par défaut 5 par catégorie)

### Exigence 3 : Autocomplétion avec debounce

**User Story :** En tant qu'utilisateur, je veux voir des suggestions apparaître
au fur et à mesure de ma saisie, afin de trouver des résultats sans taper la
requête complète.

#### Critères d'acceptation

1. WHEN l'utilisateur saisit du texte dans la GlobalSearchBar, THE
   GlobalSearchBar SHALL déclencher une recherche après un délai de debounce de
   300 ms
2. WHEN une nouvelle saisie intervient avant la fin du délai de debounce, THE
   GlobalSearchBar SHALL annuler la recherche précédente et redémarrer le délai
3. WHEN les résultats de recherche sont reçus, THE GlobalSearchBar SHALL
   afficher le dropdown de résultats immédiatement
4. WHEN l'utilisateur efface le champ de recherche, THE GlobalSearchBar SHALL
   fermer le dropdown et réinitialiser les résultats

### Exigence 4 : Navigation au clavier

**User Story :** En tant qu'utilisateur, je veux naviguer dans les résultats de
recherche avec le clavier, afin d'accéder rapidement au résultat souhaité sans
utiliser la souris.

#### Critères d'acceptation

1. WHEN le dropdown est ouvert et l'utilisateur appuie sur Flèche Bas, THE
   GlobalSearchBar SHALL déplacer la sélection vers le résultat suivant, en
   traversant les catégories
2. WHEN le dropdown est ouvert et l'utilisateur appuie sur Flèche Haut, THE
   GlobalSearchBar SHALL déplacer la sélection vers le résultat précédent, en
   traversant les catégories
3. WHEN un résultat est sélectionné et l'utilisateur appuie sur Entrée, THE
   GlobalSearchBar SHALL naviguer vers la page de détail de l'Entité
   sélectionnée
4. WHEN le dropdown est ouvert et l'utilisateur appuie sur Échap, THE
   GlobalSearchBar SHALL fermer le dropdown

### Exigence 5 : Navigation vers les entités

**User Story :** En tant qu'utilisateur, je veux cliquer sur un résultat de
recherche pour accéder directement à sa page de détail, afin de consulter les
informations complètes.

#### Critères d'acceptation

1. WHEN un résultat de type jeu local est sélectionné, THE GlobalSearchBar SHALL
   naviguer vers la page `/[locale]/games/[slug]`
2. WHEN un résultat de type jeu IGDB est sélectionné, THE GlobalSearchBar SHALL
   déclencher l'import du jeu puis naviguer vers sa page
3. WHEN un résultat de type personnage est sélectionné, THE GlobalSearchBar
   SHALL naviguer vers la page `/[locale]/characters/[slug]`
4. WHEN un résultat de type joueur est sélectionné, THE GlobalSearchBar SHALL
   naviguer vers la page `/[locale]/players/[id]`
5. WHEN une navigation est déclenchée, THE GlobalSearchBar SHALL fermer le
   dropdown et vider le champ de recherche

### Exigence 6 : Affichage des résultats par type

**User Story :** En tant qu'utilisateur, je veux voir des informations
pertinentes pour chaque type de résultat, afin de distinguer les entités et
choisir le bon résultat.

#### Critères d'acceptation

1. WHEN un résultat de type jeu est affiché, THE GlobalSearchBar SHALL afficher
   le titre, l'image de couverture, le développeur, l'année de sortie et la
   source (local/IGDB)
2. WHEN un résultat de type personnage est affiché, THE GlobalSearchBar SHALL
   afficher le nom, l'image principale, le rôle et le jeu principal
3. WHEN un résultat de type joueur est affiché, THE GlobalSearchBar SHALL
   afficher le nom d'utilisateur et l'avatar

### Exigence 7 : Intégration dans le layout

**User Story :** En tant qu'utilisateur, je veux accéder à la recherche globale
depuis le header de l'application, afin de pouvoir rechercher depuis n'importe
quelle page.

#### Critères d'acceptation

1. THE GlobalSearchBar SHALL remplacer la GameSearchBar existante dans le
   DashboardHeader
2. THE GlobalSearchBar SHALL être visible sur desktop et mobile avec un
   placement adapté
3. THE GlobalSearchBar SHALL supporter l'internationalisation (fr/en) pour les
   textes de l'interface (placeholder, en-têtes de catégories, messages)

### Exigence 8 : Structure des données de réponse API

**User Story :** En tant que développeur, je veux une réponse API structurée et
typée, afin d'intégrer facilement les résultats dans le frontend.

#### Critères d'acceptation

1. THE Global_Search_API SHALL retourner les résultats dans un objet contenant
   trois tableaux distincts : `games`, `characters` et `players`
2. THE Global_Search_API SHALL inclure un compteur de résultats par catégorie
   dans la réponse
3. THE Global_Search_API SHALL sérialiser chaque Entité avec les champs
   nécessaires à l'affichage dans le dropdown
4. FOR ALL réponses valides de la Global_Search_API, sérialiser puis
   désérialiser la réponse SHALL produire un objet équivalent
