import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .refine((val) => val.trim().length > 0, "Le nom ne peut pas être vide"),
  description: z.string().max(500, "La description ne doit pas dépasser 500 caractères").optional(),
  isPublic: z.boolean().optional().default(false),
  coverImageUrl: z.string().url("URL d'image invalide").optional().or(z.literal("")),
});

export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .refine((val) => val.trim().length > 0, "Le nom ne peut pas être vide")
    .optional(),
  description: z
    .string()
    .max(500, "La description ne doit pas dépasser 500 caractères")
    .nullable()
    .optional(),
  isPublic: z.boolean().optional(),
  coverImageUrl: z.string().url("URL d'image invalide").nullable().optional().or(z.literal("")),
});

export const addCollectionItemSchema = z.object({
  gameId: z.string().uuid("ID de jeu invalide"),
  note: z.string().max(250, "La note ne doit pas dépasser 250 caractères").optional(),
});

export const reorderCollectionItemsSchema = z.object({
  items: z.array(
    z.object({
      gameId: z.string().uuid("ID de jeu invalide"),
      position: z.number().int().min(0),
    })
  ),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddCollectionItemInput = z.infer<typeof addCollectionItemSchema>;
export type ReorderCollectionItemsInput = z.infer<typeof reorderCollectionItemsSchema>;
