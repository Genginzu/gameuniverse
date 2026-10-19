"use client";

import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PLATFORM_META, type GamingPlatform, type LinkedPlatform } from "@/types/linked-platforms";
import { isSyncablePlatform, type LibrarySyncJob, type SyncablePlatform } from "@/types/library-sync";

interface PlatformRowProps {
  platform: GamingPlatform;
  linked: LinkedPlatform | null;
  isEditing: boolean;
  editValue: string;
  saving: boolean;
  syncing: boolean;
  job?: LibrarySyncJob | null;
  t: (key: string, values?: Record<string, string | number>) => string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (v: string) => void;
  onSaveManual: () => void;
  onConnectPsn: () => void;
  onSyncLibrary: (platform: SyncablePlatform) => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}

export function PlatformRow(props: PlatformRowProps) {
  const {
    platform,
    isEditing,
    editValue,
    saving,
    t,
    onEditValueChange,
    onSaveManual,
    onConnectPsn,
    onCancelEdit,
  } = props;
  const meta = PLATFORM_META[platform];
  const job = props.job ?? null;

  return (
    <div className="border-editorial-line bg-editorial-3 flex flex-col gap-2 rounded-xl border p-3 transition-all">
      <div className="flex items-center gap-3">
        <PlatformIdentity platform={platform} t={t} />

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

      <SyncProgress job={job} t={t} />
    </div>
  );
}

/**
 * Live progress bar for an in-flight (or just-finished) library sync. Renders
 * nothing when there is no job or the last job succeeded silently.
 */
