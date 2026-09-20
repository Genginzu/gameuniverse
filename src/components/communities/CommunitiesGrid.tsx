import { CommunityCard } from "./CommunityCard";
import type { CommunitySummary } from "@/types/community";

interface CommunitiesGridProps {
  communities: CommunitySummary[];
}

export function CommunitiesGrid({ communities }: CommunitiesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}
