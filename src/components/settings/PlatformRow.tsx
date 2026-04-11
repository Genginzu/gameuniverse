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
  t: (key: string) => string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (v: string) => void;
  onSaveManual: () => void;
  onConnectPsn: () => void;
  onRemove: () => void;
}

export function PlatformRow({
  platform, linked, isEditing, editValue, saving, t,
  onStartEdit, onCancelEdit, onEditValueChange, onSaveManual, onConnectPsn, onRemove,
}: PlatformRowProps) {
  const meta = PLATFORM_META[platform];
  const isConnected = !!linked;
  const displayName = linked?.platformUsername ?? linked?.externalId ?? null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/30 p-3 transition-all dark:bg-slate-700/30">
      <Icon icon={meta.icon} className={`h-6 w-6 shrink-0 ${meta.color}`} />
      <span className="w-24 shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
        {t(`names.${platform}`)}
      </span>

      {isEditing ? (
        <EditingRow
          authType={meta.authType}
          editValue={editValue}
          saving={saving}
          t={t}
          onEditValueChange={onEditValueChange}
          onSave={meta.authType === "npsso" ? onConnectPsn : onSaveManual}
          onCancel={onCancelEdit}
        />
      ) : (
        <DisplayRow
          platform={platform}
          authType={meta.authType}
          isConnected={isConnected}
          displayName={displayName}
          saving={saving}
          t={t}
          onStartEdit={onStartEdit}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}

function EditingRow({
  authType, editValue, saving, t, onEditValueChange, onSave, onCancel,
}: {
  authType: string; editValue: string; saving: boolean; t: (key: string) => string;
  onEditValueChange: (v: string) => void; onSave: () => void; onCancel: () => void;
}) {
  const placeholder = authType === "npsso" ? t("npssoPlaceholder") : t("usernamePlaceholder");

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
  platform, authType, isConnected, displayName, saving, t, onStartEdit, onRemove,
}: {
  platform: GamingPlatform; authType: string; isConnected: boolean; displayName: string | null;
  saving: boolean; t: (key: string) => string; onStartEdit: () => void; onRemove: () => void;
}) {
  const handleOAuthConnect = () => {
    if (platform === "steam") window.location.href = "/api/auth/steam";
    if (platform === "xbox") window.location.href = "/api/auth/xbox";
  };

  const connectIcon = authType === "oauth" ? "lucide:log-in" : authType === "npsso" ? "lucide:key" : "lucide:plus";
  const handleConnect = authType === "oauth" ? handleOAuthConnect : onStartEdit;

  return (
    <div className="flex flex-1 items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {isConnected ? (
          <span className="flex items-center gap-1.5">
            <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500" />
            {displayName ?? t("connected")}
          </span>
        ) : (
          t("notLinked")
        )}
      </span>
      <div className="flex gap-1">
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
