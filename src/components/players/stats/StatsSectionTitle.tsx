interface StatsSectionTitleProps {
  children: React.ReactNode;
}

export function StatsSectionTitle({ children }: StatsSectionTitleProps) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{children}</h3>
      <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc]" />
    </div>
  );
}
