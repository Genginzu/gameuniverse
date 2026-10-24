import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminSpeciesListItem } from "@/types/admin-species";

export const speciesResource = defineAdminResource<AdminSpeciesListItem>({
  path: "/api/admin/species",
  listKey: "species",
  keyOf: (species) => species.id,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    characterCount: (raw.characterCount as number) ?? 0,
    translations: (raw.translations as AdminSpeciesListItem["translations"]) ?? [],
  }),
  defaultSort: { field: "slug", order: "asc" },
  usage: true,
});
