import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin d'entreprise (création/modification).
 * Suit le même pattern que admin-genre-form.ts.
 */

export const companyTranslationSchema = z.object({
  language_code: z.string().min(1),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const adminCompanyFormSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(/^[a-z]([a-z0-9-]*[a-z0-9])?$/, "Lettres minuscules, chiffres et tirets uniquement"),
  company_type: z.enum(["developer", "publisher", "both"]),
  website_url: z.string().url("URL invalide").optional().or(z.literal("")),
  logo_url: z.string().optional().or(z.literal("")),
  founded_year: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    },
    z
      .number()
      .int()
      .min(1800, "L'année doit être supérieure ou égale à 1800")
      .max(new Date().getFullYear(), `L'année ne peut pas dépasser ${new Date().getFullYear()}`)
      .optional()
  ),
  headquarters: z
    .string()
    .max(255, "Le siège social ne peut pas dépasser 255 caractères")
    .optional()
    .or(z.literal("")),
  translations: z.array(companyTranslationSchema).optional().default([]),
});

export type CompanyFormData = z.infer<typeof adminCompanyFormSchema>;
export type CompanyTranslationData = z.infer<typeof companyTranslationSchema>;

// Query parameters validation for admin company list
export const companyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["name", "slug"]).default("name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export type CompanyQueryParams = z.infer<typeof companyQuerySchema>;
