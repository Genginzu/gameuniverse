/**
 * Retourne la classe Tailwind de couleur en fonction du ratio note/max.
 */
export function getRatingColor(value: number | null, max: number = 20): string {
  if (value === null) return "text-muted-foreground";
  const ratio = value / max;
  if (ratio >= 0.75) return "text-green-500";
  if (ratio >= 0.5) return "text-yellow-500";
  if (ratio >= 0.25) return "text-orange-500";
  return "text-red-500";
}
