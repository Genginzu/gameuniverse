"use client";

import { Icon } from "@iconify/react";

interface OverviewInfoCardProps {
  icon: string;
  label: string;
  accentColor: string;
  labelColor: string;
  children: React.ReactNode;
}

export function OverviewInfoCard({
  icon,
  label,
  accentColor,
  labelColor,
  children,
}: OverviewInfoCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon icon={icon} className="h-4 w-4" style={{ color: accentColor }} />
        <div className="text-sm" style={{ color: labelColor }}>
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}
