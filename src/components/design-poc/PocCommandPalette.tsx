"use client";

/**
 * Command palette (Cmd+K) — modale de recherche unifiée et raccourcis.
 *
 * Mock côté contenu mais raccourci ⌘K / Ctrl+K opérationnel pour la démo.
 * Filtre simple par texte sur les items mockés.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface PaletteItem {
  type: "game" | "character" | "page" | "action";
  label: string;
  sub?: string;
  href?: string;
  icon: string;
  image?: string;
  shortcut?: string;
}

const ITEMS: PaletteItem[] = [
  // Pages
  { type: "page", label: "Home", icon: "fa:home", href: "/", shortcut: "G H" },
  { type: "page", label: "Games", icon: "fa:dice", href: "/games", shortcut: "G G" },
  { type: "page", label: "My library", icon: "fa:gamepad", href: "/library", shortcut: "G L" },
  { type: "page", label: "Players", icon: "fa:user-friends", href: "/players", shortcut: "G P" },
  { type: "page", label: "Esport live", icon: "fa:bolt", href: "/esport/live" },
  { type: "page", label: "Tournaments", icon: "mdi:trophy-outline", href: "/esport/tournaments" },
  { type: "page", label: "My profile", icon: "fa:user", href: "/profile" },
  { type: "page", label: "Settings", icon: "lucide:settings", href: "/settings" },
  // Games (mock)
  {
    type: "game",
    label: "God of War Ragnarök",
    sub: "PS5 · 2022",
    icon: "fa:dice",
    image: "https://images.igdb.com/igdb/image/upload/t_cover_big/coba3d.jpg",
    href: "/design-poc/game-detail?slug=god-of-war-ragnarok",
  },
  {
    type: "game",
    label: "Cyberpunk 2077",
    sub: "PC, PS5, XSX · 2020",
    icon: "fa:dice",
    image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
    href: "/design-poc/game-detail?game=cyberpunk",
  },
  {
    type: "game",
    label: "Valorant",
    sub: "PC · Riot Games",
    icon: "fa:dice",
    image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0g.webp",
    href: "/design-poc/game-detail?game=valorant",
  },
  // Characters
  { type: "character", label: "Kratos", sub: "God of War", icon: "fa:mask" },
  { type: "character", label: "V", sub: "Cyberpunk 2077", icon: "fa:mask" },
  // Actions
  { type: "action", label: "Add a game to my library", icon: "lucide:plus" },
  { type: "action", label: "Create a new collection", icon: "fa:layer-group" },
  { type: "action", label: "Sign out", icon: "lucide:log-out" },
];

interface PocCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export function PocCommandPalette({ open, onOpenChange, locale }: PocCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return ITEMS;
    const q = query.toLowerCase();
    return ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sub?.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Petit délai pour laisser la modale apparaître avant de focuser
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Raccourci ⌘K / Ctrl+K + Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  const groups: { type: PaletteItem["type"]; label: string }[] = [
    { type: "page", label: "Pages" },
    { type: "game", label: "Games" },
    { type: "character", label: "Characters" },
    { type: "action", label: "Actions" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-md"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1a0f2e]/95 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <Icon icon="lucide:search" className="size-5 text-[var(--poc-accent-400)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything…"
            className="poc-display flex-1 bg-transparent text-xl text-white outline-none placeholder:text-zinc-500"
          />
          <kbd className="poc-mono rounded border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-zinc-500">No result for "{query}"</p>
          ) : (
            groups.map((group) => {
              const items = filtered.filter((i) => i.type === group.type);
              if (items.length === 0) return null;
              return (
                <div key={group.type} className="mb-2">
                  <p className="poc-kicker px-3 py-2">{group.label}</p>
                  <ul>
                    {items.map((item, idx) => (
                      <li key={`${group.type}-${idx}`}>
                        <PaletteRow item={item} locale={locale} onClose={() => onOpenChange(false)} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-5 py-2 text-xs text-zinc-500">
          <span className="poc-mono">↑↓ navigate · ↵ select · esc close</span>
          <span className="poc-mono">Cmd+K demo</span>
        </div>
      </div>
    </div>
  );
}

function PaletteRow({
  item,
  locale,
  onClose,
}: {
  item: PaletteItem;
  locale: string;
  onClose: () => void;
}) {
  const content = (
    <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 transition hover:bg-white/5 hover:text-white">
      {item.image ? (
        <Image
          src={item.image}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/5">
          <Icon icon={item.icon} className="size-4 text-[var(--poc-accent-400)]" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm">{item.label}</p>
        {item.sub && <p className="poc-mono truncate text-xs text-zinc-500">{item.sub}</p>}
      </div>
      {item.shortcut && (
        <kbd className="poc-mono rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500">
          {item.shortcut}
        </kbd>
      )}
    </div>
  );

  if (item.href) {
    const href = item.href.startsWith("/design-poc")
      ? `/${locale}${item.href}`
      : `/${locale}${item.href}`;
    return (
      <Link href={href} onClick={onClose} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClose} className="block w-full text-left">
      {content}
    </button>
  );
}
