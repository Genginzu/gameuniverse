"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { Icon } from "@iconify/react";

/** Extrait l'ID YouTube d'une URL (watch, short, embed) */
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function GameFormVideosTab({ form, t, isIgdbField }: GameFormTabProps) {
  const videos = form.watch("videos");

  const addVideo = () => {
    const current = form.getValues("videos");
    form.setValue("videos", [
      ...current,
      {
        url: "",
        title: "",
        thumbnail_url: "",
        video_type: "",
        display_order: current.length,
        is_featured: false,
      },
    ]);
  };

  const removeVideo = (idx: number) => {
    const current = form.getValues("videos");
    form.setValue(
      "videos",
      current.filter((_, i) => i !== idx)
    );
  };

  /** Auto-génère le thumbnail quand l'URL change */
  const handleUrlChange = (idx: number, url: string) => {
    form.setValue(`videos.${idx}.url`, url);
    const videoId = extractYoutubeId(url);
    if (videoId) {
      form.setValue(
        `videos.${idx}.thumbnail_url`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      );
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("videos")}{" "}
          {isIgdbField && (
            <IgdbFieldIndicator fieldName="videos" isIgdbField={isIgdbField("videos")} />
          )}{" "}
          <span className="font-normal text-gray-400">({videos.length})</span>
        </h3>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addVideo}>
          <Icon icon="fa:plus" className="h-3 w-3" />
          {t("addVideo")}
        </Button>
      </div>

      {videos.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{t("noVideos")}</p>
      ) : (
        <div className="space-y-3">
          {videos.map((_, idx) => (
            <VideoItem
              key={idx}
              idx={idx}
              form={form}
              t={t}
              onUrlChange={handleUrlChange}
              onRemove={removeVideo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Sous-composant pour un item vidéo individuel */
function VideoItem({
  idx,
  form,
  t,
  onUrlChange,
  onRemove,
}: {
  idx: number;
  form: GameFormTabProps["form"];
  t: GameFormTabProps["t"];
  onUrlChange: (idx: number, url: string) => void;
  onRemove: (idx: number) => void;
}) {
  const url = form.watch(`videos.${idx}.url`);
  const thumbnailUrl = form.watch(`videos.${idx}.thumbnail_url`);
  const videoId = url ? extractYoutubeId(url) : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="flex items-start gap-4">
        {/* Thumbnail preview */}
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="h-20 w-32 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            type="url"
            placeholder={t("videoUrlPlaceholder") ?? "https://www.youtube.com/watch?v=..."}
            value={url}
            onChange={(e) => onUrlChange(idx, e.target.value)}
          />
          <Input
            placeholder={t("videoTitlePlaceholder") ?? "Titre de la vidéo"}
            {...form.register(`videos.${idx}.title`)}
          />
        </div>

        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="mt-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          aria-label="Supprimer"
        >
          <Icon icon="fa:times" className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* YouTube embed preview */}
      {videoId && (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={form.watch(`videos.${idx}.title`) || "Video preview"}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
