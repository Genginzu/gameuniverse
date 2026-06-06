/**
 * Skeleton éditorial de l'onglet Settings : reprend la silhouette de
 * SettingsContent (header + sections-cards sombres) afin d'éviter le flash
 * blanc des surfaces legacy avant chargement du profil.
 */

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/8 ${className ?? ""}`} />;
}

export function SettingsSkeleton() {
  return (
    <section className="w-full px-4 pt-6 pb-16 md:px-6 md:pt-8 md:pb-20">
      <header className="border-editorial-line mb-10 border-b pb-8">
        <Block className="h-8 w-40" />
        <Block className="mt-3 h-5 w-64" />
      </header>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <section
            key={i}
            className="border-editorial-line bg-editorial-3 overflow-hidden rounded-2xl border"
          >
            <header className="flex items-start gap-4 px-6 pt-6 md:px-8 md:pt-7">
              <Block className="h-10 w-10 shrink-0 !rounded-[0.625rem]" />
              <div className="flex-1 space-y-2">
                <Block className="h-5 w-28" />
                <Block className="h-4 w-56" />
              </div>
            </header>
            <div className="space-y-4 p-6 md:px-8 md:pt-7 md:pb-8">
              <Block className="h-4 w-32" />
              <Block className="h-11 w-full" />
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
