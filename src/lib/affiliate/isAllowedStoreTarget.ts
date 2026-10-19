function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function hostOf(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}

/**
 * Builds the redirect allowlist from store website URLs (e.g. "https://www.amazon.fr" -> "amazon.fr").
 */
export function buildAllowedHosts(websiteUrls: ReadonlyArray<string | null | undefined>): string[] {
  const hosts = websiteUrls
    .map((url) => (url ? hostOf(url) : null))
    .filter((host): host is string => !!host);
  return [...new Set(hosts)];
}

/**
 * Anti open-redirect guard: the target must be http(s), carry no credentials and
 * live on an allowlisted host or one of its subdomains.
 */
export function isAllowedStoreTarget(target: string, allowedHosts: ReadonlyArray<string>): boolean {
  const host = hostOf(target);
  if (!host) return false;
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}
