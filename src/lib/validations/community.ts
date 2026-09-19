import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .refine((val) => val.trim().length > 0, "Le nom ne peut pas être vide"),
  description: z
    .string()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .optional(),
  imageUrl: z.string().url("URL d'image invalide").optional().or(z.literal("")),
  gameId: z.string().uuid("ID de jeu invalide").optional(),
  genreId: z.string().uuid("ID de genre invalide").optional(),
});

export const updateCommunitySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .refine((val) => val.trim().length > 0, "Le nom ne peut pas être vide")
    .optional(),
  description: z
    .string()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .nullable()
    .optional(),
  imageUrl: z.string().url("URL d'image invalide").nullable().optional().or(z.literal("")),
  gameId: z.string().uuid("ID de jeu invalide").nullable().optional(),
  genreId: z.string().uuid("ID de genre invalide").nullable().optional(),
});

export const createCommunityPostSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu est requis")
    .max(2000, "Le contenu ne doit pas dépasser 2000 caractères")
    .refine((val) => val.trim().length > 0, "Le contenu ne peut pas être vide"),
});

export const updateCommunityMemberSchema = z.object({
  role: z.enum(["moderator", "member"], {
    message: "Le rôle doit être 'moderator' ou 'member'",
  }),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type CreateCommunityPostInput = z.infer<typeof createCommunityPostSchema>;
export type UpdateCommunityMemberInput = z.infer<typeof updateCommunityMemberSchema>;
