/** Résumé d'une collection pour l'affichage en liste */
export interface CollectionSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  gamesCount: number;
  updatedAt: string;
  coverImages: string[]; // Jusqu'à 4 couvertures pour la carte
  coverImageUrl: string | null; // Image personnalisée (prioritaire sur coverImages)
}

/** Détail complet d'une collection */
export interface CollectionDetail {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  items: CollectionItem[];
}

/** Jeu dans une collection */
export interface CollectionItem {
  id: string;
  gameId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  genres: Array<{ name: string }>;
  note: string | null;
  position: number;
  addedAt: string;
}

/** Payload de création d'une collection */
export interface CreateCollectionInput {
  name: string;
  description?: string;
  isPublic?: boolean;
  coverImageUrl?: string;
}

/** Payload de modification d'une collection */
export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  coverImageUrl?: string | null;
}

/** Payload d'ajout d'un jeu à une collection */
export interface AddCollectionItemInput {
  gameId: string;
  note?: string;
}

/** Payload de réordonnancement */
export interface ReorderCollectionItemsInput {
  items: Array<{ gameId: string; position: number }>;
}
