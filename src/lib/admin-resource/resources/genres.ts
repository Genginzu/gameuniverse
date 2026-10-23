import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminGenre } from "@/types/admin-genres";

export const genresResource = defineAdminResource<AdminGenre>({
  path: "/api/admin/genres",
  listKey: "genres",
  keyOf: (genre) => genre.slug,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    gameCount: (raw.gameCount as number) ?? 0,
    translations: (raw.translations as AdminGenre["translations"]) ?? [],
  }),
  defaultSort: { field: "slug", order: "asc" },
  usage: true,
  forceDelete: true,
});
