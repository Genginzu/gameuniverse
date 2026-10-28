import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { GamesListingSkeleton } from "@/components/games/GamesListingSkeleton";

/**
 * Streamed while the games listing page renders server-side. Rendered inside
 * the editorial shell (dark surfaces, header) so the first paint is not a
 * blank white page, and laid out like the listing so nothing jumps.
 */
export default function GamesLoading() {
  return (
    <EditorialShell>
      <GamesListingSkeleton />
    </EditorialShell>
  );
}
