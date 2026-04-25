"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { GameCardOverlay } from "./GameCardOverlay";

interface GameCardProps {
  game: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    coverImage?: string;
    backgroundImage?: string;
    backgroundColor?: string;
    releaseDate?: string;
    releaseYear?: number;
    genres: Array<{ name: string; id?: string }>;
    developer: string;
    publisher: string;
    metascore?: number;
  };
  locale?: string;
  priority?: boolean;
  onRemovedFromLibrary?: (gameId: string) => void;
}

export function GameCard({
  game,
  locale = "fr",
  priority = false,
  onRemovedFromLibrary,
}: GameCardProps) {
  const { user } = useAuth();
  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(game.id);
  const t = useTranslations("game");

  const formatReleaseDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date);
  };

  const getMetascoreColor = (score?: number) => {
    if (!score) return "bg-gray-500";
    if (score >= 90) return "bg-green-600";
    if (score >= 75) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleLibraryToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inLibrary) {
      const success = await removeFromLibrary();
      if (success && onRemovedFromLibrary) onRemovedFromLibrary(game.id);
    } else {
      await addToLibrary();
    }
  };

  return (
    <div className="group relative">
      <Link href={`/games/${game.slug}`}>
        <div
          className="hover:ring-neon-primary/30 relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(var(--neon-primary),0.3),0_0_40px_rgba(var(--neon-secondary),0.15)] hover:ring-1 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:bg-gray-800"
          style={{ backgroundColor: game.backgroundColor || "#f3f4f6" }}
        >
          <LazyImage
            src={game.coverImage}
            alt={game.title}
            fill
            className="rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            showSkeleton={true}
            priority={priority}
          />

          {user && (
            <button
              onClick={handleLibraryToggle}
              disabled={adding || loading}
              className="absolute top-3 left-3 z-20 cursor-pointer transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={inLibrary ? t("removeFromLibrary") : t("addToLibrary")}
            >
              {adding ? (
                <Icon icon="svg-spinners:ring-resize" className="h-6 w-6 text-white drop-shadow-lg" />
              ) : inLibrary ? (
                <Icon icon="fa:heart" className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <Icon icon="fa-regular:heart" className="h-6 w-6 text-white drop-shadow-lg" />
              )}
            </button>
          )}

          {game.metascore && game.metascore > 0 && (
            <div className="absolute top-3 right-3 z-20">
              <div
                className={`${getMetascoreColor(game.metascore)} flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_0_10px_currentColor] ring-2 ring-white/20 backdrop-blur-xs`}
              >
                {game.metascore}
              </div>
            </div>
          )}

          <GameCardOverlay
            title={game.title}
            developer={game.developer}
            publisher={game.publisher}
            genres={game.genres}
            releaseDate={game.releaseDate}
            releaseYear={game.releaseYear}
            formatReleaseDate={formatReleaseDate}
          />
        </div>
      </Link>
    </div>
  );
}
