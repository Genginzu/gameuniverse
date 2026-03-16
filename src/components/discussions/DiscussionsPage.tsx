"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

import { useDiscussions } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";

import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import MessageInput from "./MessageInput";
import EmptyConversationState from "./EmptyConversationState";
import NewConversationDialog from "./NewConversationDialog";

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

  return (
    <div className="flex h-full flex-col p-4 md:p-6" data-testid="discussions-page">
      <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t("pageTitle")}</h1>

      {/* Split layout: conversation list left, thread right */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left panel — ~1/3 width */}
        <div className="hidden w-1/3 min-w-[280px] md:flex">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={selectConversation}
            onNewConversation={handleNewConversation}
            isLoading={isLoading}
          />
        </div>

        {/* Right panel — ~2/3 width */}
        <div className="flex flex-1 flex-col gap-3">
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
            <>
              <div className="min-h-0 flex-1">
                <MessageThread
                  messages={messages}
                  currentUserId={user.id}
                  isLoading={isLoadingMessages}
                  hasMore={hasMoreMessages}
                  onLoadMore={loadMoreMessages}
                />
              </div>
              <MessageInput onSend={sendMessage} isSending={isSending} maxLength={2000} />
            </>
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
