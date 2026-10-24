import { routing } from "@/i18n/routing";
import { defineAdminForm } from "@/lib/admin-resource/defineAdminForm";
import { adminGenreFormSchema, type GenreFormData } from "@/lib/validations/admin-genre-form";
import { adminRoleFormSchema, type RoleFormData } from "@/lib/validations/admin-role-form";
import { adminGenderFormSchema, type GenderFormData } from "@/lib/validations/admin-gender-form";
import { adminSpeciesFormSchema, type SpeciesFormData } from "@/lib/validations/admin-species-form";

const emptyLocaleTranslations = () =>
  routing.locales.map((code) => ({ language_code: code, name: "" }));

export const genreForm = defineAdminForm<GenreFormData>({
  schema: adminGenreFormSchema,
  path: "/api/admin/genres",
  defaultValues: () => ({ slug: "", translations: [] }),
  editKey: (data) => data.slug,
  toPayload: (data, mode) =>
    mode === "create"
      ? { slug: data.slug, translations: data.translations }
      : { translations: data.translations },
});

export const roleForm = defineAdminForm<RoleFormData>({
  schema: adminRoleFormSchema,
  path: "/api/admin/roles",
  defaultValues: () => ({ slug: "", translations: [] }),
  editKey: (data) => data.slug,
  toPayload: (data, mode) =>
    mode === "create"
      ? { slug: data.slug, translations: data.translations }
      : { translations: data.translations },
});

export const genderForm = defineAdminForm<GenderFormData>({
  schema: adminGenderFormSchema,
  path: "/api/admin/genders",
  defaultValues: () => ({ slug: "", translations: emptyLocaleTranslations() }),
  toPayload: (data) => ({ slug: data.slug, translations: data.translations }),
});

export const speciesForm = defineAdminForm<SpeciesFormData>({
  schema: adminSpeciesFormSchema,
  path: "/api/admin/species",
  defaultValues: () => ({ slug: "", translations: emptyLocaleTranslations() }),
  toPayload: (data) => ({ slug: data.slug, translations: data.translations }),
});
