/**
 * Helpers to put user input inside PostgREST filter strings (`.or(...)`).
 *
 * PostgREST reserves `,` `.` `:` `(` `)` in filter values: interpolating a raw
 * search term lets the caller add their own clauses (`zzz,code.like.*`) or
 * break the query. A double-quoted value is read literally; `\` and `"` are
 * escaped with a backslash inside the quotes.
 */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** `col1.ilike."%term%",col2.ilike."%term%"` for a case-insensitive "contains" search. */
export function ilikeAnyFilter(columns: readonly string[], search: string): string {
  const pattern = quoteFilterValue(`%${search.trim()}%`);
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}
