"use client";

interface UnreadBadgeProps {
  count: number;
}

export default function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-neon-violet to-neon-cyan px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_0_8px_rgba(139,92,246,0.4),0_0_16px_rgba(6,182,212,0.2)] transition-all duration-300"
      aria-label={`${count} unread`}
      data-testid="unread-badge"
    >
      {display}
    </span>
  );
}
