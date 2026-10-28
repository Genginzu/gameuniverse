import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { UpcomingSkeleton } from "@/components/games/UpcomingSkeleton";

/**
 * Streamed while the upcoming releases page renders server-side. Rendered
 * inside the editorial shell (dark surfaces, header) so the first paint is not
 * a blank white page, and laid out like the page so nothing jumps.
 */
export default function UpcomingLoading() {
  return (
    <EditorialShell>
      <UpcomingSkeleton />
    </EditorialShell>
  );
}
