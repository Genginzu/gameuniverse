# Document de Requirements

## Introduction

La fonctionnalité "Avis" permet aux joueurs authentifiés de laisser une review
sur un jeu depuis l'onglet "Avis" de la page de détails d'un jeu. Chaque review
comprend une note sur 20, un texte de review, ainsi que des points positifs et
négatifs. La soumission d'une review ajoute automatiquement le jeu à la
bibliothèque personnelle du joueur s'il n'y est pas déjà.

## Glossaire

- **Review_System**: Le système principal qui gère la création, la validation et
  l'affichage des reviews de jeux
- **Review**: Un avis laissé par un joueur sur un jeu, comprenant une note, un
  texte, des points positifs et des points négatifs
- **Review_Form**: Le formulaire permettant à un joueur de soumettre une review
- **Rating**: La note attribuée par un joueur à un jeu, exprimée sur une échelle
  de 0 à 20
- **Positive_Point**: Un point fort du jeu identifié par le joueur dans sa
  review
- **Negative_Point**: Un point faible du jeu identifié par le joueur dans sa
  review
- **Player**: Un utilisateur authentifié de la plateforme pouvant soumettre des
  reviews
- **User_Library**: La bibliothèque personnelle d'un joueur contenant les jeux
  qu'il possède ou suit
- **Review_List**: La liste des reviews affichées dans l'onglet "Avis" d'un jeu
- **Rich_Text_Editor**: L'éditeur de texte enrichi intégré au Review_Form,
  supportant le formatage (gras, italique, listes)

## Requirements

### Requirement 1

**User Story:** En tant que joueur, je veux soumettre une review sur un jeu,
afin de partager mon avis avec la communauté.

#### Acceptance Criteria

1. WHEN un joueur authentifié accède à l'onglet "Avis" d'un jeu, THE
   Review_System SHALL afficher le Review_Form permettant de soumettre une
   review
2. WHEN un joueur remplit le Review_Form et le soumet, THE Review_System SHALL
   créer une nouvelle Review associée au joueur et au jeu
3. WHEN un joueur soumet une review valide, THE Review_System SHALL ajouter le
   jeu à la User_Library du joueur avec le statut "owned" si le jeu n'y est pas
   déjà
4. WHEN un joueur a déjà soumis une review pour un jeu, THE Review_System SHALL
   empêcher la soumission d'une seconde review pour le même jeu

### Requirement 2

**User Story:** En tant que joueur, je veux attribuer une note sur 20 à un jeu,
afin d'exprimer mon appréciation globale.

#### Acceptance Criteria

1. THE Review_Form SHALL inclure un champ Rating permettant de saisir une note
   entière entre 0 et 20
2. WHEN un joueur saisit une valeur de Rating inférieure à 0 ou supérieure à 20,
   THE Review_Form SHALL rejeter la valeur et afficher un message d'erreur
3. WHEN un joueur saisit une valeur de Rating non entière, THE Review_Form SHALL
   rejeter la valeur et afficher un message d'erreur

### Requirement 3

**User Story:** En tant que joueur, je veux rédiger un texte de review avec du
texte enrichi, afin de détailler et structurer mon avis sur le jeu.

#### Acceptance Criteria

1. THE Review_Form SHALL inclure un Rich_Text_Editor permettant de rédiger la
   review
2. THE Rich_Text_Editor SHALL supporter le formatage gras, italique, les listes
   à puces et les listes numérotées
3. WHEN un joueur soumet le Review_Form avec un contenu de review vide ou
   composé uniquement d'espaces (après suppression des balises HTML), THE
   Review_Form SHALL rejeter la soumission et afficher un message d'erreur
4. WHEN un joueur saisit un contenu de review dont le texte brut dépasse 5000
   caractères, THE Review_Form SHALL rejeter la soumission et afficher un
   message d'erreur
5. WHEN la review est affichée dans la Review_List, THE Review_System SHALL
   rendre le contenu enrichi avec le formatage préservé

### Requirement 4

**User Story:** En tant que joueur, je veux ajouter des points positifs et
négatifs, afin de structurer mon avis de manière claire.

#### Acceptance Criteria

1. THE Review_Form SHALL inclure une section permettant d'ajouter des
   Positive_Points sous forme de liste de textes courts
2. THE Review_Form SHALL inclure une section permettant d'ajouter des
   Negative_Points sous forme de liste de textes courts
3. WHEN un joueur ajoute un Positive_Point ou un Negative_Point vide ou composé
   uniquement d'espaces, THE Review_Form SHALL rejeter l'ajout
4. WHEN un joueur ajoute un Positive_Point ou un Negative_Point dépassant 200
   caractères, THE Review_Form SHALL rejeter l'ajout et afficher un message
   d'erreur
5. THE Review_Form SHALL permettre au joueur d'ajouter entre 0 et 10
   Positive_Points et entre 0 et 10 Negative_Points

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux consulter les reviews d'un jeu,
afin de me faire une opinion avant de jouer.

#### Acceptance Criteria

1. WHEN un utilisateur accède à l'onglet "Avis" d'un jeu, THE Review_List SHALL
   afficher toutes les reviews soumises pour ce jeu, triées par date de création
   décroissante
2. WHEN la Review_List affiche une review, THE Review_List SHALL montrer le nom
   du joueur, la note sur 20, le texte de la review, les points positifs et les
   points négatifs
3. WHEN aucune review n'existe pour un jeu, THE Review_List SHALL afficher un
   message invitant les joueurs à soumettre la première review
4. WHEN l'onglet "Avis" est affiché, THE Review_System SHALL afficher la note
   moyenne du jeu calculée à partir de toutes les reviews

### Requirement 6

**User Story:** En tant que joueur, je veux que la soumission de ma review soit
validée, afin de garantir la qualité des avis.

#### Acceptance Criteria

1. WHEN un joueur soumet le Review_Form, THE Review_System SHALL valider que le
   Rating est un entier entre 0 et 20, que le contenu enrichi de la review est
   non vide (après suppression des balises HTML) et que le texte brut ne dépasse
   pas 5000 caractères, et que chaque point positif et négatif est non vide et
   ne dépasse pas 200 caractères
2. IF la validation échoue, THEN THE Review_System SHALL afficher les messages
   d'erreur correspondants sans perdre les données saisies par le joueur
3. WHEN un joueur non authentifié tente d'accéder au Review_Form, THE
   Review_System SHALL afficher un message invitant le joueur à se connecter
