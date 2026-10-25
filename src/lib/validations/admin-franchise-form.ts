import { z } from "zod";

/** Admin edition of a franchise: name, slug and a free description per language. */

export const franchiseTranslationSchema = z.object({
  language_code: z.string().min(1),
  description: z.string().max(5000).optional().default(""),
});

export const adminFranchiseFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(255),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(120, "Le slug ne peut pas dépasser 120 caractères")
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Lettres minuscules, chiffres et tirets uniquement"),
  translations: z.array(franchiseTranslationSchema).default([]),
});

export type FranchiseFormData = z.infer<typeof adminFranchiseFormSchema>;

export const franchiseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["name", "slug"]).default("name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});
