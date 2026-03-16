import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Le message est requis")
    .refine((val) => val.trim().length > 0, "Le message ne peut pas être vide")
    .refine((val) => val.trim().length <= 2000, "Le message ne doit pas dépasser 2000 caractères"),
});

export const createConversationSchema = z.object({
  friendId: z.string().uuid("ID d'ami invalide"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
