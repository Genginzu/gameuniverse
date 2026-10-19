"use client";

interface UnreadBadgeProps {
  count: number;
}

export default function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className="from-palette-primary-500 via-palette-accent-600 to-palette-accent-700 ml-2 inline-flex items-center justify-center rounded-full bg-linear-to-br px-1.5 py-0.5 text-[10px] leading-none font-bold text-white shadow-lg transition-all duration-300"
      aria-label={`${count} unread`}
      data-testid="unread-badge"
    >
      {display}
    </span>
  );
}
