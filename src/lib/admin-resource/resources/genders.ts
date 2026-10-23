import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminGenderListItem } from "@/types/admin-genders";

export const gendersResource = defineAdminResource<AdminGenderListItem>({
  path: "/api/admin/genders",
  listKey: "genders",
  keyOf: (gender) => gender.id,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    characterCount: (raw.characterCount as number) ?? 0,
    translations: (raw.translations as AdminGenderListItem["translations"]) ?? [],
  }),
  defaultSort: { field: "slug", order: "asc" },
  usage: true,
});
