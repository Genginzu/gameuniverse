/** Extracts the YouTube video id from a watch (`?v=`) or short (`youtu.be/`) URL. */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const id = parsed.searchParams.get("v") ?? parsed.pathname.replace(/^\//, "");
    return id || null;
  } catch {
    return null;
  }
}

export function buildYouTubeThumbnail(url: string, fallback?: string): string | undefined {
  const id = extractYouTubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : fallback;
}

export function buildYouTubeEmbedSrc(url: string, autoplay = false): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  const query = autoplay ? "?autoplay=1&rel=0" : "?rel=0";
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}${query}`;
}
