import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminCompany } from "@/types/admin-companies";

export const companiesResource = defineAdminResource<AdminCompany>({
  path: "/api/admin/companies",
  listKey: "companies",
  keyOf: (company) => company.slug,
  defaultSort: { field: "name", order: "asc" },
  usage: true,
  forceDelete: true,
});
