"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";
import { SearchBar } from "../SearchBar";
import { PostComposer } from "../posts/PostComposer";
import { ActivityFeedColumn } from "./ActivityFeedColumn";
import { PostsFeedColumn } from "../posts/PostsFeedColumn";

interface ActivityFeedProps {
  playerId: string;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
}

/**
 * Onglet unifié Activité + Posts.
 * Barre de recherche + bouton nouveau post en haut,
 * puis activités à gauche et posts à droite.
 */
export function ActivityFeed({
  playerId,
  playerName,
  playerAvatar,
  locale,
  isOwner,
}: ActivityFeedProps) {
  const t = useTranslations("players.posts");
  const postHook = usePlayerPosts(playerId);
  const [showComposer, setShowComposer] = useState(false);

  const handlePostCreated = async (content: string, imageUrl?: string) => {
    await postHook.createPost(content, imageUrl);
    setShowComposer(false);
  };

  return (
    <section className="mb-8 space-y-6">
      {/* Top bar: search + new post button */}
      <div className="xs:flex-row xs:items-center xs:justify-between flex flex-col-reverse gap-3">
        <div className="min-w-0 flex-1">
          <SearchBar value={postHook.searchTerm} onChange={postHook.setSearchTerm} />
        </div>
        {isOwner && (
          <div className="xs:w-auto flex shrink-0">
            <button
              type="button"
              onClick={() => setShowComposer((v) => !v)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-palette-primary-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-palette-primary-500/20 transition-all duration-300 hover:opacity-90"
            >
              {showComposer ? (
                <Icon icon="lucide:x" className="h-4 w-4" />
              ) : (
                <Icon icon="lucide:plus" className="h-4 w-4" />
              )}
              {t("newPost")}
            </button>
          </div>
        )}
      </div>

      {/* Post composer (toggled) */}
      {isOwner && showComposer && (
        <PostComposer
          playerId={playerId}
          playerAvatar={playerAvatar}
          isCreating={postHook.isCreating}
          onSubmit={handlePostCreated}
          onPostCreated={() => {}}
        />
      )}

      {/* Two-column layout: posts left, activities right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PostsFeedColumn
          postHook={postHook}
          playerName={playerName}
          playerAvatar={playerAvatar}
          locale={locale}
          isOwner={isOwner}
        />
        <ActivityFeedColumn playerId={playerId} locale={locale} />
      </div>
    </section>
  );
}
