import type { ListingResource } from "@/types/listing";
import type { DefaultValues, FieldValues } from "react-hook-form";
import type { zodResolver } from "@hookform/resolvers/zod";

export type AdminFormMode = "create" | "edit";

export interface AdminFormConfig<TData extends FieldValues> {
  schema: Parameters<typeof zodResolver>[0];
  /** Collection endpoint; items are edited at `<path>/<key>`. */
  path: string | ((pathParams: Record<string, string>) => string);
  defaultValues: () => DefaultValues<TData>;
  /** Edit key read from the form data (slug, code). Defaults to the `id` option. */
  editKey?: (data: TData) => string;
  toPayload?: (data: TData, mode: AdminFormMode) => unknown;
}

export type SortOrder = "asc" | "desc";

export interface AdminSort {
  field: string;
  order: SortOrder;
}

export interface AdminListFilters {
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
}

export type AdminRawRow = Record<string, unknown>;

export interface AdminResourceConfig<TRow> {
  /** Collection endpoint, e.g. "/api/admin/genres". A function for nested resources. */
  path: string | ((pathParams: Record<string, string>) => string);
  /** Key holding the rows in the list response, e.g. "genres". */
  listKey: string;
  /** Identifier used in item URLs (slug, id or code). */
  keyOf: (row: TRow) => string;
  mapRow?: (raw: AdminRawRow) => TRow;
  defaultSort?: AdminSort;
  /** Defaults to true. Unpaginated resources only send `search`. */
  paginated?: boolean;
  /** Sends the current UI locale with every list request. */
  localized?: boolean;
  /** The entity exposes a read-only `GET <item>/usage` endpoint. */
  usage?: boolean;
  /** Deletes with `?force=true` so references are detached instead of blocking. */
  forceDelete?: boolean;
}

export interface AdminResource<TRow> extends Required<
  Pick<AdminResourceConfig<TRow>, "listKey" | "keyOf" | "paginated" | "localized" | "usage">
> {
  mapRow: (raw: AdminRawRow) => TRow;
  forceDelete: boolean;
  basePath: (pathParams: Record<string, string>) => string;
  listing: ListingResource<AdminListFilters>;
}
