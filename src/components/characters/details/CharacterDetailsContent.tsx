"use client";

import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterDetails } from "@/types/character";
import { useState } from "react";
import { CharacterDescriptionTab } from "./CharacterDescriptionTab";
import { CharacterGamesTab } from "./CharacterGamesTab";
import { CharacterMediaTab } from "./CharacterMediaTab";
import { FavoriteCharacterButton } from "./FavoriteCharacterButton";
import { useViewTracker } from "@/hooks/useViewTracker";

// Lazy load du tab commentaires — react-hook-form + zod ne sont chargés que si nécessaire
const CharacterCommentsTab = dynamic(
  () =>
    import("../comments/CharacterCommentsTab").then((m) => ({ default: m.CharacterCommentsTab })),
  {
    ssr: false,
    loading: () => <CommentsTabSkeleton />,
  }
);

interface CharacterDetailsContentProps {
  character: CharacterDetails;
  locale: string;
}

type TabKey = "description" | "games" | "media" | "comments";

// Couleurs dynamiques selon le rôle du personnage
const getCharacterColors = (role?: string) => {
  const characterRole = role?.toLowerCase() || "";

  if (characterRole.includes("protagonist") || characterRole.includes("hero")) {
    return {
      primary: "#3b82f6",
      secondary: "#1d4ed8",
      accent: "#60a5fa",
      bg: "from-blue-500/20 to-indigo-500/20",
    };
  }
  if (characterRole.includes("antagonist") || characterRole.includes("villain")) {
    return {
      primary: "#ef4444",
      secondary: "#b91c1c",
      accent: "#f87171",
      bg: "from-red-500/20 to-purple-500/20",
    };
  }
  if (characterRole.includes("supporting") || characterRole.includes("ally")) {
    return {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399",
      bg: "from-emerald-500/20 to-teal-500/20",
    };
  }
  return {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
    bg: "from-violet-500/20 to-blue-500/20",
  };
};

