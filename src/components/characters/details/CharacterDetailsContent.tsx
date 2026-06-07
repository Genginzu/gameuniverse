"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { CharacterDetails } from "@/types/character";
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

interface CharacterDetailsContentProps {
  character: CharacterDetails;
  locale: string;
}

export function CharacterDetailsContent({ character, locale }: CharacterDetailsContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [commentCount, setCommentCount] = useState<number | null>(null);
  useViewTracker("characters", character.slug);

  const primaryGame = character.games.find((g) => g.isPrimary) || character.games[0];
  const heroBackgroundImage = primaryGame?.backgroundImage || character.media.backgroundImage;

  return (
    <div className="bg-editorial-bg min-h-screen">
      <CharacterHeroSection
        character={character}
        heroBackgroundImage={heroBackgroundImage}
        primaryGame={primaryGame}
      />

      <div className="relative z-20">
        <div className="mx-auto max-w-[1536px] px-4 pb-16 md:px-8">
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
                primaryGame={primaryGame}
              />
            )}
            {activeTab === "games" && (
              <CharacterGamesTab games={character.games} locale={locale} />
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
      <div className="border-editorial-line bg-editorial-2 flex items-center gap-3 rounded-xl border px-5 py-4">
        <div className="h-6 w-6 animate-pulse rounded-full bg-white/10" />
        <div className="h-7 w-10 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-editorial-line bg-editorial-2 rounded-xl border p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-white/10" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
