import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import {
  REPORT_CONTENT_TYPES,
  buildContentPreview,
  reportableContent,
} from "@/lib/services/reportable-content/registry";
import type {
  ContentReport,
  ReportContentPreview,
  ReportContentType,
  ReportableContentRow,
} from "@/types/report";

const key = (type: ReportContentType, id: string) => `${type}:${id}`;

async function fetchRows(
  table: string,
  select: string,
  ids: string[]
): Promise<ReportableContentRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabaseAdmin().from(table).select(select).in("id", ids);
  if (error) {
    logger.error("Failed to load reported content", { error: error.message, table });
    return [];
  }
  return (data ?? []) as unknown as ReportableContentRow[];
}

function contentIdsOf(reports: ContentReport[], type: ReportContentType): string[] {
  return [...new Set(reports.filter((r) => r.contentType === type).map((r) => r.contentId))];
}

async function loadPartialPreviews(reports: ContentReport[]) {
  const rowsByType = await Promise.all(
    REPORT_CONTENT_TYPES.map((type) => {
      const descriptor = reportableContent(type);
      return fetchRows(descriptor.table, descriptor.previewSelect, contentIdsOf(reports, type));
    })
  );

  const partial = new Map<string, Omit<ReportContentPreview, "authorName">>();
  REPORT_CONTENT_TYPES.forEach((type, index) => {
    for (const row of rowsByType[index]) {
      partial.set(key(type, String(row.id)), buildContentPreview(type, row));
    }
  });
  return partial;
}

async function loadPreviews(reports: ContentReport[]): Promise<Map<string, ReportContentPreview>> {
  const partial = await loadPartialPreviews(reports);
  const authorIds = [
    ...new Set([...partial.values()].map((p) => p.authorId).filter((id): id is string => !!id)),
  ];
  const authors = await fetchRows("profiles", "id, username", authorIds);
  const names = new Map(authors.map((a) => [a.id as string, (a.username as string) ?? null]));

  const result = new Map<string, ReportContentPreview>();
  for (const [k, p] of partial) {
    result.set(k, { ...p, authorName: p.authorId ? (names.get(p.authorId) ?? null) : null });
  }
  return result;
}

const MISSING: ReportContentPreview = {
  exists: false,
  text: null,
  authorId: null,
  authorName: null,
  href: null,
};

/** Attach a content preview to each report (content may have been deleted since). */
export async function withContentPreviews(reports: ContentReport[]): Promise<ContentReport[]> {
  if (reports.length === 0) return reports;
  const previews = await loadPreviews(reports);
  return reports.map((r) => ({
    ...r,
    content: previews.get(key(r.contentType, r.contentId)) ?? MISSING,
  }));
}
