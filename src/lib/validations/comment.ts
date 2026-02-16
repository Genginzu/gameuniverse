import { z } from "zod";

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Le commentaire est requis")
    .refine((val) => val.trim().length > 0, "Le commentaire ne peut pas être vide")
    .refine(
      (val) => val.trim().length <= 1000,
      "Le commentaire ne doit pas dépasser 1000 caractères"
    ),
});

export type CommentInput = z.infer<typeof commentSchema>;
