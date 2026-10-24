import { defineAdminForm } from "@/lib/admin-resource/defineAdminForm";
import {
  adminRatingSystemFormSchema,
  type RatingSystemFormData,
} from "@/lib/validations/admin-rating-system-form";
import { adminRatingFormSchema, type RatingFormData } from "@/lib/validations/admin-rating-form";
import {
  adminDescriptorFormSchema,
  type DescriptorFormData,
} from "@/lib/validations/admin-descriptor-form";

const systemPath = (pathParams: Record<string, string>) =>
  `/api/admin/age-classifications/${encodeURIComponent(pathParams.ratingSystemId ?? "")}`;

export const ratingSystemForm = defineAdminForm<RatingSystemFormData>({
  schema: adminRatingSystemFormSchema,
  path: "/api/admin/age-classifications",
  defaultValues: () => ({
    code: "",
    name: "",
    description: "",
    country_codes: [],
    website_url: "",
  }),
  toPayload: (data) => ({
    code: data.code,
    name: data.name,
    description: data.description || "",
    country_codes: data.country_codes || [],
    website_url: data.website_url || "",
  }),
});

export const ratingForm = defineAdminForm<RatingFormData>({
  schema: adminRatingFormSchema,
  path: (pathParams) => `${systemPath(pathParams)}/ratings`,
  defaultValues: () => ({
    code: "",
    display_name: "",
    minimum_age: 0,
    color_hex: "",
    icon_url: "",
    sort_order: 0,
    translations: [],
  }),
  toPayload: (data) => ({
    code: data.code,
    display_name: data.display_name,
    minimum_age: data.minimum_age,
    color_hex: data.color_hex || "",
    icon_url: data.icon_url || "",
    sort_order: data.sort_order,
    translations: data.translations ?? [],
  }),
});

export const descriptorForm = defineAdminForm<DescriptorFormData>({
  schema: adminDescriptorFormSchema,
  path: (pathParams) => `${systemPath(pathParams)}/descriptors`,
  defaultValues: () => ({
    code: "",
    icon_url: "",
    translations: [{ language_code: "", name: "", description: "" }],
  }),
  toPayload: (data) => ({
    code: data.code,
    icon_url: data.icon_url || "",
    translations: data.translations.map((translation) => ({
      language_code: translation.language_code,
      name: translation.name,
      description: translation.description || "",
    })),
  }),
});
