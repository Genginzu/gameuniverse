/**
 * Turns stored review HTML into a short plain-text excerpt that is safe to
 * inject as HTML: every tag is dropped and any leftover angle bracket is
 * escaped, so no element can be formed. Existing entities are kept as-is.
 *
 * Dependency-free on purpose: the home API must not load `sanitize-html`.
 */
export function toReviewExcerptHtml(html: string, maxLength = 280): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
