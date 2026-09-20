import { z } from "zod";

export const createGroupSchema = z.object({
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

export const updateGroupSchema = z.object({
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

export const createGroupPostSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu est requis")
    .max(2000, "Le contenu ne doit pas dépasser 2000 caractères")
    .refine((val) => val.trim().length > 0, "Le contenu ne peut pas être vide"),
});

export const updateGroupMemberSchema = z.object({
  role: z.enum(["moderator", "member"], {
    message: "Le rôle doit être 'moderator' ou 'member'",
  }),
});

export const createGroupInvitationSchema = z
  .object({
    email: z.string().email("Adresse email invalide").optional(),
    username: z
      .string()
      .min(1, "Le pseudo est requis")
      .max(50, "Le pseudo ne doit pas dépasser 50 caractères")
      .optional(),
  })
  .refine((data) => !!data.email !== !!data.username, {
    message: "Renseignez soit un email, soit un pseudo, pas les deux",
  });

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateGroupPostInput = z.infer<typeof createGroupPostSchema>;
export type UpdateGroupMemberInput = z.infer<typeof updateGroupMemberSchema>;
export type CreateGroupInvitationInput = z.infer<typeof createGroupInvitationSchema>;
