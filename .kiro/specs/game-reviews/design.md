# Document de Design : Game Reviews

## Vue d'ensemble

La fonctionnalité "Avis" s'intègre dans l'onglet "Avis" existant de la page de
détails d'un jeu (`GameDetailsTabs`). Elle permet aux joueurs authentifiés de
soumettre une review comprenant une note sur 20, un texte enrichi (via Tiptap),
et des listes de points positifs/négatifs. La soumission ajoute automatiquement
le jeu à la bibliothèque du joueur via l'API existante `/api/library`.

Le contenu enrichi est stocké en HTML dans Supabase et rendu de manière
sécurisée côté client. La validation est partagée entre client et serveur via un
schéma Zod unique.

## Architecture

```mermaid
graph TD
    A[GameDetailsTabs - onglet Avis] --> B[GameReviewsTab]
    B --> C[ReviewForm]
    B --> D[ReviewList]
    C --> E[Tiptap Rich Text Editor]
    C --> F[ReviewPointsList - positifs]
    C --> G[ReviewPointsList - négatifs]
    C --> H[RatingInput]
    C -->|POST| I[/api/reviews]
    I --> J[reviewValidation.ts - Zod]
    I --> K[(Supabase - game_reviews)]
    I -->|ajout auto| L[/api/library - POST]
    D -->|GET| I
    B --> M[Note moyenne]
```

### Choix techniques

- **Éditeur de texte enrichi** : Tiptap (basé sur ProseMirror). Léger,
  extensible, compatible React. Extensions : `StarterKit` (gras, italique,
  listes à puces, listes numérotées).
- **Validation** : Schéma Zod partagé client/serveur dans
  `src/lib/validations/review.ts`.
- **Stockage** : HTML brut en colonne `content` dans la table `game_reviews`.
- **Sanitization** : Le HTML est rendu via `dangerouslySetInnerHTML` avec des
  classes Tailwind restrictives. Le contenu est sanitizé côté serveur avant
  insertion.
- **Ajout bibliothèque** : Réutilisation de l'API `POST /api/library` existante.

## Composants et Interfaces

### Nouveaux composants

```
src/components/games/reviews/
├── GameReviewsTab.tsx        # Orchestrateur : formulaire + liste + moyenne
├── ReviewForm.tsx            # Formulaire de soumission (react-hook-form + Zod)
├── ReviewList.tsx            # Liste des reviews avec pagination
├── ReviewCard.tsx            # Affichage d'une review individuelle
├── ReviewPointsList.tsx      # Composant réutilisable pour points +/-
├── RatingInput.tsx           # Saisie de la note sur 20
└── RichTextEditor.tsx        # Wrapper Tiptap
```

### Nouveau hook

```
src/hooks/useReviews.ts       # Gestion état reviews (fetch, submit, état chargement)
```

### Nouveau service

```
src/lib/services/reviewService.ts  # Appels API reviews
```

### Nouvelle validation

```
src/lib/validations/review.ts      # Schéma Zod partagé client/serveur
```

### Nouvelle route API

```
src/app/api/reviews/route.ts       # GET (liste) + POST (création)
```

### Nouveau fichier de types

```
src/types/review.ts                # Types partagés Review, ReviewFormData, etc.
```

### Interface des composants clés

```typescript
// GameReviewsTab - remplace le placeholder "coming soon"
interface GameReviewsTabProps {
  gameId: string;
  gameTitle: string;
}

// ReviewForm
interface ReviewFormProps {
  gameId: string;
  onSubmitSuccess: () => void;
}

// ReviewCard
interface ReviewCardProps {
  review: Review;
}

// ReviewPointsList
interface ReviewPointsListProps {
  points: string[];
  onChange: (points: string[]) => void;
  type: "positive" | "negative";
  maxPoints: number;
}

// RatingInput
interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  max: number;
}

// RichTextEditor
interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}
```

## Modèles de données

### Table Supabase : `game_reviews`

```sql
CREATE TABLE game_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 20),
  content TEXT NOT NULL,
  positive_points TEXT[] NOT NULL DEFAULT '{}',
  negative_points TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- RLS policies
ALTER TABLE game_reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Reviews are publicly readable"
  ON game_reviews FOR SELECT USING (true);

-- Insertion par l'auteur authentifié
CREATE POLICY "Users can insert their own reviews"
  ON game_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour par l'auteur
CREATE POLICY "Users can update their own reviews"
  ON game_reviews FOR UPDATE
  USING (auth.uid() = user_id);
```

### Types TypeScript (`src/types/review.ts`)

```typescript
export interface Review {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  content: string; // HTML enrichi
  positivePoints: string[];
  negativePoints: string[];
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerAvatar: string | null;
}

export interface ReviewFormData {
  rating: number;
  content: string; // HTML enrichi
  positivePoints: string[];
  negativePoints: string[];
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  totalCount: number;
  userHasReviewed: boolean;
}
```

### Schéma de validation Zod (`src/lib/validations/review.ts`)

