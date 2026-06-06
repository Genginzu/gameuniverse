"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
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
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="border-editorial-line bg-editorial-2 relative z-10 flex w-full flex-col rounded-none border shadow-lg shadow-black/30 sm:mx-4 sm:max-w-md sm:rounded-2xl"
        style={{ maxHeight: "100dvh" }}
        data-testid="new-conversation-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t("newConversation")}
      >
        {/* Header */}
        <div className="border-editorial-line flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-white">{t("newConversation")}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-all duration-300 hover:bg-white/10"
            aria-label="Close"
          >
            <Icon icon="lucide:x" className="text-editorial-muted h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Icon
              icon="lucide:search"
              className="text-editorial-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchFriends")}
              className="border-editorial-line bg-editorial-3 w-full rounded-xl border py-2.5 pr-3 pl-9 text-base text-white placeholder:text-editorial-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
              autoFocus
            />
          </div>
        </div>

        {/* Friend list */}
        <div className="max-h-[50vh] flex-1 overflow-y-auto px-2 pb-3 sm:max-h-64">
          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-8">
              <Icon icon="lucide:loader-2" className="text-editorial-accent h-6 w-6 animate-spin" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <p className="text-editorial-muted py-8 text-center text-sm">{t("noFriendsFound")}</p>
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
