"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";
import { usePlayerSessions } from "@/hooks/usePlayerSessions";
import { SearchBar } from "../SearchBar";
import { PostComposer } from "../posts/PostComposer";
import { SessionComposer } from "../sessions/SessionComposer";
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
  const tSessions = useTranslations("players.sessions");
  const postHook = usePlayerPosts(playerId);
  const sessionHook = usePlayerSessions(playerId, locale);
  const [showComposer, setShowComposer] = useState(false);
  const [showSessionComposer, setShowSessionComposer] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const handlePostCreated = async (content: string, imageUrl?: string, tags?: string[]) => {
    await postHook.createPost(content, imageUrl, tags);
    setShowComposer(false);
  };

  const handleSessionCreated = async (payload: {
    gameId: string;
    date: string;
    durationMinutes: number;
  }) => {
    await sessionHook.createSession(payload);
    setShowSessionComposer(false);
    // Force the activity feed to refetch so the new session appears immediately.
    setActivityRefreshKey((n) => n + 1);
  };

  return (
    <section className="mb-8 space-y-6">
      {/* Top bar: search + new post / new session buttons */}
      <div className="xs:flex-row xs:items-center xs:justify-between flex flex-col-reverse gap-3">
        <div className="min-w-0 flex-1">
          <SearchBar value={postHook.searchTerm} onChange={postHook.setSearchTerm} />
        </div>
        {isOwner && (
          <div className="xs:w-auto xs:flex-row flex w-full shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowSessionComposer((v) => !v);
                if (!showSessionComposer) setShowComposer(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-cyan-500 to-violet-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:opacity-90"
            >
              {showSessionComposer ? (
                <Icon icon="lucide:x" className="h-4 w-4" />
              ) : (
                <Icon icon="lucide:gamepad-2" className="h-4 w-4" />
              )}
              {tSessions("newSession")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowComposer((v) => !v);
                if (!showComposer) setShowSessionComposer(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-violet-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:opacity-90"
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

      {/* Session composer (toggled) */}
      {isOwner && showSessionComposer && (
        <SessionComposer
          locale={locale}
          isCreating={sessionHook.isCreating}
          onSubmit={handleSessionCreated}
        />
      )}

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
        <ActivityFeedColumn
          key={activityRefreshKey}
          playerId={playerId}
          locale={locale}
        />
      </div>
    </section>
  );
}
