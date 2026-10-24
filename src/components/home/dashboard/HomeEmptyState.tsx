/**
 * HomeEmptyState : dashed editorial placeholder with an optional call to action.
 */

import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";

interface HomeEmptyStateProps {
  icon: string;
  message: string;
  action?: { href: string; label: string };
}

export function HomeEmptyState({ icon, message, action }: HomeEmptyStateProps) {
  return (
    <div className="border-editorial-line flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-10 text-center">
      <Icon icon={icon} className="text-editorial-muted size-8" aria-hidden />
      <p className="text-editorial-muted max-w-[48ch] text-sm leading-relaxed sm:text-base">
        {message}
      </p>
      {action && (
        <Link
          href={action.href}
          className="bg-editorial-accent/15 text-editorial-accent hover:bg-editorial-accent/25 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
        >
          {action.label}
          <Icon icon="mdi:arrow-right" className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
