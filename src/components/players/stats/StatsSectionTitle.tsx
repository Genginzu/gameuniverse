interface StatsSectionTitleProps {
  children: React.ReactNode;
}

export function StatsSectionTitle({ children }: StatsSectionTitleProps) {
  return <h3 className="editorial-stats-section-title">{children}</h3>;
}