function SyncProgress({
  job,
  t,
}: {
  job: LibrarySyncJob | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (!job) return null;
  const isActive = job.status === "pending" || job.status === "running";

  if (job.status === "failed") {
    return (
      <p className="text-xs text-red-400">
        {t("syncFailed", { error: job.errorMessage ?? "" })}
      </p>
    );
  }

  if (job.status === "succeeded") {
    if (job.total === 0) {
      return (
        <p className="text-editorial-muted text-xs">
          {job.privateProfile ? t("syncPrivateProfile") : t("syncEmpty")}
        </p>
      );
    }
    return (
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-editorial-muted flex min-w-0 items-center gap-1.5">
          <Icon icon="lucide:check-circle" className="h-3.5 w-3.5 shrink-0 text-green-500" />
          <span className="truncate">
            {t("syncResult", { matched: job.matched, total: job.total })}
            {job.imported > 0 ? ` · ${t("syncImportedShort", { imported: job.imported })}` : ""}
          </span>
        </span>
        <Link
          href="/library"
          className="text-editorial-accent shrink-0 font-medium hover:underline"
        >
          {t("viewLibrary")} →
        </Link>
      </div>
    );
  }

  if (!isActive) return null;

  const total = job.total || 0;
  const done = Math.max(job.processed, job.imported);
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null;
  const phaseLabel =
    job.phase === "importing" && job.currentItem
      ? t("syncImportingGame", { game: job.currentItem })
      : t(`syncPhase.${job.phase}`);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-editorial-muted flex items-center justify-between text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon icon="lucide:loader-2" className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span className="truncate">{phaseLabel}</span>
        </span>
        <span className="shrink-0">
          {total > 0 ? t("syncCount", { processed: done, total }) : ""}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="from-editorial-accent h-full rounded-full bg-gradient-to-r to-palette-accent-500 transition-all duration-500"
          style={{ width: pct !== null ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function PlatformIdentity({
  platform,
  t,
}: {
  platform: GamingPlatform;
  t: (key: string) => string;
}) {
  const meta = PLATFORM_META[platform];

  return (
    <div className="flex w-28 shrink-0 items-center gap-2 sm:w-32">
      <Icon icon={meta.icon} className={`h-6 w-6 shrink-0 ${meta.color}`} />
      <span className="truncate text-sm font-medium text-white/85">{t(`names.${platform}`)}</span>
    </div>
  );
}

function EditingRow({
  platform,
  authType,
  editValue,
  saving,
  t,
  onEditValueChange,
  onSave,
  onCancel,
}: {
  platform: GamingPlatform;
  authType: string;
  editValue: string;
  saving: boolean;
  t: (key: string) => string;
  onEditValueChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
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
        className="border-editorial-line bg-editorial-2 placeholder:text-editorial-muted focus-visible:border-editorial-accent focus-visible:ring-editorial-accent/15 h-9 flex-1 text-base text-white transition-colors hover:border-white/20 focus-visible:ring-2 focus-visible:ring-offset-0"
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
  platform,
  linked,
  saving,
  syncing,
  job,
  t,
  onStartEdit,
  onSyncLibrary,
  onToggleVisibility,
  onRemove,
}: PlatformRowProps) {
  const meta = PLATFORM_META[platform];
  const { authType } = meta;
  const isConnected = !!linked;
  const displayName = linked?.platformUsername ?? linked?.externalId ?? null;

  const handleOAuthConnect = () => {
    const routes: Partial<Record<GamingPlatform, string>> = {
      steam: "/api/auth/steam",
      xbox: "/api/auth/xbox",
      epic: "/api/auth/epic",
      discord: "/api/auth/discord",
      battlenet: "/api/auth/battlenet",
      itch: "/api/auth/itch",
    };
    const route = routes[platform];
    if (route) {
      // Come back to the page the connect was started from (e.g. Connections)
      // instead of the hardcoded profile page.
      const returnTo = encodeURIComponent(window.location.pathname);
      window.location.href = `${route}?returnTo=${returnTo}`;
    }
  };

  const connectIcon =
    authType === "oauth" ? "lucide:log-in" : authType === "npsso" ? "lucide:key" : "lucide:plus";
  const handleConnect = authType === "oauth" ? handleOAuthConnect : onStartEdit;

  const manualOnlyPlatforms: GamingPlatform[] = ["ubisoft", "ea"];
  const showManualHint = manualOnlyPlatforms.includes(platform);
  // Connect-only platforms (category 2): OAuth link works but no library sync
  // (Epic/Battle.net: no owned-games API for non-partners; itch: OAuth scopes
  // don't expose the purchased library).
  const syncUnavailablePlatforms: GamingPlatform[] = ["epic", "battlenet", "itch"];
  const showSyncUnavailable = isConnected && syncUnavailablePlatforms.includes(platform);
  const canSync = isConnected && isSyncablePlatform(platform);
  const isRunning = job?.status === "pending" || job?.status === "running";
  const syncBusy = syncing || isRunning;

  return (
    <div className="flex flex-1 items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-editorial-muted flex items-center gap-1.5 text-sm">
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
          <span className="text-editorial-muted text-xs">
            {t("lastSyncedAt", { when: formatRelative(linked.lastSyncedAt) })}
          </span>
        )}
        {showSyncUnavailable && (
          <span className="text-editorial-muted flex items-center gap-1 text-xs">
            <Icon icon="lucide:info" className="h-3 w-3 shrink-0" />
            {t("syncUnavailable")}
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {!isConnected && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleConnect}
            className="hover:bg-editorial-accent/12 hover:text-editorial-accent min-h-[44px] min-w-[44px] text-white/70"
          >
            <Icon icon={connectIcon} className="h-4 w-4" />
          </Button>
        )}
        {isConnected && authType === "manual" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartEdit}
            className="hover:bg-editorial-accent/12 hover:text-editorial-accent min-h-[44px] min-w-[44px] text-white/70"
          >
            <Icon icon="lucide:pencil" className="h-4 w-4" />
          </Button>
        )}
        {canSync && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => isSyncablePlatform(platform) && onSyncLibrary(platform)}
            disabled={syncBusy || saving}
            className="hover:bg-editorial-accent/12 hover:text-editorial-accent min-h-[44px] min-w-[44px] text-white/70"
            title={t("syncLibrary")}
          >
            <Icon
              icon={syncBusy ? "lucide:loader-2" : "lucide:refresh-cw"}
              className={`h-4 w-4 ${syncBusy ? "animate-spin" : ""}`}
            />
          </Button>
        )}
        {isConnected && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleVisibility}
            disabled={saving}
            className="hover:bg-editorial-accent/12 hover:text-editorial-accent min-h-[44px] min-w-[44px] text-white/70"
            title={linked?.isPublic ? t("makePrivate") : t("makePublic")}
          >
            <Icon icon={linked?.isPublic ? "lucide:eye" : "lucide:eye-off"} className="h-4 w-4" />
          </Button>
        )}
        {isConnected && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            disabled={saving}
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
