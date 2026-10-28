/**
 * Link-compatible href of an admin translations list with updated search params.
 * A null, empty or "1" override removes the param (page 1 is the default).
 */
export function buildTranslationsListHref(
  entityType: string,
  currentParams: URLSearchParams,
  overrides: Record<string, string | null>
): { pathname: string; query: Record<string, string> } {
  const params = new URLSearchParams(currentParams.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === "" || value === "1") params.delete(key);
    else params.set(key, value);
  }
  return { pathname: `/admin/translations/${entityType}`, query: Object.fromEntries(params) };
}
