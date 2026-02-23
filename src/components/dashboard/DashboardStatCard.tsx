import { IconType } from "react-icons";

interface DashboardStatCardProps {
  icon: IconType;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
  value: string | number;
  subtitle: string;
}

export function DashboardStatCard({
  icon: Icon,
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
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColorClass}`} />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{value}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}
