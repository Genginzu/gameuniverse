import type { AffiliateEnv, AffiliateNetwork, AffiliateStoreConfig } from "@/types/affiliate";

/**
 * Public affiliate identifiers used when a store has no explicit `affiliate_tag`.
 * Only public identifiers live here; network API secrets are never part of a link.
 */
export const AFFILIATE_ENV_TAGS: Record<AffiliateNetwork, string | null> = {
  amazon: "AMAZON_ASSOCIATES_TAG",
  impact: "IMPACT_SITE_ID",
  partnerize: "PARTNERIZE_CAMREF",
  awin: "AWIN_PUBLISHER_ID",
  cj: "CJ_PUBLISHER_ID",
  custom: null,
};

/** Templates applied when a store has no explicit `affiliate_url_template`. */
export const DEFAULT_AFFILIATE_TEMPLATES: Partial<Record<AffiliateNetwork, string>> = {
  amazon: "?tag={tag}",
};

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function resolveTag(config: AffiliateStoreConfig, env: AffiliateEnv): string | null {
  const explicit = config.affiliateTag?.trim();
  if (explicit) return explicit;
  const envKey = config.affiliateNetwork ? AFFILIATE_ENV_TAGS[config.affiliateNetwork] : null;
  return envKey ? env[envKey]?.trim() || null : null;
}

function resolveTemplate(config: AffiliateStoreConfig): string | null {
  const explicit = config.affiliateUrlTemplate?.trim();
  if (explicit) return explicit;
  return config.affiliateNetwork
    ? (DEFAULT_AFFILIATE_TEMPLATES[config.affiliateNetwork] ?? null)
    : null;
}

function replaceToken(source: string, token: string, value: string): string {
  return source.split(token).join(value);
}

/** Query mode: "?tag={tag}&ascsubtag=gu" merges params into the product URL. */
function applyQueryTemplate(rawUrl: URL, template: string, tag: string): string {
  const params = new URLSearchParams(template.slice(1));
  const result = new URL(rawUrl.toString());
  params.forEach((value, key) => {
    result.searchParams.set(key, replaceToken(value, "{tag}", tag));
  });
  return result.toString();
}

/** Wrap mode: "https://network.example/c/{tag}?u={url}" embeds the encoded product URL. */
function applyWrapTemplate(rawUrl: URL, template: string, tag: string): string | null {
  const withTag = replaceToken(template, "{tag}", encodeURIComponent(tag));
  const wrapped = replaceToken(withTag, "{url}", encodeURIComponent(rawUrl.toString()));
  const parsed = parseHttpUrl(wrapped);
  return parsed && parsed.protocol === "https:" ? parsed.toString() : null;
}

/**
 * Builds the final outbound URL for a store product link.
 * Any missing or invalid piece of configuration falls back to the raw URL so a
 * misconfigured store never breaks the purchase link.
 */
export function buildAffiliateUrl(
  config: AffiliateStoreConfig,
  rawUrl: string,
  env: AffiliateEnv = process.env
): string {
  if (!config.affiliateEnabled) return rawUrl;

  const parsedRaw = parseHttpUrl(rawUrl);
  const template = resolveTemplate(config);
  if (!parsedRaw || !template) return rawUrl;

  const tag = resolveTag(config, env);
  if (template.includes("{tag}") && !tag) return rawUrl;

  if (template.startsWith("?")) return applyQueryTemplate(parsedRaw, template, tag ?? "");
  if (!template.includes("{url}")) return rawUrl;
  return applyWrapTemplate(parsedRaw, template, tag ?? "") ?? rawUrl;
}
