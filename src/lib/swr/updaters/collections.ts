import type {
  CollectionDetail,
  CollectionDetailResponse,
  CollectionSummary,
  CollectionsResponse,
} from "@/types/collection";

type Detail = CollectionDetailResponse | undefined;
type List = CollectionsResponse | undefined;

function mapSummary(slug: string, change: (summary: CollectionSummary) => CollectionSummary) {
  return (current: List): List =>
    current && {
      ...current,
      collections: current.collections.map((summary) =>
        summary.slug === slug ? change(summary) : summary
      ),
    };
}

function mapDetail(change: (collection: CollectionDetail) => CollectionDetail) {
  return (current: Detail): Detail =>
    current && { ...current, collection: change(current.collection) };
}

export function listVisibilityUpdater(slug: string, isPublic: boolean) {
  return mapSummary(slug, (summary) => ({ ...summary, isPublic }));
}

export function listItemRemovalUpdater(slug: string) {
  return mapSummary(slug, (summary) => ({
    ...summary,
    gamesCount: Math.max(0, summary.gamesCount - 1),
  }));
}

export function detailVisibilityUpdater(isPublic: boolean) {
  return mapDetail((collection) => ({ ...collection, isPublic }));
}

export function detailItemNoteUpdater(gameId: string, note: string | null) {
  return mapDetail((collection) => ({
    ...collection,
    items: collection.items.map((item) => (item.gameId === gameId ? { ...item, note } : item)),
  }));
}

export function detailItemRemovalUpdater(gameId: string) {
  return mapDetail((collection) => ({
    ...collection,
    items: collection.items.filter((item) => item.gameId !== gameId),
  }));
}
