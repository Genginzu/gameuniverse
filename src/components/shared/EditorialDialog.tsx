"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useAccentPortalScope } from "./AccentPortalScope";

interface EditorialDialogProps {
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** Use "alertdialog" for confirmations requiring an explicit choice. */
  role?: "dialog" | "alertdialog";
  /** "editorial": dark public design. "admin": light/dark admin back-office theme. */
  variant?: "editorial" | "admin";
  className?: string;
}

const SURFACES = {
  editorial: "border-editorial-line bg-editorial-2 text-white shadow-black/40",
  admin:
    "border-gray-200 bg-white text-gray-900 shadow-black/20 dark:border-gray-700 dark:bg-slate-800 dark:text-white",
} as const;

/**
 * Modal shell (opaque surface, editorial or admin theme).
 * Rendered in a portal on document.body so `fixed` positioning is not trapped
 * by ancestors using backdrop-filter. A dismissable layer: closes on Escape and
 * on a pointer down on the overlay, locks the page scroll and traps the focus.
 */
export function EditorialDialog({
  ariaLabel,
  onClose,
  children,
  role = "dialog",
  variant = "editorial",
  className,
}: EditorialDialogProps) {
  const [mounted, setMounted] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const accentScope = useAccentPortalScope();

  useEffect(() => setMounted(true), []);

  useDismissableLayer(surfaceRef, {
    open: mounted,
    onDismiss: onClose,
    lockScroll: true,
    trapFocus: true,
  });

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        ref={surfaceRef}
        style={accentScope?.style}
        className={cn(
          "max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl",
          SURFACES[variant],
          accentScope?.className,
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
