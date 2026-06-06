"use client";

/**
 * AuthCard : chrome partagé des cartes d'authentification au look éditorial
 * (DA sombre). Factorise le panneau + l'en-tête (icône optionnelle, titre
 * display, description) utilisés par tous les formulaires /auth.
 *
 * Style : tokens éditoriaux (`bg-editorial-2`, `border-editorial-line`,
 * `text-editorial-muted`, `text-editorial-accent`) + `font-display`. Pas de
 * backdrop-blur (cf refonte éditoriale).
 */

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";

type AuthIconVariant = "accent" | "success" | "danger";

const ICON_VARIANTS: Record<AuthIconVariant, string> = {
  accent: "bg-editorial-accent/15 text-editorial-accent",
  success: "bg-emerald-500/15 text-emerald-400",
  danger: "bg-red-500/15 text-red-400",
};

interface AuthCardProps {
  /** Icône Iconify affichée dans un badge rond au-dessus du titre. */
  icon?: string;
  iconVariant?: AuthIconVariant;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export function AuthCard({
  icon,
  iconVariant = "accent",
  title,
  description,
  children,
}: AuthCardProps) {
  return (
    <div className="w-full rounded-2xl border border-editorial-line bg-editorial-2 p-6 shadow-2xl shadow-black/40 sm:p-8">
      <div className="space-y-6">
        <div className="space-y-4 text-center">
          {icon && (
            <div
              className={`mx-auto flex size-16 items-center justify-center rounded-full ${ICON_VARIANTS[iconVariant]}`}
            >
              <Icon icon={icon} className="size-8" aria-hidden />
            </div>
          )}
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            {description && (
              <p className="text-sm text-editorial-muted sm:text-base">{description}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// Classes éditoriales partagées par les champs/boutons des formulaires auth.
export const AUTH_INPUT_CLASS =
  "h-12 rounded-xl border-editorial-line bg-editorial-3 text-base text-white placeholder:text-editorial-muted/70 transition-colors focus-visible:border-editorial-accent focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-rgb,var(--neon-primary)))]/30";

export const AUTH_LABEL_CLASS = "text-sm font-medium text-white/80";

export const AUTH_PRIMARY_BTN_CLASS =
  "h-12 w-full rounded-xl bg-linear-to-r from-neon-secondary to-neon-primary text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90";

export const AUTH_SECONDARY_BTN_CLASS =
  "h-12 w-full rounded-xl border-editorial-line bg-transparent text-base font-semibold text-white hover:bg-white/5 hover:text-white";

export const AUTH_LINK_CLASS =
  "font-semibold text-editorial-accent transition-opacity hover:opacity-80";
