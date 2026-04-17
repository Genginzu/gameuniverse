"use client";

interface UnreadBadgeProps {
  count: number;
}

export default function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className="ml-2 inline-flex items-center justify-center rounded-full bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-lg transition-all duration-300"
      aria-label={`${count} unread`}
      data-testid="unread-badge"
    >
      {display}
    </span>
  );
}
