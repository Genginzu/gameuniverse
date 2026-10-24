import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminPlatform } from "@/types/admin-platforms";

export const platformsResource = defineAdminResource<AdminPlatform>({
  path: "/api/admin/platforms",
  listKey: "platforms",
  keyOf: (platform) => platform.slug,
  mapRow: (raw) => ({
    id: raw.id as string,
    slug: raw.slug as string,
    iconUrl: (raw.iconUrl as string) || undefined,
    gameCount: (raw.gameCount as number) ?? 0,
    translations: (raw.translations as AdminPlatform["translations"]) ?? [],
  }),
  defaultSort: { field: "slug", order: "asc" },
  localized: true,
  usage: true,
  forceDelete: true,
});
