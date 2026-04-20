"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import type { CharacterDetails } from "@/types/character";
import { useState } from "react";
import { CharacterDescriptionTab } from "./CharacterDescriptionTab";
import { CharacterGamesTab } from "./CharacterGamesTab";
import { CharacterMediaTab } from "./CharacterMediaTab";
import { CharacterHeroSection } from "./CharacterHeroSection";
import { CharacterTabNavigation } from "./CharacterTabNavigation";
import { useViewTracker } from "@/hooks/useViewTracker";

const CharacterCommentsTab = dynamic(
  () =>
    import("../comments/CharacterCommentsTab").then((m) => ({ default: m.CharacterCommentsTab })),
  {
    ssr: false,
    loading: () => <CommentsTabSkeleton />,
  }
);

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

interface CharacterDetailsContentProps {
  character: CharacterDetails;
  locale: string;
}

export function CharacterDetailsContent({ character, locale }: CharacterDetailsContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [commentCount, setCommentCount] = useState<number | null>(null);
  useViewTracker("characters", character.slug);

  const colors = getCharacterColors(character.role);
  const primaryGame = character.games.find((g) => g.isPrimary) || character.games[0];
  const heroBackgroundImage = primaryGame?.backgroundImage || character.media.backgroundImage;
  const bgColor = character.backgroundColor || "#0f172a";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <CharacterHeroSection
        character={character}
        colors={colors}
        heroBackgroundImage={heroBackgroundImage}
        primaryGame={primaryGame}
        bgColor={bgColor}
      />

      <div className="relative z-20 mt-2">
        <div className="container mx-auto px-4 pb-16">
          <CharacterTabNavigation
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
