"use client";

import type { GameFormTabProps, AdminGenre, Company, AdminStore } from "@/types/admin-games";
import { GameFormColorFields } from "./GameFormColorFields";
import { GameColorPreview } from "./GameColorPreview";

interface DesignTabProps extends GameFormTabProps {
  genres: AdminGenre[];
  companies: Company[];
  stores: AdminStore[];
}

export function GameFormDesignTab({ form, t, genres, companies, stores }: DesignTabProps) {
  return (
    <div className="space-y-5">
      <GameFormColorFields form={form} t={t} />
      <GameColorPreview form={form} genres={genres} companies={companies} stores={stores} t={t} />
    </div>
  );
}
