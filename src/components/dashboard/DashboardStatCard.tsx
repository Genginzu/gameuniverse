import { Icon } from "@iconify/react";

interface DashboardStatCardProps {
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
  value: string | number;
  subtitle: string;
}

export function DashboardStatCard({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  value,
  subtitle,
}: DashboardStatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex items-center">
        <div className={`rounded-xl p-2.5 ${iconBgClass}`}>
          <Icon
            icon={icon}
            className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColorClass} drop-shadow-[0_0_6px_currentColor]`}
          />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="neon-text text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
        {value}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}
