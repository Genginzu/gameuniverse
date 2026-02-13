import { z } from "zod";

const playtimeField = z
  .number()
  .positive("Le temps de jeu doit être strictement positif")
  .max(50000, "Le temps de jeu ne peut pas dépasser 50 000 heures")
  .refine(
    (val) => Math.round(val * 10) / 10 === val,
    "Le temps de jeu doit être arrondi à une décimale (0.1h)"
  )
  .nullable()
  .optional();

/**
 * Validation schema for player playtime submission.
 * At least one of the three fields must be provided.
 */
export const playerPlaytimeSchema = z
  .object({
    playTimeHastily: playtimeField,
    playTimeNormally: playtimeField,
    playTimeCompletely: playtimeField,
  })
  .refine(
    (data) =>
      (data.playTimeHastily !== null && data.playTimeHastily !== undefined) ||
      (data.playTimeNormally !== null && data.playTimeNormally !== undefined) ||
      (data.playTimeCompletely !== null &&
        data.playTimeCompletely !== undefined),
    "Au moins un temps de jeu doit être renseigné"
  );

export type PlayerPlaytimeInput = z.infer<typeof playerPlaytimeSchema>;

/**
 * Legacy schema kept for backward compatibility.
 * @deprecated Use playerPlaytimeSchema instead.
 */
export const playerPlaytimeLegacySchema = z.object({
  playTimeHours: z
    .number()
    .positive("Le temps de jeu doit être strictement positif")
    .max(50000, "Le temps de jeu ne peut pas dépasser 50 000 heures")
    .refine(
      (val) => Math.round(val * 10) / 10 === val,
      "Le temps de jeu doit être arrondi à une décimale (0.1h)"
    ),
});
