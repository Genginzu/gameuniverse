"use client";

/**
 * Carte avec halo lumineux qui suit le curseur (style Linear, Resend).
 * Met à jour --poc-mx / --poc-my en CSS vars pour que le radial-gradient
 * du .poc-spotlight bouge avec la souris.
 */

import { useRef, type MouseEvent, type ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "a";
  href?: string;
}

export function SpotlightCard({
  children,
  className = "",
  as: Tag = "div",
  href,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty("--poc-mx", `${x}%`);
    ref.current.style.setProperty("--poc-my", `${y}%`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  const extraProps = Tag === "a" && href ? { href } : {};

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`poc-spotlight ${className}`}
      {...extraProps}
    >
      {children}
    </Component>
  );
}
