import { routing } from "@/i18n/routing";
import { defineAdminForm } from "@/lib/admin-resource/defineAdminForm";
import {
  adminFranchiseFormSchema,
  type FranchiseFormData,
} from "@/lib/validations/admin-franchise-form";

export const franchiseForm = defineAdminForm<FranchiseFormData>({
  schema: adminFranchiseFormSchema,
  path: "/api/admin/franchises",
  defaultValues: () => ({
    name: "",
    slug: "",
    translations: routing.locales.map((code) => ({ language_code: code, description: "" })),
  }),
});
