import { z } from "zod";

/**
 * Extracts plain text from HTML by stripping all tags.
 * Used to validate content length and emptiness on the raw text.
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

const pointSchema = z
  .string()
  .min(1, "Un point ne peut pas être vide")
  .max(200, "Un point ne doit pas dépasser 200 caractères");

export const reviewSchema = z.object({
  rating: z
    .number()
    .int("La note doit être un nombre entier")
    .min(0, "La note doit être au minimum 0")
    .max(20, "La note doit être au maximum 20"),
  content: z
    .string()
    .min(1, "Le contenu de la review est requis")
    .refine((val) => stripHtmlTags(val).length > 0, "Le contenu de la review ne peut pas être vide")
    .refine(
      (val) => stripHtmlTags(val).length <= 5000,
      "Le contenu ne doit pas dépasser 5000 caractères"
    ),
  positivePoints: z.array(pointSchema).max(10, "Maximum 10 points positifs"),
  negativePoints: z.array(pointSchema).max(10, "Maximum 10 points négatifs"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
