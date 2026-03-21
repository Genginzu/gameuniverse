"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useCropEditor } from "@/hooks/useCropEditor";
import { cropCanvas } from "@/lib/utils/cropCanvas";
import { ASPECT_RATIO_VALUES, type CropAspectRatio, type CropParams } from "@/types/crop";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  CROP_OUTPUT_FORMAT,
  CROP_OUTPUT_QUALITY,
} from "@/types/upload";

interface CropEditorProps {
  imageSrc: string;
  aspectRatio: CropAspectRatio;
  outputSize: { width: number; height: number };
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  disabled?: boolean;
}

/** Fixed width for avatar (1:1) — banner uses full container width */
const AVATAR_VIEWPORT_WIDTH = 280;

function getViewportSize(aspectRatio: CropAspectRatio, containerWidth: number) {
  const ratio = ASPECT_RATIO_VALUES[aspectRatio];
  // Avatar: fixed width; Banner: fill the container
  const w = aspectRatio === "1:1" ? AVATAR_VIEWPORT_WIDTH : Math.max(containerWidth, 200);
  return { width: w, height: Math.round(w / ratio) };
}

/**
 * Compute the base scale so the image fills the viewport at zoom 1×.
 * We pick the larger of (viewportW / imageW, viewportH / imageH)
 * so the image covers the entire viewport without empty space.
 */
function computeBaseScale(
  imageSize: { width: number; height: number },
  viewportSize: { width: number; height: number }
): number {
  const scaleX = viewportSize.width / imageSize.width;
  const scaleY = viewportSize.height / imageSize.height;
  return Math.max(scaleX, scaleY);
}

export function CropEditor({
  imageSrc,
  aspectRatio,
  outputSize,
  onConfirm,
  onCancel,
  disabled = false,
}: CropEditorProps) {
  const t = useTranslations("upload.crop");
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [containerWidth, setContainerWidth] = useState(480);

  // Measure container width so the banner crop zone fills it
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Subtract padding (p-4 = 16px each side)
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const viewportSize = getViewportSize(aspectRatio, containerWidth);
  const isAvatar = aspectRatio === "1:1";

  // Base scale so the image fills the viewport at zoom 1×
  const baseScale = computeBaseScale(imageSize, viewportSize);
  // The "scaled" image size is what the hook sees as the image dimensions
  const scaledImageSize = {
    width: imageSize.width * baseScale,
    height: imageSize.height * baseScale,
  };

  // Load the source image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.onerror = () => setError(t("errorCanvasFailed"));
    img.src = imageSrc;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, t]);

  const { state, handlers, setZoom, getCropParams } = useCropEditor({
    imageSize: scaledImageSize,
    viewportSize,
    aspectRatio: ASPECT_RATIO_VALUES[aspectRatio],
  });

  const handleConfirm = useCallback(async () => {
    if (!imageRef.current || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      // getCropParams returns coordinates in the scaled image space.
      // Divide by baseScale to convert back to original source pixels.
      const scaled = getCropParams();
      const sourceCrop: CropParams = {
        sourceX: scaled.sourceX / baseScale,
        sourceY: scaled.sourceY / baseScale,
        sourceWidth: scaled.sourceWidth / baseScale,
        sourceHeight: scaled.sourceHeight / baseScale,
      };
      const blob = await cropCanvas(imageRef.current, sourceCrop, {
        width: outputSize.width,
        height: outputSize.height,
        format: CROP_OUTPUT_FORMAT,
        quality: CROP_OUTPUT_QUALITY,
      });
      onConfirm(blob);
    } catch {
      setError(t("errorCanvasFailed"));
    } finally {
      setConfirming(false);
    }
  }, [baseScale, confirming, getCropParams, onConfirm, outputSize, t]);

  const isDisabled = disabled || confirming;

  return (
    <div
      ref={containerRef}
      className={`glass-card flex flex-col items-center gap-4 rounded-2xl p-4 transition-all duration-300 ${
        isDisabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("title")}</h3>

      {/* Viewport — the crop zone */}
      {imageLoaded && (
        <div
          className="relative cursor-grab overflow-hidden rounded-xl border-2 border-white/30 shadow-lg dark:border-slate-600/50"
          style={{ width: viewportSize.width, height: viewportSize.height }}
          {...handlers}
        >
          {/* Transformed image — baseScale fits image to viewport, zoom adds user zoom */}
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="pointer-events-none absolute top-0 left-0 max-w-none select-none"
            style={{
              width: imageSize.width,
              height: imageSize.height,
              transform: `translate(${state.x}px, ${state.y}px) scale(${baseScale * state.zoom})`,
              transformOrigin: "0 0",
            }}
          />

          {/* Subtle inner border to highlight crop zone */}
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-white/40 dark:ring-white/20" />
        </div>
      )}

      {/* Zoom slider */}
      <div className={`flex items-center gap-3 ${isAvatar ? "w-full max-w-xs" : "w-full"}`}>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("zoom")}</span>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={state.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          disabled={isDisabled}
          className="crop-zoom-slider h-2 flex-1 cursor-pointer appearance-none rounded-full bg-linear-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc] outline-hidden"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-center text-xs text-red-500 dark:text-red-400">{error}</p>}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDisabled}
          className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc] px-4 py-2 text-xs font-medium text-white shadow-md transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon icon="lucide:check" className="h-3.5 w-3.5" />
          {t("confirm")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isDisabled}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/40 px-4 py-2 text-xs font-medium text-gray-700 transition-all duration-300 hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800/50 dark:text-gray-300 dark:hover:bg-slate-700/60"
        >
          <Icon icon="lucide:x" className="h-3.5 w-3.5" />
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
