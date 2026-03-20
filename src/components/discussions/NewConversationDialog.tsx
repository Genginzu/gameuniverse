"use client";

import { useState, useMemo } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import FriendSearchItem from "./FriendSearchItem";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectFriend: (friendId: string) => void;
  friends: Array<{ id: string; displayName: string; avatarUrl: string | null }>;
  isLoadingFriends: boolean;
}

export default function NewConversationDialog({
  open,
  onClose,
  onSelectFriend,
  friends,
  isLoadingFriends,
}: NewConversationDialogProps) {
  const t = useTranslations("discussions");
  const [search, setSearch] = useState("");

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends;
    const query = search.toLowerCase();
    return friends.filter((f) => f.displayName.toLowerCase().includes(query));
  }, [friends, search]);

  const handleSelect = (friendId: string) => {
    onSelectFriend(friendId);
    setSearch("");
    onClose();
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="glass-card relative z-10 mx-4 flex w-full max-w-md flex-col rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/30"
        data-testid="new-conversation-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t("newConversation")}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 p-4 dark:border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("newConversation")}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-700/60"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchFriends")}
              className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Friend list */}
        <div className="max-h-64 flex-1 overflow-y-auto px-2 pb-3">
          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neon-violet" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("noFriendsFound")}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredFriends.map((friend) => (
                <FriendSearchItem key={friend.id} friend={friend} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
