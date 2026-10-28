import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { FranchisesSkeleton } from "@/components/franchises/FranchisesSkeleton";

/**
 * Streamed while the franchises listing renders server-side. Rendered inside
 * the editorial shell (dark surfaces, header) so the first paint is not a
 * blank white page, and laid out like the listing so nothing jumps.
 */
export default function FranchisesLoading() {
  return (
    <EditorialShell>
      <FranchisesSkeleton />
    </EditorialShell>
  );
}
