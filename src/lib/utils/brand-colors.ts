/**
 * Hex mirror of the site palette defined in `src/app/globals.css` (@theme `--color-palette-*`).
 *
 * Only for JS contexts that cannot resolve CSS variables: generated images (icon, OG image),
 * the web manifest, the viewport theme colour, contrast maths and colour-picker defaults.
 * Everywhere else use the Tailwind utilities (`bg-palette-primary-500`) or the CSS variables
 * (`var(--color-palette-primary-500)`). `brand-colors.test.ts` fails if this drifts from globals.css.
 */
export const BRAND_COLORS = {
  primary: { 400: "#e3976d", 500: "#e08a5c", 600: "#d66529" },
  secondary: { 400: "#f0b077", 500: "#eea663" },
  neutral: { 200: "#dcdde4", 400: "#9aa3b8", 900: "#22242f", 950: "#1b1c25" },
} as const;
