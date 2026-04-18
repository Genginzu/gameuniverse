"use client";

import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PLATFORM_META, type GamingPlatform, type LinkedPlatform } from "@/types/linked-platforms";

interface PlatformRowProps {
  platform: GamingPlatform;
  linked: LinkedPlatform | null;
  isEditing: boolean;
  editValue: string;
  saving: boolean;
  syncing: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (v: string) => void;
  onSaveManual: () => void;
  onConnectPsn: () => void;
  onSyncLibrary: (platform: "steam" | "xbox") => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}

export function PlatformRow(props: PlatformRowProps) {
  const { platform, linked, isEditing, editValue, saving, t, onEditValueChange, onSaveManual, onConnectPsn, onCancelEdit } = props;
  const meta = PLATFORM_META[platform];

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/30 p-3 transition-all dark:bg-slate-700/30">
      <PlatformIdentity platform={platform} linked={linked} t={t} />

      {isEditing ? (
        <EditingRow
          platform={platform}
          authType={meta.authType}
          editValue={editValue}
          saving={saving}
          t={t}
          onEditValueChange={onEditValueChange}
          onSave={meta.authType === "npsso" ? onConnectPsn : onSaveManual}
          onCancel={onCancelEdit}
        />
      ) : (
        <DisplayRow {...props} />
      )}
    </div>
  );
}

function PlatformIdentity({ platform, linked, t }: {
  platform: GamingPlatform;
  linked: LinkedPlatform | null;
  t: (key: string) => string;
}) {
  const meta = PLATFORM_META[platform];
  const avatar = linked?.platformAvatarUrl;

  return (
    <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover"
        />
      ) : (
        <Icon icon={meta.icon} className={`h-6 w-6 shrink-0 ${meta.color}`} />
      )}
      <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
        {t(`names.${platform}`)}
      </span>
    </div>
  );
}

function EditingRow({
  platform, authType, editValue, saving, t, onEditValueChange, onSave, onCancel,
}: {
  platform: GamingPlatform; authType: string; editValue: string; saving: boolean;
  t: (key: string) => string; onEditValueChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const placeholder =
    authType === "npsso"
      ? t("npssoPlaceholder")
      : platform === "nintendo"
        ? t("friendCodePlaceholder")
        : t("usernamePlaceholder");

  return (
    <div className="flex flex-1 items-center gap-2">
      <Input
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 flex-1 text-base"
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        autoFocus
      />
      <Button size="sm" onClick={onSave} disabled={saving || !editValue.trim()}>
        <Icon icon="lucide:check" className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        <Icon icon="lucide:x" className="h-4 w-4" />
      </Button>
    </div>
  );
}

function DisplayRow({
  platform, linked, saving, syncing, t,
  onStartEdit, onSyncLibrary, onToggleVisibility, onRemove,
}: PlatformRowProps) {
  const meta = PLATFORM_META[platform];
  const { authType } = meta;
  const isConnected = !!linked;
  const displayName = linked?.platformUsername ?? linked?.externalId ?? null;

  const handleOAuthConnect = () => {
    const routes: Partial<Record<GamingPlatform, string>> = {
      steam: "/api/auth/steam", xbox: "/api/auth/xbox", epic: "/api/auth/epic",
      discord: "/api/auth/discord", battlenet: "/api/auth/battlenet", itch: "/api/auth/itch",
    };
    const route = routes[platform];
    if (route) window.location.href = route;
  };

  const connectIcon = authType === "oauth" ? "lucide:log-in" : authType === "npsso" ? "lucide:key" : "lucide:plus";
  const handleConnect = authType === "oauth" ? handleOAuthConnect : onStartEdit;

  const manualOnlyPlatforms: GamingPlatform[] = ["ubisoft", "ea"];
  const showManualHint = manualOnlyPlatforms.includes(platform);
  const canSync = isConnected && (platform === "steam" || platform === "xbox");

  return (
    <div className="flex flex-1 items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          {isConnected ? (
            <>
              <Icon icon="lucide:check-circle" className="h-4 w-4 shrink-0 text-green-500" />
              <span className="truncate">{displayName ?? t("connected")}</span>
            </>
          ) : (
            <>
              {t("notLinked")}
              {showManualHint && (
                <span title={t("manualOnlyHint")} className="inline-flex">
                  <Icon icon="lucide:info" className="h-3.5 w-3.5 text-amber-500" />
                </span>
              )}
            </>
          )}
        </span>
        {isConnected && linked?.lastSyncedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {t("lastSyncedAt", { when: formatRelative(linked.lastSyncedAt) })}
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {!isConnected && (
          <Button size="sm" variant="ghost" onClick={handleConnect} className="min-h-[44px] min-w-[44px]">
            <Icon icon={connectIcon} className="h-4 w-4" />
          </Button>
        )}
        {isConnected && authType === "manual" && (
          <Button size="sm" variant="ghost" onClick={onStartEdit} className="min-h-[44px] min-w-[44px]">
            <Icon icon="lucide:pencil" className="h-4 w-4" />
          </Button>
        )}
        {canSync && (
          <Button
            size="sm" variant="ghost"
            onClick={() => onSyncLibrary(platform)}
            disabled={syncing || saving}
            className="min-h-[44px] min-w-[44px]" title={t("syncLibrary")}
          >
            <Icon
              icon={syncing ? "lucide:loader-2" : "lucide:refresh-cw"}
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
        {isConnected && (
          <Button
            size="sm" variant="ghost" onClick={onToggleVisibility} disabled={saving}
            className="min-h-[44px] min-w-[44px]"
            title={linked?.isPublic ? t("makePrivate") : t("makePublic")}
          >
            <Icon
              icon={linked?.isPublic ? "lucide:eye" : "lucide:eye-off"}
              className="h-4 w-4"
            />
          </Button>
        )}
        {isConnected && (
          <Button
            size="sm" variant="ghost" onClick={onRemove} disabled={saving}
            className="min-h-[44px] min-w-[44px] text-red-500 hover:text-red-600"
          >
            <Icon icon="lucide:trash-2" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
