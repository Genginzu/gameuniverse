/**
 * MetascoreBadge : top-right metascore of a GameCard, colour-coded
 * (green ≥ 75, yellow ≥ 50, red below). Revealed on hover unless `alwaysVisible`.
 */

function getMetascoreColor(score: number): string {
  if (score >= 75) return "rgb(74, 222, 128)";
  if (score >= 50) return "rgb(250, 204, 21)";
  return "rgb(248, 113, 113)";
}

export function MetascoreBadge({
  metascore,
  alwaysVisible = false,
}: {
  metascore: number | null;
  alwaysVisible?: boolean;
}) {
  if (metascore === null) return null;

  return (
    <span
      className={`editorial-card-score ${alwaysVisible ? "is-visible is-compact" : ""}`.trim()}
      style={{ color: getMetascoreColor(metascore) }}
      title={`Metascore ${metascore}`}
    >
      {metascore}
    </span>
  );
}
