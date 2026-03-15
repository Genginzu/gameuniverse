"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { usePlayerAchievementManager } from "@/hooks/usePlayerAchievementManager";
import { useAdminAchievements } from "@/hooks/useAdminAchievements";
import { PlayerSearchResults } from "./PlayerSearchResults";
import { PlayerAchievementList } from "./PlayerAchievementList";
import { AssignAchievementDialog } from "./AssignAchievementDialog";
import { RevokeAchievementDialog } from "./RevokeAchievementDialog";
import type { AdminAchievement, PlayerSearchResult } from "@/types/admin-achievements";

export function PlayerAchievementManager() {
  const t = useTranslations("adminAchievements.playerManager");
  const tAssign = useTranslations("adminAchievements.playerManager.assignDialog");
  const tRevoke = useTranslations("adminAchievements.playerManager.revokeDialog");

  const {
    players,
    selectedPlayer,
    playerAchievements,
    searchLoading,
    achievementsLoading,
    searchPlayers,
    selectPlayer,
    assignAchievement,
    revokeAchievement,
  } = usePlayerAchievementManager();

  const { achievements } = useAdminAchievements();

  const [searchInput, setSearchInput] = useState("");
  const [assignTarget, setAssignTarget] = useState<AdminAchievement | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AdminAchievement | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    searchPlayers(value);
  };

  const handleSelectPlayer = (player: PlayerSearchResult) => {
    selectPlayer(player);
    setSearchInput("");
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget) return;
    setIsAssigning(true);
    try {
      await assignAchievement(assignTarget.key);
      toast({ title: tAssign("success"), variant: "success" });
      setAssignTarget(null);
    } catch {
      toast({ title: tAssign("errorGeneric"), variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await revokeAchievement(revokeTarget.key);
      toast({ title: tRevoke("success"), variant: "success" });
      setRevokeTarget(null);
    } catch {
      toast({ title: tRevoke("errorGeneric"), variant: "destructive" });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search section */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t("searchPlayer")}
        </h2>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={t("searchPlayerPlaceholder")}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            aria-label={t("searchPlayerPlaceholder")}
          />
        </div>
        <PlayerSearchResults
          players={players}
          searchLoading={searchLoading}
          hasQuery={!!searchInput.trim()}
          onSelect={handleSelectPlayer}
        />
      </div>

      {/* Selected player achievements */}
      {selectedPlayer && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("playerAchievements", { player: selectedPlayer.username })}
          </h2>
          <PlayerAchievementList
            achievements={achievements}
            unlockedKeys={playerAchievements}
            onAssign={setAssignTarget}
            onRevoke={setRevokeTarget}
            isLoading={achievementsLoading}
          />
        </div>
      )}

      {/* Dialogs */}
      <AssignAchievementDialog
        achievement={assignTarget}
        playerName={selectedPlayer?.username ?? ""}
        isOpen={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        onConfirm={handleConfirmAssign}
        isAssigning={isAssigning}
      />
      <RevokeAchievementDialog
        achievement={revokeTarget}
        playerName={selectedPlayer?.username ?? ""}
        isOpen={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleConfirmRevoke}
        isRevoking={isRevoking}
      />
    </div>
  );
}
