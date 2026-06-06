/**
 * Skeleton éditorial de l'onglet Settings : reprend la silhouette de
 * SettingsContent (header + sections-cards sombres) afin d'éviter le flash
 * blanc des surfaces legacy avant chargement du profil.
 */

function Block({ className }: { className?: string }) {
  return <div className={`editorial-settings-skeleton-block animate-pulse ${className ?? ""}`} />;
}

export function SettingsSkeleton() {
  return (
    <section className="editorial-settings">
      <header className="editorial-settings-header">
        <Block className="h-8 w-40" />
        <Block className="mt-3 h-5 w-64" />
      </header>

      <div className="editorial-settings-sections">
        {Array.from({ length: 4 }).map((_, i) => (
          <section key={i} className="editorial-settings-section">
            <header className="editorial-settings-section-header">
              <Block className="h-10 w-10 shrink-0 !rounded-[0.625rem]" />
              <div className="flex-1 space-y-2">
                <Block className="h-5 w-28" />
                <Block className="h-4 w-56" />
              </div>
            </header>
            <div className="editorial-settings-section-body space-y-4">
              <Block className="h-4 w-32" />
              <Block className="h-11 w-full" />
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
