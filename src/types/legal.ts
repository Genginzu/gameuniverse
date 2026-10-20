/**
 * VAT regime of the publisher. A micro-entreprise under the "franchise en
 * base" regime has no VAT number and must print the art. 293 B CGI mention.
 */
export type PublisherVat =
  | { kind: "franchise" }
  | { kind: "number"; value: string };

export interface ConsumerMediator {
  name: string;
  address: string;
  website: string;
}

/**
 * Publisher identity shown on the legal pages. `null` means "not provided
 * yet": the pages render a visible placeholder and the field is reported by
 * `getMissingLegalFields()`.
 */
export interface PublisherInfo {
  operatorName: string | null;
  address: string | null;
  siret: string | null;
  vat: PublisherVat | null;
  email: string | null;
  /** Optional: the line is hidden when null. */
  phone: string | null;
  /** Falls back to `operatorName` when null. */
  publicationDirector: string | null;
  /** Court of the publisher's registered office (B2B clause of the CGV). */
  competentCourt: string | null;
  mediator: ConsumerMediator | null;
}

export type LegalInfoField = Exclude<keyof PublisherInfo, "phone" | "publicationDirector">;
