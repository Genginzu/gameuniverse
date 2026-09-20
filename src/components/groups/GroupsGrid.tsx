import { GroupCard } from "./GroupCard";
import type { GroupSummary } from "@/types/group";

interface GroupsGridProps {
  groups: GroupSummary[];
}

export function GroupsGrid({ groups }: GroupsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