```typescript
import { z } from "zod";

// Utilitaire : extraire le texte brut du HTML
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export const reviewSchema = z.object({
  rating: z
    .number()
    .int("La note doit être un nombre entier")
    .min(0, "La note doit être au minimum 0")
    .max(20, "La note doit être au maximum 20"),
  content: z
    .string()
    .min(1, "Le contenu de la review est requis")
    .refine(
      (val) => stripHtmlTags(val).length > 0,
      "Le contenu de la review ne peut pas être vide"
    )
    .refine(
      (val) => stripHtmlTags(val).length <= 5000,
      "Le contenu ne doit pas dépasser 5000 caractères"
    ),
  positivePoints: z
    .array(
      z
        .string()
        .min(1, "Un point ne peut pas être vide")
        .max(200, "Un point ne doit pas dépasser 200 caractères")
    )
    .max(10, "Maximum 10 points positifs"),
  negativePoints: z
    .array(
      z
        .string()
        .min(1, "Un point ne peut pas être vide")
        .max(200, "Un point ne doit pas dépasser 200 caractères")
    )
    .max(10, "Maximum 10 points négatifs"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
```

## Propriétés de Correctness

_Une propriété est une caractéristique ou un comportement qui doit rester vrai
pour toutes les exécutions valides d'un système — essentiellement, une
déclaration formelle de ce que le système doit faire. Les propriétés servent de
pont entre les spécifications lisibles par l'humain et les garanties de
correction vérifiables par la machine._

### Property 1 : Validation du rating — valeurs invalides rejetées

_Pour toute_ valeur numérique qui n'est pas un entier compris entre 0 et 20
(inclus), la validation du schéma `reviewSchema` doit échouer.

**Validates: Requirements 2.2, 2.3**

### Property 2 : Contenu HTML vide rejeté

_Pour toute_ chaîne HTML dont le texte brut (après `stripHtmlTags`) est vide ou
composé uniquement d'espaces, la validation du champ `content` du schéma
`reviewSchema` doit échouer.

**Validates: Requirements 3.3**

### Property 3 : Contenu HTML trop long rejeté

_Pour toute_ chaîne HTML dont le texte brut (après `stripHtmlTags`) dépasse 5000
caractères, la validation du champ `content` du schéma `reviewSchema` doit
échouer.

**Validates: Requirements 3.4**

### Property 4 : Points positifs/négatifs invalides rejetés

_Pour toute_ chaîne qui est vide, composée uniquement d'espaces, ou qui dépasse
200 caractères, la validation d'un élément dans `positivePoints` ou
`negativePoints` du schéma `reviewSchema` doit échouer.

**Validates: Requirements 4.3, 4.4**

### Property 5 : Limite du nombre de points respectée

_Pour tout_ tableau de points positifs ou négatifs contenant plus de 10
éléments, la validation du schéma `reviewSchema` doit échouer. Pour tout tableau
de 0 à 10 éléments valides, la validation doit réussir.

**Validates: Requirements 4.5**

### Property 6 : Unicité review par joueur et par jeu

_Pour tout_ joueur et tout jeu, si une review existe déjà pour cette
combinaison, la tentative de création d'une seconde review doit être rejetée par
la contrainte `UNIQUE(user_id, game_id)`.

**Validates: Requirements 1.4**

### Property 7 : Tri des reviews par date décroissante

_Pour toute_ liste de reviews retournée par l'API, les dates de création doivent
être en ordre décroissant (la plus récente en premier).

**Validates: Requirements 5.1**

### Property 8 : Calcul correct de la note moyenne

_Pour toute_ liste non vide de reviews avec des notes, la note moyenne retournée
doit être égale à la somme des notes divisée par le nombre de reviews.

**Validates: Requirements 5.4**

### Property 9 : Round-trip stripHtmlTags

_Pour tout_ texte brut sans balises HTML, l'envelopper dans des balises HTML
(`<p>texte</p>`) puis appeler `stripHtmlTags` doit retourner le texte original.

**Validates: Requirements 3.3, 3.4**

## Gestion des erreurs

| Scénario                                 | Comportement                                                   |
| ---------------------------------------- | -------------------------------------------------------------- |
| Utilisateur non authentifié              | Message invitant à se connecter, formulaire masqué             |
| Validation Zod échoue (client)           | Messages d'erreur inline, données préservées                   |
| Validation Zod échoue (serveur)          | Réponse 400 avec détails des erreurs                           |
| Review déjà existante (UNIQUE violation) | Réponse 409, message "Vous avez déjà laissé un avis"           |
| Jeu introuvable                          | Réponse 404                                                    |
| Erreur Supabase                          | Réponse 500, log serveur, message générique côté client        |
| Échec ajout bibliothèque                 | Log de l'erreur, la review est quand même créée (non bloquant) |
| Contenu HTML malveillant                 | Sanitization côté serveur avant insertion                      |

## Stratégie de tests

### Tests unitaires

- Validation Zod (`reviewSchema`) : cas valides, cas limites (0, 20, chaîne
  vide, 5000 chars, 200 chars par point, 10 points max)
- `stripHtmlTags` : balises simples, imbriquées, vides, attributs
- `RatingInput` : rendu, interaction, bornes
- `ReviewPointsList` : ajout, suppression, validation inline
- `ReviewCard` : rendu avec toutes les données, données manquantes
- Calcul de la note moyenne : liste vide, un élément, plusieurs éléments

Emplacement : `test/unit/lib/validations/review.test.ts`,
`test/unit/components/games/reviews/`

### Tests property-based

Bibliothèque : `fast-check` (déjà installée dans le projet)

Chaque test property-based doit exécuter au minimum 100 itérations.

Chaque test doit être annoté avec un commentaire référençant la propriété :
`Feature: game-reviews, Property N: description`

Emplacement : `test/unit/lib/validations/review.property.test.ts`,
`test/unit/lib/services/review.property.test.ts`

### Tests isolés

Les tests de la route API (`/api/reviews`) qui utilisent `mock.module()` pour
mocker Supabase doivent être placés dans `test/isolated/api/reviews/`.
