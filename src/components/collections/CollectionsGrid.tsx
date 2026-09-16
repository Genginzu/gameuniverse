"use client";

import type { CollectionSummary } from "@/types/collection";
import { CollectionCardEditorial } from "./CollectionCardEditorial";

interface CollectionsGridProps {
  collections: CollectionSummary[];
  /** Base path for each card link (e.g. "/collections"). */
  basePath: string;
  /** Show the public/private badge (owner view only). */
  showVisibility?: boolean;
}

/**
 * Responsive grid of collection cards, shared by the self (`/collections`)
 * and profile (`/players/[id]/collections`) collection pages.
 */
export function CollectionsGrid({ collections, basePath, showVisibility }: CollectionsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
      {collections.map((collection) => (
        <CollectionCardEditorial
          key={collection.id}
          collection={collection}
          basePath={basePath}
          showVisibility={showVisibility}
        />
      ))}
    </div>
  );
}
