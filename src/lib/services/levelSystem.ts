import type { PlayerXpStats } from "@/types/achievement";

/**
 * Fonctions pures pour le calcul XP/niveaux.
 * Aucun effet de bord ni appel DB — entièrement testable.
 */

/**
 * Calcule le niveau d'un joueur à partir de son XP total.
 * Formule : floor(0.3 × √(xpTotal)) + 1
 * Les valeurs négatives sont traitées comme 0.
 */
export function computeLevel(xpTotal: number): number {
  const safeXp = Math.max(xpTotal, 0);
  return Math.floor(0.3 * Math.sqrt(safeXp)) + 1;
}

/**
 * Calcule l'XP minimum requis pour atteindre un niveau donné.
 * Inverse de computeLevel : xp = ceil(((level - 1) / 0.3)²)
 * Pour level ≤ 1, retourne 0.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.ceil(((level - 1) / 0.3) ** 2);
}

/**
 * Calcule la progression vers le niveau suivant.
 * Retourne le niveau actuel, l'XP du niveau actuel/suivant,
 * et le pourcentage de progression clampé à [0, 99].
 */
export function computeLevelProgress(xpTotal: number): PlayerXpStats {
  const safeXp = Math.max(xpTotal, 0);
  const level = computeLevel(safeXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const range = nextLevelXp - currentLevelXp;

  const rawPercent = range > 0 ? Math.floor(((safeXp - currentLevelXp) / range) * 100) : 0;
  const progressPercent = Math.min(Math.max(rawPercent, 0), 99);

  return {
    xpTotal: safeXp,
    level,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
  };
}
