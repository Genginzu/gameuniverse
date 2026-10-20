import { describe, it, expect } from "vitest";
import { getMissingLegalFields, getPublicationDirector } from "@/lib/legal/publisherInfo";
import type { PublisherInfo } from "@/types/legal";

const EMPTY: PublisherInfo = {
  operatorName: null,
  address: null,
  siret: null,
  vat: null,
  email: null,
  phone: null,
  publicationDirector: null,
  competentCourt: null,
  mediator: null,
};

const COMPLETE: PublisherInfo = {
  operatorName: "Jane Doe",
  address: "1 rue Exemple, 75000 Paris",
  siret: "00000000000000",
  vat: { kind: "franchise" },
  email: "contact@example.com",
  phone: null,
  publicationDirector: null,
  competentCourt: "Tribunal judiciaire de Paris",
  mediator: { name: "Mediator", address: "Paris", website: "example.com" },
};

describe("getMissingLegalFields", () => {
  it("lists every mandatory field when nothing is filled", () => {
    expect(getMissingLegalFields(EMPTY)).toEqual([
      "operatorName",
      "address",
      "siret",
      "vat",
      "email",
      "competentCourt",
      "mediator",
    ]);
  });

  it("returns nothing once mandatory fields are set, optional ones may stay null", () => {
    expect(getMissingLegalFields(COMPLETE)).toEqual([]);
  });

  it("treats blank strings as missing", () => {
    expect(getMissingLegalFields({ ...COMPLETE, siret: "  " })).toEqual(["siret"]);
  });
});

describe("getPublicationDirector", () => {
  it("falls back to the operator name", () => {
    expect(getPublicationDirector(COMPLETE)).toBe("Jane Doe");
  });

  it("prefers an explicit publication director", () => {
    expect(getPublicationDirector({ ...COMPLETE, publicationDirector: "John Doe" })).toBe("John Doe");
  });
});
