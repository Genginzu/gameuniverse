import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { TrendingSkeleton } from "@/components/games/TrendingSkeleton";

/**
 * Streamed while the trending page renders server-side. Rendered inside the
 * editorial shell (dark surfaces, header) so the first paint is not a blank
 * white page, and laid out like the page so nothing jumps.
 */
export default function TrendingLoading() {
  return (
    <EditorialShell>
      <TrendingSkeleton />
    </EditorialShell>
  );
}
