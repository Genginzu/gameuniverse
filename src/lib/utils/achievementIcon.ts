const LEGACY_ICON_MAP: Record<string, string> = {
  BookOpen: "lucide:book-open",
  Library: "lucide:library",
  BookMarked: "lucide:book-marked",
  Clock: "lucide:clock",
  Timer: "lucide:timer",
  Hourglass: "lucide:hourglass",
  Star: "lucide:star",
  MessageSquare: "lucide:message-square",
  PenLine: "lucide:pen-line",
  UserPlus: "lucide:user-plus",
  Users: "lucide:users",
  FolderPlus: "lucide:folder-plus",
  Layers: "lucide:layers",
  Grid3X3: "lucide:grid-3x3",
};

const FALLBACK_ICON = "lucide:trophy";

/**
 * Seeded achievements store a Lucide component name ("BookOpen"), while icons
 * picked in the admin are already Iconify ids ("mdi:trophy"): accept both.
 */
export function resolveAchievementIcon(icon: string | null | undefined): string {
  if (!icon) return FALLBACK_ICON;
  if (icon.includes(":")) return icon;
  return LEGACY_ICON_MAP[icon] ?? FALLBACK_ICON;
}
