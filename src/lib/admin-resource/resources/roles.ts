import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminRole } from "@/types/admin-roles";

export const rolesResource = defineAdminResource<AdminRole>({
  path: "/api/admin/roles",
  listKey: "roles",
  keyOf: (role) => role.slug,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    characterCount: (raw.characterCount as number) ?? 0,
    translations: (raw.translations as AdminRole["translations"]) ?? [],
  }),
  defaultSort: { field: "slug", order: "asc" },
  usage: true,
  forceDelete: true,
});
