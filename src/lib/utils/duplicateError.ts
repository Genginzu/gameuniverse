const DUPLICATE_MARKERS = ["duplicate", "already exists", "existe déjà"];

/** True when an API error message signals a unique-constraint conflict (FR or EN). */
export function isDuplicateErrorMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return DUPLICATE_MARKERS.some((marker) => normalized.includes(marker));
}
