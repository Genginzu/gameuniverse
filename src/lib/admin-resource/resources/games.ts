import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminGame } from "@/types/admin-games";

export const gamesResource = defineAdminResource<AdminGame>({
  path: "/api/admin/games",
  listKey: "games",
  keyOf: (game) => game.id,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    title: raw.title as string,
    coverImage: (raw.coverImage as string) ?? null,
    releaseDate: (raw.releaseDate as string) ?? null,
    updatedAt: raw.updatedAt as string,
  }),
  defaultSort: { field: "created_at", order: "desc" },
  localized: true,
});
