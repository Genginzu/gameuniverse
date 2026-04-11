"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLinkedPlatforms } from "@/hooks/useLinkedPlatforms";
import { useToast } from "@/hooks/use-toast";
import { GAMING_PLATFORMS, type GamingPlatform } from "@/types/linked-platforms";
import { PlatformRow } from "./PlatformRow";

export function LinkedPlatformsSection() {
  const t = useTranslations("settings.platforms");
  const tErrors = useTranslations("settings.errors");
  const { platforms, isLoading, savePlatform, connectPsn, removePlatform } = useLinkedPlatforms();
  const { toast } = useToast();
  const [editingPlatform, setEditingPlatform] = useState<GamingPlatform | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const linkedMap = new Map(platforms.map((p) => [p.platform, p]));

  const cancelEdit = () => {
    setEditingPlatform(null);
    setEditValue("");
  };

  const handleSaveManual = async () => {
    if (!editingPlatform || !editValue.trim()) return;
    setSaving(true);
    try {
      await savePlatform(editingPlatform, editValue.trim());
      toast({ title: t("saved") });
      cancelEdit();
    } catch {
      toast({ title: tErrors("updateFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectPsn = async () => {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await connectPsn(editValue.trim());
      toast({ title: t("saved") });
      cancelEdit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : tErrors("updateFailed");
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (platform: GamingPlatform) => {
    setSaving(true);
    try {
      await removePlatform(platform);
      toast({ title: t("removed") });
    } catch {
      toast({ title: tErrors("updateFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl bg-white/40 backdrop-blur-xl dark:bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center">
          <div className="rounded-xl bg-cyan-100 p-2 dark:bg-cyan-900/30">
            <Icon icon="lucide:gamepad-2" className="h-4 w-4 text-cyan-600 sm:h-5 sm:w-5 dark:text-cyan-400" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t("description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {isLoading ? (
          <PlatformsSkeleton />
        ) : (
          GAMING_PLATFORMS.map((platform) => (
            <PlatformRow
              key={platform}
              platform={platform}
              linked={linkedMap.get(platform) ?? null}
              isEditing={editingPlatform === platform}
              editValue={editValue}
              saving={saving}
              t={t}
              onStartEdit={() => {
                setEditingPlatform(platform);
                setEditValue(linkedMap.get(platform)?.platformUsername ?? "");
              }}
              onCancelEdit={cancelEdit}
              onEditValueChange={setEditValue}
              onSaveManual={handleSaveManual}
              onConnectPsn={handleConnectPsn}
              onRemove={() => handleRemove(platform)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PlatformsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200/50 dark:bg-slate-700/30" />
      ))}
    </div>
  );
}
