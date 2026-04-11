"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLinkedPlatforms } from "@/hooks/useLinkedPlatforms";
import { useToast } from "@/hooks/use-toast";
import {
  GAMING_PLATFORMS,
  PLATFORM_META,
  type GamingPlatform,
} from "@/types/linked-platforms";

export function LinkedPlatformsSection() {
  const t = useTranslations("settings.platforms");
  const tErrors = useTranslations("settings.errors");
  const { platforms, isLoading, savePlatform, removePlatform } = useLinkedPlatforms();
  const { toast } = useToast();
  const [editingPlatform, setEditingPlatform] = useState<GamingPlatform | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const linkedMap = new Map(platforms.map((p) => [p.platform, p.platformUsername]));

  const startEdit = (platform: GamingPlatform) => {
    setEditingPlatform(platform);
    setEditValue(linkedMap.get(platform) ?? "");
  };

  const cancelEdit = () => {
    setEditingPlatform(null);
    setEditValue("");
  };

  const handleSave = async () => {
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
            <Icon
              icon="lucide:gamepad-2"
              className="h-4 w-4 text-cyan-600 sm:h-5 sm:w-5 dark:text-cyan-400"
            />
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
          GAMING_PLATFORMS.map((platform) => {
            const meta = PLATFORM_META[platform];
            const username = linkedMap.get(platform);
            const isEditing = editingPlatform === platform;

            return (
              <div
                key={platform}
                className="flex items-center gap-3 rounded-xl bg-white/30 p-3 transition-all dark:bg-slate-700/30"
              >
                <Icon icon={meta.icon} className={`h-6 w-6 shrink-0 ${meta.color}`} />
                <span className="w-24 shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t(`names.${platform}`)}
                </span>

                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={t("usernamePlaceholder")}
                      className="h-9 flex-1 text-base"
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSave} disabled={saving || !editValue.trim()}>
                      <Icon icon="lucide:check" className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <Icon icon="lucide:x" className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {username || t("notLinked")}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(platform)}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        <Icon icon={username ? "lucide:pencil" : "lucide:plus"} className="h-4 w-4" />
                      </Button>
                      {username && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(platform)}
                          disabled={saving}
                          className="min-h-[44px] min-w-[44px] text-red-500 hover:text-red-600"
                        >
                          <Icon icon="lucide:trash-2" className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
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
