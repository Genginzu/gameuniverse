"use client";

/**
 * EditorialSelectMenu : remplaçant éditorial du `<select>` natif (tri,
 * filtres, champs de formulaire simples). Bouton déclencheur + liste
 * déroulante sombre, option active en accent avec coche. Même DA que
 * `GameSortMenu`.
 */

import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

import { useDismissableLayer } from "@/hooks/useDismissableLayer";

export interface EditorialSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface EditorialSelectMenuProps<T extends string> {
  value: T;
  options: readonly EditorialSelectOption<T>[];
  onChange: (value: T) => void;
  /** Nom accessible du déclencheur et de la liste. */
  ariaLabel: string;
  /** Préfixe affiché avant la valeur à partir de `sm:` (ex « Trier par »). */
  label?: string;
  /** Texte affiché tant qu'aucune option ne correspond à `value`. */
  placeholder?: string;
  /** Occupe toute la largeur à tous les breakpoints (champs de formulaire). */
  fullWidth?: boolean;
}

export function EditorialSelectMenu<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  label,
  placeholder,
  fullWidth = false,
}: EditorialSelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const match = options.find((option) => option.value === value);
  const selected = match ?? (placeholder ? undefined : options[0]);

  useDismissableLayer(containerRef, { open, onDismiss: () => setOpen(false) });

  const widthClass = fullWidth ? "w-full" : "w-full sm:w-auto";

  return (
    <div ref={containerRef} className={`relative ${widthClass}`}>
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `${ariaLabel}, ${selected.label}` : ariaLabel}
        className={`group bg-editorial-2 border-editorial-line hover:bg-editorial-3 hover:border-editorial-accent/45 aria-expanded:bg-editorial-3 aria-expanded:border-editorial-accent/45 inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-white transition sm:text-base ${widthClass}`}
      >
        {selected?.icon && <Icon icon={selected.icon} className="size-4 shrink-0 sm:size-5" />}
        {label && (
          <span className="text-editorial-muted hidden font-medium sm:inline">{label}</span>
        )}
        <span
          className={`flex-1 truncate text-left ${
            selected ? "text-editorial-accent" : "text-editorial-muted font-medium"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <Icon
          icon="mdi:chevron-down"
          className="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180"
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`bg-editorial-2 border-editorial-line absolute top-[calc(100%+0.5rem)] right-0 z-20 max-h-72 w-full overflow-y-auto rounded-xl border shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${
            fullWidth ? "" : "sm:w-56"
          }`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  active
                    ? "text-editorial-accent bg-editorial-accent/10"
                    : "text-editorial-muted hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {option.icon && <Icon icon={option.icon} className="size-4 shrink-0" aria-hidden />}
                <span className="flex-1">{option.label}</span>
                {active && <Icon icon="mdi:check" className="size-4 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
