# Requirements Document — Historique de Prix

## Introduction

Le système de prix actuel (`game_prices`) stocke uniquement le prix courant d'un
jeu par combinaison magasin/plateforme. Il n'existe aucun mécanisme pour
conserver l'évolution des prix dans le temps. Cette spécification définit un
système d'historique de prix permettant de suivre les variations de prix et de
les visualiser sous forme de graphique sur la page de détail d'un jeu.

## Glossaire

- **Game**: Un jeu vidéo dans le système
- **Store**: Un magasin en ligne (Steam, Epic Games Store, etc.)
- **Platform**: Une plateforme de jeu (PC, PlayStation, Xbox, etc.)
- **Game_Price**: Le prix courant d'un jeu sur un magasin/plateforme donné
  (table existante)
- **Price_Snapshot**: Un enregistrement horodaté du prix d'un jeu à un instant
  donné
- **Price_History_Service**: Le service applicatif responsable de la
  récupération et du formatage des données d'historique de prix
- **Price_Chart**: Le composant graphique affichant l'évolution des prix dans le
  temps

## Requirements

### Requirement 1 : Stockage de l'historique de prix

**User Story :** En tant qu'administrateur système, je veux que chaque
changement de prix soit enregistré automatiquement, afin de disposer d'un
historique complet des variations de prix.

#### Acceptance Criteria

1. WHEN le prix d'un enregistrement `game_prices` est modifié, THE System SHALL
   créer un Price_Snapshot contenant le prix précédent, la devise, le magasin,
   la plateforme et l'horodatage du changement
2. WHEN un nouvel enregistrement `game_prices` est créé, THE System SHALL créer
   un Price_Snapshot initial avec le prix de création
3. THE System SHALL stocker chaque Price_Snapshot avec une référence vers le
   jeu, le magasin et la plateforme concernés
4. THE System SHALL indexer les Price_Snapshot par jeu et par date pour
   permettre des requêtes performantes
5. IF un Price_Snapshot ne peut pas être créé lors d'un changement de prix, THEN
   THE System SHALL journaliser l'erreur sans bloquer la mise à jour du prix
   courant

### Requirement 2 : Récupération de l'historique de prix

**User Story :** En tant que développeur, je veux des fonctions de base de
données pour récupérer l'historique de prix d'un jeu, afin de pouvoir alimenter
le graphique d'évolution.

#### Acceptance Criteria

1. THE Price_History_Service SHALL fournir une fonction pour récupérer
   l'historique de prix d'un jeu sur une période donnée
2. WHEN l'historique est demandé, THE Price_History_Service SHALL accepter des
   filtres optionnels par magasin et par plateforme
3. WHEN l'historique est demandé, THE Price_History_Service SHALL retourner les
   Price_Snapshot triés par date croissante
4. WHEN l'historique est demandé sans période spécifiée, THE
   Price_History_Service SHALL retourner les données des 12 derniers mois par
   défaut
5. THE Price_History_Service SHALL fournir une fonction pour récupérer le prix
   minimum et maximum historique d'un jeu

### Requirement 3 : Visualisation graphique de l'historique

**User Story :** En tant qu'utilisateur, je veux voir un graphique de
l'évolution du prix d'un jeu dans le temps, afin de comprendre les tendances de
prix et identifier les bons moments pour acheter.

#### Acceptance Criteria

1. WHEN un utilisateur consulte la page de détail d'un jeu, THE Price_Chart
   SHALL afficher un graphique en courbe de l'évolution des prix dans le temps
2. WHEN plusieurs magasins ont un historique de prix, THE Price_Chart SHALL
   afficher une courbe distincte par magasin avec des couleurs différentes
3. WHEN l'utilisateur survole un point du graphique, THE Price_Chart SHALL
   afficher une infobulle avec le prix exact, le magasin, la plateforme et la
   date
4. THE Price_Chart SHALL afficher les axes avec des libellés lisibles pour les
   dates (axe X) et les prix formatés avec devise (axe Y)
5. WHEN aucun historique de prix n'est disponible pour un jeu, THE Price_Chart
   SHALL afficher un message indiquant l'absence de données

### Requirement 4 : Filtrage et période du graphique

**User Story :** En tant qu'utilisateur, je veux pouvoir filtrer l'historique de
prix par période et par magasin, afin de me concentrer sur les données
pertinentes.

#### Acceptance Criteria

1. THE Price_Chart SHALL proposer des sélecteurs de période prédéfinis : 1 mois,
   3 mois, 6 mois, 1 an, tout l'historique
2. WHEN l'utilisateur sélectionne une période, THE Price_Chart SHALL mettre à
   jour le graphique pour afficher uniquement les données de la période choisie
3. THE Price_Chart SHALL proposer un filtre par magasin permettant d'afficher ou
   masquer les courbes individuelles
4. WHEN l'utilisateur filtre par magasin, THE Price_Chart SHALL mettre à jour le
   graphique en conservant uniquement les courbes des magasins sélectionnés
5. THE Price_Chart SHALL conserver les préférences de filtre de l'utilisateur
   pendant la session de navigation

### Requirement 5 : Statistiques de prix

**User Story :** En tant qu'utilisateur, je veux voir des statistiques résumées
sur l'historique de prix d'un jeu, afin d'évaluer rapidement si le prix actuel
est avantageux.

#### Acceptance Criteria

1. THE Price_Chart SHALL afficher le prix minimum historique, le prix maximum
   historique et le prix moyen au-dessus du graphique
2. WHEN le prix actuel est égal au prix minimum historique, THE Price_Chart
   SHALL afficher un indicateur visuel signalant que le prix est au plus bas
3. WHEN le prix actuel est inférieur au prix moyen historique, THE Price_Chart
   SHALL afficher un indicateur signalant que le prix est en dessous de la
   moyenne

### Requirement 6 : Sécurité et permissions

**User Story :** En tant qu'administrateur système, je veux que l'accès aux
données d'historique de prix soit correctement sécurisé, afin de protéger
l'intégrité des données.

#### Acceptance Criteria

1. THE System SHALL permettre la lecture publique des données d'historique de
   prix (utilisateurs anonymes et authentifiés)
2. THE System SHALL restreindre l'écriture dans la table d'historique de prix
   aux triggers de base de données et aux utilisateurs authentifiés
3. THE System SHALL activer Row Level Security sur la table d'historique de prix
