"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";
import { SearchBar } from "./SearchBar";
import { PostComposer } from "./PostComposer";
import { ActivityFeedColumn } from "./ActivityFeedColumn";
import { PostsFeedColumn } from "./PostsFeedColumn";

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

  const handlePostCreated = async (content: string, imageUrl?: string, tags?: string[]) => {
    await postHook.createPost(content, imageUrl, tags);
    setShowComposer(false);
  };

  return (
    <section className="mb-8 space-y-6">
      {/* Top bar: search + new post button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SearchBar value={postHook.searchTerm} onChange={postHook.setSearchTerm} />
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-linear-to-br from-violet-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:opacity-90"
          >
            {showComposer ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {t("newPost")}
          </button>
        )}
      </div>

      {/* Composer (toggled) */}
      {isOwner && showComposer && (
        <PostComposer
          playerId={playerId}
          playerAvatar={playerAvatar}
          isCreating={postHook.isCreating}
          onSubmit={handlePostCreated}
          onPostCreated={() => {}}
        />
      )}

      {/* Two-column layout: activities left, posts right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ActivityFeedColumn playerId={playerId} locale={locale} />
        <PostsFeedColumn
          postHook={postHook}
          playerName={playerName}
          playerAvatar={playerAvatar}
          locale={locale}
          isOwner={isOwner}
        />
      </div>
    </section>
  );
}
