"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface ProgressRingProps {
  progressPercent: number; // 0-100
  level: number;
  size?: number; // default 120
  children?: ReactNode; // avatar goes here
}

const STROKE_WIDTH = 4;
const BORDER_RADIUS = 16; // matches rounded-2xl (~1rem)

/**
 * Pure helper — computes the SVG stroke-dashoffset for a rounded-rect border.
 * The perimeter of a rounded rect = 2*(w - 2r) + 2*(h - 2r) + 2*PI*r
 * where r = corner radius, w/h = rect dimensions.
 * Exported for property-based testing (Property 6).
 */
export function computeArcOffset(
  progressPercent: number,
  size: number,
  strokeWidth: number = STROKE_WIDTH,
  borderRadius: number = BORDER_RADIUS
): { circumference: number; offset: number } {
  const _inset = strokeWidth / 2;
  const rectW = size - strokeWidth;
  const rectH = size - strokeWidth;
  const r = Math.min(borderRadius, rectW / 2, rectH / 2);

  // Perimeter of a rounded rectangle
  const straightH = Math.max(0, rectW - 2 * r);
  const straightV = Math.max(0, rectH - 2 * r);
  const circumference = 2 * straightH + 2 * straightV + 2 * Math.PI * r;

  const clamped = Math.max(0, Math.min(100, progressPercent));
  const offset = circumference * (1 - clamped / 100);
  return { circumference, offset };
}

export function ProgressRing({ progressPercent, level, size = 120, children }: ProgressRingProps) {
  const t = useTranslations("achievements");
  const { circumference, offset } = computeArcOffset(progressPercent, size);

  const inset = STROKE_WIDTH / 2;
  const rectW = size - STROKE_WIDTH;
  const rectH = size - STROKE_WIDTH;
  const r = Math.min(BORDER_RADIUS, rectW / 2, rectH / 2);
  const gradientId = `progress-gradient-${size}-${level}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG rounded-rect border progress */}
        <svg width={size} height={size} className="absolute inset-0" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" />
              <stop offset="50%" stopColor="rgb(147, 51, 234)" />
              <stop offset="100%" stopColor="rgb(126, 34, 206)" />
            </linearGradient>
          </defs>

          {/* Track (subtle white/gray border) */}
          <rect
            x={inset}
            y={inset}
            width={rectW}
            height={rectH}
            rx={r}
            ry={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-white/60 dark:text-slate-700/60"
          />

          {/* Progress arc — neon gradient overlay */}
          <rect
            x={inset}
            y={inset}
            width={rectW}
            height={rectH}
            rx={r}
            ry={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        {/* Children (avatar) centered — no extra border needed */}
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        )}
      </div>

      {/* Level label */}
      <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">
        {t("level", { level })}
      </span>
    </div>
  );
}
