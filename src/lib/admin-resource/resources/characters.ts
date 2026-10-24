import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminCharacter } from "@/types/admin-characters";

export const charactersResource = defineAdminResource<AdminCharacter>({
  path: "/api/admin/characters",
  listKey: "characters",
  keyOf: (character) => character.id,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    name: raw.name as string,
    role: (raw.role as string) ?? null,
    mainImage: (raw.mainImage as string) ?? null,
    primaryGame: (raw.primaryGame as string) ?? "",
    updatedAt: raw.updatedAt as string,
  }),
  defaultSort: { field: "updated_at", order: "desc" },
  localized: true,
});
