import sanitizeHtml from "sanitize-html";

/**
 * Allowlist matching the TipTap StarterKit output used by the review editor.
 * Everything else (scripts, event handlers, styles, iframes, images, non-http
 * links) is stripped; the text content of discarded tags is kept.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "code",
    "pre",
    "blockquote",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "hr",
    "a",
  ],
  allowedAttributes: { a: ["href", "rel", "target"] },
  allowedSchemes: ["http", "https"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer nofollow ugc",
      target: "_blank",
    }),
  },
};

/** Sanitize user-supplied rich-text HTML before storing or rendering it. */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
