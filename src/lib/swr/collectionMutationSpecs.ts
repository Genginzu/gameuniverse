import { affect, type OptimisticMutationSpec } from "./optimistic";
import type {
  AddCollectionItemInput,
  CollectionDetailResponse,
  CollectionsResponse,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/types/collection";
import {
  apiAddItem,
  apiCreateCollection,
  apiDeleteCollection,
  apiRemoveItem,
  apiToggleVisibility,
  apiUpdateCollection,
  apiUpdateItemNote,
} from "@/lib/services/collectionApi";
import {
  collectionDetailKey,
  collectionKeys,
  collectionsListKey,
  collectionsOverviewKeys,
} from "./keys";
import {
  detailItemNoteUpdater,
  detailItemRemovalUpdater,
  detailVisibilityUpdater,
  listItemRemovalUpdater,
  listVisibilityUpdater,
} from "./updaters/collections";

type Spec<Args> = OptimisticMutationSpec<Args, unknown>;

export interface SlugInput<Input> {
  slug: string;
  input: Input;
}

export interface ItemTarget {
  slug: string;
  gameId: string;
}

/** Optimistic mutation specs of one player's collections; they own the collection SWR keys. */
export function collectionMutationSpecs(playerId: string, locale: string) {
  const listKey = collectionsListKey(playerId, locale);
  const detailKey = (slug: string) => collectionDetailKey(playerId, slug, locale);
  const overview = () => collectionsOverviewKeys(playerId);
  const everything = ({ slug }: { slug: string }) => collectionKeys(playerId, slug);

  const create: Spec<CreateCollectionInput> = {
    request: (input) => apiCreateCollection(playerId, input),
    related: overview,
  };

  const update: Spec<SlugInput<UpdateCollectionInput>> = {
    request: ({ slug, input }) => apiUpdateCollection(playerId, slug, input),
    related: everything,
  };

  // The deleted detail is not revalidated: it would flash a 404 before navigation.
  const remove: Spec<string> = {
    request: (slug) => apiDeleteCollection(playerId, slug),
    related: overview,
  };

  const visibility: Spec<{ slug: string; isPublic: boolean }> = {
    request: ({ slug, isPublic }) => apiToggleVisibility(playerId, slug, isPublic),
    affects: ({ slug, isPublic }) => [
      affect<CollectionsResponse>(listKey, listVisibilityUpdater(slug, isPublic)),
      affect<CollectionDetailResponse>(detailKey(slug), detailVisibilityUpdater(isPublic)),
    ],
    related: everything,
    dedupeId: ({ slug }) => `collection-visibility:${playerId}:${slug}`,
  };

  const addItem: Spec<SlugInput<AddCollectionItemInput>> = {
    request: ({ slug, input }) => apiAddItem(playerId, slug, input),
    related: everything,
  };

  const removeItem: Spec<ItemTarget> = {
    request: ({ slug, gameId }) => apiRemoveItem(playerId, slug, gameId),
    affects: ({ slug, gameId }) => [
      affect<CollectionsResponse>(listKey, listItemRemovalUpdater(slug)),
      affect<CollectionDetailResponse>(detailKey(slug), detailItemRemovalUpdater(gameId)),
    ],
    related: everything,
    dedupeId: ({ slug, gameId }) => `collection-item:${playerId}:${slug}:${gameId}`,
  };

  const updateItemNote: Spec<ItemTarget & { note: string | null }> = {
    request: ({ slug, gameId, note }) => apiUpdateItemNote(playerId, slug, gameId, note),
    affects: ({ slug, gameId, note }) => [
      affect<CollectionDetailResponse>(detailKey(slug), detailItemNoteUpdater(gameId, note)),
    ],
    related: everything,
  };

  return { create, update, remove, visibility, addItem, removeItem, updateItemNote };
}
