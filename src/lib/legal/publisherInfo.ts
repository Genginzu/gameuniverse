import type { LegalInfoField, PublisherInfo } from "@/types/legal";

/**
 * Single source of truth for the publisher identity printed on the legal
 * pages (mentions légales, confidentialité, CGV). Fill in the `null` values
 * before going live: every legal page reads from here, so no placeholder has
 * to be hunted down in the page contents. Tracked in issue #336.
 */
export const PUBLISHER_INFO: PublisherInfo = {
  operatorName: "Gamers Universe",
  address: null,
  siret: "",
  vat: { kind: "franchise" },
  email: "contact@gamersuniverse.fr",
  phone: "",
  publicationDirector: "",
  competentCourt: "",
  mediator: null,
};

/** Hosting providers, checked against their own legal pages (2026-10). */
export const HOSTING_PROVIDERS = {
  vercel: {
    name: "Vercel Inc.",
    address: "440 N Barranca Avenue #4133, Covina, CA 91723",
    website: "vercel.com",
  },
  supabase: {
    name: "Supabase Pte. Ltd.",
    website: "supabase.com",
  },
} as const;

const REQUIRED_FIELDS: readonly LegalInfoField[] = [
  "operatorName",
  "address",
  "siret",
  "vat",
  "email",
  "competentCourt",
  "mediator",
];

/** Lists the mandatory fields still missing, for the pre-launch check. */
export function getMissingLegalFields(info: PublisherInfo = PUBLISHER_INFO): LegalInfoField[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = info[field];
    return value === null || (typeof value === "string" && value.trim() === "");
  });
}

export function getPublicationDirector(info: PublisherInfo = PUBLISHER_INFO): string | null {
  return info.publicationDirector?.trim() || info.operatorName;
}
