import { z } from "zod";

export const adminLanguageFormSchema = z.object({
  code: z
    .string()
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(10, "Le code ne peut pas dépasser 10 caractères")
    .regex(
      /^[a-z]([a-z-]*[a-z])?$/,
      "Le code doit contenir uniquement des lettres minuscules et des tirets"
    ),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  native_name: z
    .string()
    .max(100, "Le nom natif ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),
});

export type LanguageFormData = z.infer<typeof adminLanguageFormSchema>;

export const languageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["code", "name"]).default("code"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export type LanguageQueryParams = z.infer<typeof languageQuerySchema>;
