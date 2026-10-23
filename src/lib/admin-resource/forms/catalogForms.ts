import { defineAdminForm } from "@/lib/admin-resource/defineAdminForm";
import { adminCompanyFormSchema, type CompanyFormData } from "@/lib/validations/admin-company-form";
import {
  adminLanguageFormSchema,
  type LanguageFormData,
} from "@/lib/validations/admin-language-form";

export const companyForm = defineAdminForm<CompanyFormData>({
  schema: adminCompanyFormSchema,
  path: "/api/admin/companies",
  defaultValues: () => ({
    name: "",
    slug: "",
    company_type: "both",
    website_url: "",
    logo_url: "",
    founded_year: undefined,
    headquarters: "",
    translations: [],
  }),
  editKey: (data) => data.slug,
  toPayload: (data, mode) => {
    if (mode === "create") return data;
    const { slug: _slug, ...editable } = data;
    return editable;
  },
});

export const languageForm = defineAdminForm<LanguageFormData>({
  schema: adminLanguageFormSchema,
  path: "/api/admin/languages",
  defaultValues: () => ({ code: "", name: "", native_name: "" }),
  editKey: (data) => data.code,
  toPayload: (data, mode) =>
    mode === "create"
      ? { code: data.code, name: data.name, native_name: data.native_name || "" }
      : { name: data.name, native_name: data.native_name || "" },
});
