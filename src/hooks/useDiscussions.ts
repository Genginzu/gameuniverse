"use client";

import { useState, useEffect, useCallback } from "react";
import { DiscussionService } from "@/lib/services/discussionService";
import { useAuth } from "@/hooks/useAuth";
import type { ConversationSummary, Message } from "@/types/discussion";

export interface UseDiscussionsReturn {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createConversation: (friendId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refreshConversations: () => Promise<void>;
}

/**
 * Hook principal pour gérer les discussions (conversations + messages).
 * Charge les conversations au montage, gère la sélection, l'envoi et la pagination.
 */
export function useDiscussions(): UseDiscussionsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DiscussionService.fetchConversations();
      setConversations(data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadConversations();
  }, [user?.id, loadConversations]);

  const selectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsLoadingMessages(true);
    setError(null);
    try {
      const data = await DiscussionService.fetchMessages(conversationId);
      setMessages(data.messages);
      setHasMoreMessages(data.hasMore);
      setNextCursor(data.nextCursor);
      // Marquer comme lus et rafraîchir les conversations en parallèle
      const [, updated] = await Promise.all([
        DiscussionService.markAsRead(conversationId),
        DiscussionService.fetchConversations(),
      ]);
      setConversations(updated.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversationId) return;
      setIsSending(true);
      setError(null);
      try {
        const newMessage = await DiscussionService.sendMessage(selectedConversationId, content);
        setMessages((prev) => [...prev, newMessage]);
        // Mise à jour optimiste de la conversation (lastMessage + tri)
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === selectedConversationId
              ? {
                  ...c,
                  lastMessage: {
                    content: newMessage.content,
                    senderId: newMessage.senderId,
                    createdAt: newMessage.createdAt,
                  },
                }
              : c
          );
          // Re-trier : la conversation active remonte en premier
          updated.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return (
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
            );
          });
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [selectedConversationId]
  );

  const createConversation = useCallback(
    async (friendId: string) => {
      setError(null);
      try {
        const { id } = await DiscussionService.createConversation(friendId);
        const updated = await DiscussionService.fetchConversations();
        setConversations(updated.conversations);
        await selectConversation(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create conversation");
      }
    },
    [selectConversation]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversationId || !nextCursor || !hasMoreMessages) return;
    setIsLoadingMessages(true);
    try {
      const data = await DiscussionService.fetchMessages(selectedConversationId, nextCursor);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversationId, nextCursor, hasMoreMessages]);

  const refreshConversations = useCallback(async () => {
    if (!user?.id) return;
    await loadConversations();
  }, [user?.id, loadConversations]);

  return {
    conversations,
    selectedConversationId,
    messages,
    isLoading,
    isLoadingMessages,
    isSending,
    error,
    hasMoreMessages,
    selectConversation,
    sendMessage,
    createConversation,
    loadMoreMessages,
    refreshConversations,
  };
}
