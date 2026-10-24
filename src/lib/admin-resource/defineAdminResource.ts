import type { AdminRawRow, AdminResource, AdminResourceConfig } from "@/types/admin-resource";

const PAGE_SIZE = 20;

export function defineAdminResource<TRow>(config: AdminResourceConfig<TRow>): AdminResource<TRow> {
  const paginated = config.paginated ?? true;
  const localized = config.localized ?? false;
  const basePath = (pathParams: Record<string, string>) =>
    typeof config.path === "function" ? config.path(pathParams) : config.path;

  return {
    listKey: config.listKey,
    keyOf: config.keyOf,
    mapRow: config.mapRow ?? ((raw: AdminRawRow) => raw as TRow),
    paginated,
    localized,
    usage: config.usage ?? false,
    forceDelete: config.forceDelete ?? false,
    basePath,
    listing: {
      path: (context) => basePath(context.pathParams ?? {}),
      defaultFilters: {
        search: "",
        sortBy: config.defaultSort?.field ?? "",
        sortOrder: config.defaultSort?.order ?? "asc",
      },
      revalidate: 0,
      toParams: ({ filters, page }, context) => {
        const search = filters.search.trim();
        if (!paginated) return { search };
        return {
          page,
          limit: PAGE_SIZE,
          search,
          sort_by: filters.sortBy,
          sort_order: filters.sortBy ? filters.sortOrder : undefined,
          locale: localized ? context.locale : undefined,
        };
      },
    },
  };
}

export function adminItemUrl<TRow>(
  resource: AdminResource<TRow>,
  pathParams: Record<string, string>,
  row: TRow,
  suffix = ""
): string {
  return `${resource.basePath(pathParams)}/${encodeURIComponent(resource.keyOf(row))}${suffix}`;
}

export async function readApiError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  return new Error(body.error || `${fallback} (${response.status})`);
}
