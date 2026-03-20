/**
 * Iconify-based icon utilities.
 *
 * Uses the public Iconify API for search (200k+ icons, zero bundle cost)
 * and @iconify/react for rendering.
 *
 * Icon names follow the Iconify format: "prefix:name" (e.g. "mdi:home").
 */

const ICONIFY_API = "https://api.iconify.design";

export interface IconSearchResult {
  name: string;
}

/**
 * Search icons via the Iconify public API.
 * Returns an array of icon names in "prefix:name" format.
 */
export async function searchIcons(query: string, limit = 48): Promise<IconSearchResult[]> {
  if (!query.trim()) return [];

  const url = `${ICONIFY_API}/search?query=${encodeURIComponent(query)}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const icons: string[] = data.icons ?? [];
    return icons.map((name) => ({ name }));
  } catch {
    return [];
  }
}
