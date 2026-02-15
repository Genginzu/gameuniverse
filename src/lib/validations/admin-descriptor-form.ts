import { z } from "zod";

export const descriptorTranslationSchema = z.object({
  language_code: z.string().min(1, "Le code de langue est requis"),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
});

export const adminDescriptorFormSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(30, "Le code ne peut pas dépasser 30 caractères"),
  icon_url: z.string().url("L'URL de l'icône est invalide").optional().or(z.literal("")),
  translations: z.array(descriptorTranslationSchema).min(1, "Au moins une traduction est requise"),
});

export type DescriptorTranslationData = z.infer<typeof descriptorTranslationSchema>;
export type DescriptorFormData = z.infer<typeof adminDescriptorFormSchema>;
