import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminContentDescriptor } from "@/types/admin-age-classifications";

export const descriptorsResource = defineAdminResource<AdminContentDescriptor>({
  path: ({ ratingSystemId }) =>
    `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId ?? "")}/descriptors`,
  listKey: "descriptors",
  keyOf: (descriptor) => descriptor.id,
  paginated: false,
  usage: true,
});
