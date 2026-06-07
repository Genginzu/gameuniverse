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
    <section className="editorial-activity">
      {/* Top bar: search + new post button */}
      <div className="editorial-activity-toolbar">
        <div className="min-w-0 flex-1">
          <SearchBar value={postHook.searchTerm} onChange={postHook.setSearchTerm} />
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="editorial-activity-new-post"
          >
            {showComposer ? (
              <Icon icon="lucide:x" className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
            )}
            {t("newPost")}
          </button>
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
      <div className="editorial-activity-columns">
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
