import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { SupportedLanguage } from "@/types/admin-languages";

export const languagesResource = defineAdminResource<SupportedLanguage>({
  path: "/api/admin/languages",
  listKey: "languages",
  keyOf: (language) => language.code,
  mapRow: (raw) => ({
    code: raw.code as string,
    name: raw.name as string,
    native_name: (raw.native_name as string) ?? null,
  }),
  defaultSort: { field: "code", order: "asc" },
  usage: true,
  forceDelete: true,
});
