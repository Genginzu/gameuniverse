import { createTranslator } from "next-intl";
import { sendEmail } from "@/lib/email";

type EmailKind = "requested" | "completed";

/** French is the default locale: anything other than "en" falls back to it. */
function resolveLocale(locale: string | null | undefined): "fr" | "en" {
  return locale === "en" ? "en" : "fr";
}

async function translatorFor(locale: "fr" | "en") {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return createTranslator({ locale, messages, namespace: "accountDeletion.emails" });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendAccountDeletionEmail(
  kind: EmailKind,
  to: string,
  locale: string | null | undefined,
  scheduledFor?: Date
) {
  const lang = resolveLocale(locale);
  const t = await translatorFor(lang);
  const date = scheduledFor
    ? new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(scheduledFor)
    : "";
  const settingsUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${lang}/account-deletion`;

  const paragraphs = [t(`${kind}.body`, { date }), t(`${kind}.footer`)];
  const link =
    kind === "requested"
      ? `<p><a href="${escapeHtml(settingsUrl)}">${escapeHtml(t("requested.cancelLink"))}</a></p>`
      : "";

  return sendEmail({
    to,
    subject: t(`${kind}.subject`),
    html: paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("") + link,
  });
}

/** Confirmation sent when the user asks for deletion (best-effort). */
export function sendDeletionRequestedEmail(
  to: string,
  locale: string | null | undefined,
  scheduledFor: Date
) {
  return sendAccountDeletionEmail("requested", to, locale, scheduledFor);
}

/** Confirmation sent once the account has been permanently deleted (best-effort). */
export function sendDeletionCompletedEmail(to: string, locale: string | null | undefined) {
  return sendAccountDeletionEmail("completed", to, locale);
}
