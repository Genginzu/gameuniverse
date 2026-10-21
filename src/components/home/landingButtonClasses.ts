/** Tailwind classes shared by the landing call-to-action links (≥ 44px touch target). */
const BASE_CTA =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-mono text-sm font-semibold tracking-[0.12em] uppercase sm:w-auto";

export const PRIMARY_CTA_CLASS = `btn-filled ${BASE_CTA}`;

export const GHOST_CTA_CLASS = `${BASE_CTA} border-editorial-line border text-white transition-colors hover:border-white/40 hover:bg-white/5`;
