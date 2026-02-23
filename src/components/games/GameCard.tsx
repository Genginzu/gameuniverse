"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FaHeart, FaRegHeart } from "react-icons/fa";

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
  priority?: boolean; // Pour optimiser le chargement des premières cartes
  onRemovedFromLibrary?: (gameId: string) => void; // Callback when game is removed from library
}

export function GameCard({
  game,
  locale = "fr",
  priority = false,
  onRemovedFromLibrary,
}: GameCardProps) {
  const { user } = useAuth();
  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(
    game.id
  );
  const t = useTranslations("game");

  const formatReleaseDate = (dateString?: string) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
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
      if (success && onRemovedFromLibrary) {
        onRemovedFromLibrary(game.id);
      }
    } else {
      await addToLibrary();
    }
  };

  return (
    <div className="group relative">
      <Link href={`/${locale}/games/${game.slug}`}>
        {/* Cover Image with Overlay */}
        <div
          className="hover:ring-neon-violet/30 relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(var(--neon-violet),0.3),0_0_40px_rgba(var(--neon-cyan),0.15)] hover:ring-1 motion-reduce:transition-none motion-reduce:hover:scale-100"
          style={{
            backgroundColor: game.backgroundColor || "#f3f4f6", // Fallback to gray-100
          }}
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

          {/* Heart icon for library - top left */}
          {user && (
            <button
              onClick={handleLibraryToggle}
              disabled={adding || loading}
              className="absolute left-3 top-3 z-20 transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={inLibrary ? t("removeFromLibrary") : t("addToLibrary")}
            >
              {inLibrary ? (
                <FaHeart className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <FaRegHeart className="h-6 w-6 text-white drop-shadow-lg" />
              )}
            </button>
          )}

          {/* Metascore badge - always visible */}
          {game.metascore && (
            <div className="absolute right-3 top-3 z-20">
              <div
                className={`${getMetascoreColor(
                  game.metascore
                )} flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_0_10px_currentColor] ring-2 ring-white/20 backdrop-blur-sm`}
              >
                {game.metascore}
              </div>
            </div>
          )}

          {/* Hover Overlay - appears on the cover */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="p-4">
              {/* Title */}
              <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{game.title}</h3>

              {/* Developer & Publisher */}
              <div className="mb-3 space-y-1 text-xs">
                <div className="flex items-center text-gray-300">
                  <span className="font-medium text-gray-400">{t("developerShort")}:</span>
                  <span className="ml-1 font-medium text-white">{game.developer}</span>
                </div>
                {game.publisher !== game.developer && (
                  <div className="flex items-center text-gray-300">
                    <span className="font-medium text-gray-400">{t("publisherShort")}:</span>
                    <span className="ml-1 font-medium text-white">{game.publisher}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {game.genres.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {game.genres.slice(0, 2).map((genre, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                  {game.genres.length > 2 && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-white/30 bg-white/10 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      +{game.genres.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Release Date */}
              {game.releaseDate && (
                <div className="flex items-center text-xs text-gray-300">
                  <svg
                    className="mr-1 h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {game.releaseYear || formatReleaseDate(game.releaseDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
