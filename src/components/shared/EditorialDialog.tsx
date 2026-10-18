"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
 * by ancestors using backdrop-filter. Closes on Escape and overlay click.
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

  useEffect(() => {
    setMounted(true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl",
          SURFACES[variant],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