export function CharacterDetailsContent({ character, locale }: CharacterDetailsContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  // Le count commentaires est remonté par le tab quand il est chargé
  const [commentCount, setCommentCount] = useState<number | null>(null);
  useViewTracker("characters", character.slug);

  const colors = getCharacterColors(character.role);
  const primaryGame = character.games.find((g) => g.isPrimary) || character.games[0];
  const heroBackgroundImage = primaryGame?.backgroundImage || character.media.backgroundImage;
  const bgColor = character.backgroundColor || "#0f172a";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <HeroSection
        character={character}
        locale={locale}
        colors={colors}
        heroBackgroundImage={heroBackgroundImage}
        primaryGame={primaryGame}
        bgColor={bgColor}
      />

      <div className="relative z-20 mt-2">
        <div className="container mx-auto px-4 pb-16">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            gamesCount={character.games.length}
            commentCount={commentCount}
          />

          <div className="mx-auto max-w-6xl">
            {activeTab === "description" && (
              <CharacterDescriptionTab
                character={character}
                locale={locale}
                colors={colors}
                primaryGame={primaryGame}
              />
            )}
            {activeTab === "games" && (
              <CharacterGamesTab games={character.games} locale={locale} colors={colors} />
            )}
            {activeTab === "media" && (
              <CharacterMediaTab media={character.media} characterName={character.name} />
            )}
            {activeTab === "comments" && (
              <CharacterCommentsTab characterId={character.id} onCountLoaded={setCommentCount} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero Section ── */

interface HeroSectionProps {
  character: CharacterDetails;
  locale: string;
  colors: ReturnType<typeof getCharacterColors>;
  heroBackgroundImage?: string;
  primaryGame: CharacterDetails["games"][number] | undefined;
  bgColor: string;
}

function HeroSection({
  character,
  locale: _locale,
  colors,
  heroBackgroundImage,
  primaryGame,
  bgColor,
}: HeroSectionProps) {
  const t = useTranslations();

  return (
    <div className="relative min-h-[45vh] overflow-hidden">
      {heroBackgroundImage && (
        <div className="absolute inset-0 z-0">
          <LazyImage
            src={heroBackgroundImage}
            alt={`${primaryGame?.title || character.primaryGame} background`}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
            showSkeleton={true}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${bgColor}40 0%, transparent 30%, transparent 50%, ${bgColor}95 85%, ${bgColor} 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${bgColor}90 0%, transparent 25%, transparent 75%, ${bgColor}90 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center bottom, transparent 30%, ${bgColor}60 100%)`,
            }}
          />
        </div>
      )}

      {/* Navigation flottante */}
      <div className="absolute top-0 right-0 left-0 z-20 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/characters">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] bg-slate-900/60 text-slate-300 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white"
            >
              <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FavoriteCharacterButton characterSlug={character.slug} />
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-16">
        <div className="flex flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-center">
          <div className="relative shrink-0">
            <div
              className={`absolute -inset-8 bg-linear-to-t ${colors.bg} rounded-full opacity-30 blur-3xl`}
            />
            <div className="relative">
              <div className="relative h-[320px] w-[240px] sm:h-[400px] sm:w-[300px] lg:h-[480px] lg:w-[360px]">
                <LazyImage
                  src={character.media.mainImage}
                  alt={character.name}
                  fill
                  className="object-contain object-bottom drop-shadow-2xl"
                  sizes="(max-width: 768px) 375px, 450px"
                  priority
                  showSkeleton={true}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 max-w-lg text-center lg:mt-0 lg:flex-1 lg:pl-6 lg:text-left">
            <div className="mb-3 flex items-center justify-center gap-3 lg:justify-start">
              <h1 className="neon-text text-5xl leading-tight font-bold text-white drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] lg:text-6xl">
                {character.name}
              </h1>
            </div>
            {(character.gender || character.species) && (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {character.gender && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-1 text-sm text-slate-300 backdrop-blur-xs">
                    <Icon icon="lucide:user" className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">{t("characters.details.gender")}:</span>
                    <span className="text-slate-200">{character.gender.name}</span>
                  </span>
                )}
                {character.species && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-1 text-sm text-slate-300 backdrop-blur-xs">
                    <Icon icon="lucide:dna" className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">{t("characters.details.species")}:</span>
                    <span className="text-slate-200">{character.species.name}</span>
                  </span>
                )}
              </div>
            )}
            {character.description && (
              <p className="text-lg leading-relaxed text-slate-200 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
                {character.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab Navigation ── */

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  gamesCount: number;
  commentCount: number | null;
}

function TabNavigation({ activeTab, onTabChange, gamesCount, commentCount }: TabNavigationProps) {
  const t = useTranslations();

  const tabs: { key: TabKey; icon: string; label: string; count?: number | null }[] = [
    { key: "description", icon: "lucide:book-open", label: t("characters.tabs.description") },
    {
      key: "games",
      icon: "lucide:gamepad-2",
      label: t("characters.tabs.games"),
      count: gamesCount,
    },
    { key: "media", icon: "lucide:eye", label: t("characters.tabs.media") },
    {
      key: "comments",
      icon: "lucide:message-circle",
      label: t("characters.tabs.comments"),
      count: commentCount,
    },
  ];

  return (
    <div className="mb-8 flex justify-center">
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/80 p-1.5 backdrop-blur-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ key, icon, label, count }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-all sm:px-6 ${
              activeTab === key
                ? "bg-white text-slate-900 shadow-lg dark:bg-slate-700 dark:text-white"
                : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <Icon icon={icon} className="inline h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{label}</span>
            {count !== null && count !== undefined && (
              <span className="hidden sm:inline"> ({count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton pour le lazy load du tab commentaires ── */

function CommentsTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-4">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-7 w-10" />
        <Skeleton className="h-4 w-24" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
