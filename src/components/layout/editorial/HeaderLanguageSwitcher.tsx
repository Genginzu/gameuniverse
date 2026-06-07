"use client";

/**
 * HeaderLanguageSwitcher : sélecteur de langue compact pour le header
 * éditorial. Navigue vers la même URL avec la nouvelle locale (préservation
 * du pathname et des params via next-intl).
 *
 * - Trigger : icône `mdi:translate` + code langue UPPERCASE + chevron
 * - Dropdown : listbox custom (pas Radix), drapeau + nom + check si actif
 * - A11y : `aria-haspopup="listbox"`, `role="listbox"`, `role="option"` +
 *   `aria-selected`, navigation clavier (↑/↓/Home/End/Enter/Escape)
 * - Fermeture : sélection, clic en dehors, Escape
 *
 * Voir docs/design/editorial-refonte-plan.md section 5.5.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import FR from "country-flag-icons/react/3x2/FR";
import US from "country-flag-icons/react/3x2/US";

import { usePathname, useRouter } from "@/i18n/navigation";

type Locale = "fr" | "en";

interface LocaleEntry {
  code: Locale;
  /** Code uppercase affiché dans le trigger ("FR", "EN"). */
  short: string;
  /** Composant React pour le drapeau. */
  Flag: React.ComponentType<{ className?: string; title?: string }>;
}

const LOCALES: readonly LocaleEntry[] = [
  { code: "fr", short: "FR", Flag: FR },
  { code: "en", short: "EN", Flag: US },
];

interface HeaderLanguageSwitcherProps {
  className?: string;
}

export function HeaderLanguageSwitcher({ className = "" }: HeaderLanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("editorial.languageSwitcher");
  const tLangs = useTranslations("editorial.languages");

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const currentEntry = useMemo(
    () => LOCALES.find((l) => l.code === locale) ?? LOCALES[0],
    [locale]
  );
  const currentLanguageName = tLangs(locale);

  // ----------------------------------------------------------------------
  // Open / close
  // ----------------------------------------------------------------------

  const open = () => {
    setIsOpen(true);
    // Highlight la langue actuelle au départ
    const idx = LOCALES.findIndex((l) => l.code === locale);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  };
  const close = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // ----------------------------------------------------------------------
  // Click outside
  // ----------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      close();
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // ----------------------------------------------------------------------
  // Selection
  // ----------------------------------------------------------------------

  const handleSelect = (next: Locale) => {
    close();
    if (next !== locale) {
      router.push(pathname, { locale: next });
    }
    triggerRef.current?.focus();
  };

  // ----------------------------------------------------------------------
  // Keyboard navigation
  // ----------------------------------------------------------------------

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((i) => (i + 1) % LOCALES.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((i) => (i - 1 + LOCALES.length) % LOCALES.length);
        break;
      case "Home":
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case "End":
        event.preventDefault();
        setHighlightedIndex(LOCALES.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(LOCALES[highlightedIndex].code);
        }
        break;
    }
  };

  // Focus la liste quand elle s'ouvre, pour que les flèches fonctionnent
  useEffect(() => {
    if (isOpen) {
      listRef.current?.focus();
    }
  }, [isOpen]);

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------

  return (
    <div className={`header-language-switcher ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={t("currentLanguage", { language: currentLanguageName })}
        className="header-language-trigger"
        data-testid="header-language-trigger"
      >
        <Icon icon="mdi:translate" className="size-4 shrink-0" aria-hidden />
        <span className="header-language-trigger-code">{currentEntry.short}</span>
        <Icon
          icon="mdi:chevron-down"
          className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={t("listboxAriaLabel")}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="header-language-listbox"
          data-testid="header-language-listbox"
        >
          {LOCALES.map((entry, index) => {
            const isSelected = entry.code === locale;
            const isHighlighted = index === highlightedIndex;
            const FlagComponent = entry.Flag;
            const name = tLangs(entry.code);
            return (
              <li
                key={entry.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(entry.code)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`header-language-option ${isSelected ? "is-selected" : ""} ${
                  isHighlighted ? "is-highlighted" : ""
                }`.trim()}
                data-locale={entry.code}
              >
                <FlagComponent className="header-language-option-flag" title={name} />
                <span className="flex-1">{name}</span>
                {isSelected && (
                  <Icon icon="mdi:check" className="size-4 shrink-0" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
