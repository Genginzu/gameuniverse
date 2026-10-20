import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import {
  HOSTING_PROVIDERS,
  PUBLISHER_INFO,
  getPublicationDirector,
} from "@/lib/legal/publisherInfo";
import type { LegalTranslator } from "@/lib/legal/legalMessages";
import type { PublisherInfo } from "@/types/legal";
import { ExternalLink, LegalEmail, LegalValue } from "@/components/legal/LegalValue";

export type LegalRichTags = Record<string, (chunks: ReactNode) => ReactNode>;

function toHref(website: string): string {
  return /^https?:\/\//.test(website) ? website : `https://${website}`;
}

function formatVat(info: PublisherInfo, t: LegalTranslator): string | null {
  if (!info.vat) return null;
  return info.vat.kind === "number" ? info.vat.value : t("vatFranchise");
}

const LINK_TAGS: LegalRichTags = {
  strong: (chunks) => <strong>{chunks}</strong>,
  mentions: (chunks) => <Link href="/mentions-legales">{chunks}</Link>,
  privacy: (chunks) => <Link href="/confidentialite">{chunks}</Link>,
  cookies: (chunks) => <Link href="/cookies">{chunks}</Link>,
  cgv: (chunks) => <Link href="/cgv">{chunks}</Link>,
  cnil: (chunks) => <ExternalLink href="https://www.cnil.fr">{chunks}</ExternalLink>,
  odr: (chunks) => <ExternalLink href="https://ec.europa.eu/consumers/odr">{chunks}</ExternalLink>,
};

/**
 * Rich-text tags shared by every legal page: formatting, internal links and
 * the publisher values injected as empty tags (e.g. `<email></email>`).
 */
export function buildLegalRichTags(t: LegalTranslator, info: PublisherInfo = PUBLISHER_INFO): LegalRichTags {
  const placeholder = t("placeholder");
  const value = (raw: string | null) => () => <LegalValue value={raw} placeholder={placeholder} />;
  const mediator = info.mediator;

  return {
    ...LINK_TAGS,
    operator: value(info.operatorName),
    address: value(info.address),
    siret: value(info.siret),
    vat: value(formatVat(info, t)),
    phone: value(info.phone),
    director: value(getPublicationDirector(info)),
    court: value(info.competentCourt),
    email: () => <LegalEmail email={info.email} placeholder={placeholder} />,
    mediatorName: value(mediator?.name ?? null),
    mediatorAddress: value(mediator?.address ?? null),
    mediatorWebsite: () =>
      mediator ? (
        <ExternalLink href={toHref(mediator.website)}>{mediator.website}</ExternalLink>
      ) : (
        <LegalValue value={null} placeholder={placeholder} />
      ),
    vercelName: () => HOSTING_PROVIDERS.vercel.name,
    vercelAddress: () => HOSTING_PROVIDERS.vercel.address,
    supabaseName: () => HOSTING_PROVIDERS.supabase.name,
  };
}

/** List items hidden when their optional value is missing (`<ul key>.<item key>`). */
export function getHiddenLegalItems(info: PublisherInfo = PUBLISHER_INFO): string[] {
  return info.phone ? [] : ["ul_publisher.phone"];
}
