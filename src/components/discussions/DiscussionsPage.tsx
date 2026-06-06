"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { useDiscussions } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";

import { Icon } from "@iconify/react";

import { LazyImage } from "@/components/ui/lazy-image";

import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import MessageInput from "./MessageInput";
import EmptyConversationState from "./EmptyConversationState";

const NewConversationDialog = dynamic(() => import("./NewConversationDialog"), {
  ssr: false,
});

interface FriendEntry {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export default function DiscussionsPage() {
  const t = useTranslations("discussions");
  const { user } = useAuth();
  const {
    conversations,
    selectedConversationId,
    messages,
    isLoading,
    isLoadingMessages,
    isSending,
    hasMoreMessages,
    selectConversation,
    sendMessage,
    createConversation,
    loadMoreMessages,
  } = useDiscussions();

  const handleBackToList = useCallback(() => {
    selectConversation("");
  }, [selectConversation]);

  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingFriends(true);
    try {
      const res = await fetch(`/api/players/${user.id}/friends?limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const mapped: FriendEntry[] = (data.friends ?? []).map(
        (f: { id: string; displayName: string; avatarUrl: string | null }) => ({
          id: f.id,
          displayName: f.displayName,
          avatarUrl: f.avatarUrl,
        })
      );
      setFriends(mapped);
    } catch {
      // Silently fail — dialog will show empty state
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user?.id]);

  // Fetch friends when dialog opens
  useEffect(() => {
    if (showNewConversationDialog) {
      fetchFriends();
    }
  }, [showNewConversationDialog, fetchFriends]);

  const handleNewConversation = () => setShowNewConversationDialog(true);
  const handleCloseDialog = () => setShowNewConversationDialog(false);

  const handleSelectFriend = async (friendId: string) => {
    await createConversation(friendId);
  };

  // Find selected friend name for the thread header
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-6" data-testid="discussions-page">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{t("pageTitle")}</h1>
        <p className="text-editorial-muted mt-1 text-sm">{t("pageSubtitle")}</p>
      </div>

      {/* Split layout */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left panel — conversation list */}
        <div className="hidden w-1/3 max-w-[380px] min-w-[300px] md:flex">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={selectConversation}
            onNewConversation={handleNewConversation}
            isLoading={isLoading}
          />
        </div>

        {/* Right panel — message thread */}
        <div className="flex flex-1 flex-col">
          {/* Mobile: show conversation list when no conversation selected */}
          <div className="md:hidden">
            {!selectedConversationId && (
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={selectConversation}
                onNewConversation={handleNewConversation}
                isLoading={isLoading}
              />
            )}
          </div>

          {selectedConversationId && user ? (
            <div className="border-editorial-line bg-editorial-2 flex flex-1 flex-col rounded-2xl border">
              {/* Thread header */}
              {selectedConversation && (
                <div className="border-editorial-line flex items-center gap-3 border-b px-4 py-3 md:px-5 md:py-4">
                  {/* Back button — mobile only */}
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-colors hover:bg-white/10 md:hidden"
                    aria-label={t("backToConversations")}
                  >
                    <Icon
                      icon="lucide:arrow-left"
                      className="text-editorial-muted h-5 w-5"
                    />
                  </button>
                  <div className="bg-editorial-3 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    {selectedConversation.friend.avatarUrl ? (
                      <LazyImage
                        src={selectedConversation.friend.avatarUrl}
                        alt={selectedConversation.friend.displayName}
                        fill
                        className="object-cover"
                        sizes="40px"
                        showSkeleton
                      />
                    ) : (
                      <Icon icon="lucide:user" className="text-editorial-accent h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {selectedConversation.friend.displayName}
                  </span>
                </div>
              )}

              {/* Messages */}
              <div className="min-h-0 flex-1">
                <MessageThread
                  messages={messages}
                  currentUserId={user.id}
                  isLoading={isLoadingMessages}
                  hasMore={hasMoreMessages}
                  onLoadMore={loadMoreMessages}
                />
              </div>

              {/* Input */}
              <div className="border-editorial-line border-t px-3 py-2 md:px-4 md:py-3">
                <MessageInput onSend={sendMessage} isSending={isSending} maxLength={2000} />
              </div>
            </div>
          ) : (
            <div className="hidden flex-1 md:flex">
              <EmptyConversationState />
            </div>
          )}
        </div>
      </div>

      <NewConversationDialog
        open={showNewConversationDialog}
        onClose={handleCloseDialog}
        onSelectFriend={handleSelectFriend}
        friends={friends}
        isLoadingFriends={isLoadingFriends}
      />
    </div>
  );
}
