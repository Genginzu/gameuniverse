"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

export interface MetadataTag {
  key: string;
  label: string;
  href: ComponentProps<typeof Link>["href"];
}

interface MetadataTagRowProps {
  label: string;
  tags: MetadataTag[];
}

/** One labelled row of clickable tags in the "Univers & gameplay" sheet. */
export function MetadataTagRow({ label, tags }: MetadataTagRowProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-b border-editorial-line py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:gap-6">
      <dt className="shrink-0 pt-0 font-mono text-xs uppercase tracking-[0.18em] text-editorial-muted sm:w-40 sm:pt-3">
        {label}
      </dt>
      <dd className="min-w-0 flex-1">
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.key}>
              <Link
                href={tag.href}
                className="inline-flex min-h-11 items-center rounded-full border border-editorial-line bg-white/[0.04] px-4 text-sm transition-colors hover:border-editorial-accent hover:text-editorial-accent focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {tag.label}
              </Link>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
