import { Resend } from "resend";
import { logger } from "@/lib/logger";

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend.
 *
 * If RESEND_API_KEY is not configured, this logs a warning and returns
 * `{ sent: false }` instead of throwing — callers should treat email
 * delivery as best-effort and not block the underlying operation (e.g. a
 * group invitation is still created even if the email fails to send).
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{
  sent: boolean;
  error?: string;
}> {
  const resend = getClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    logger.warn("Resend is not configured — skipping email send", {
      to,
      subject,
      hasApiKey: !!resend,
      hasFromEmail: !!from,
    });
    return { sent: false, error: "Resend is not configured" };
  }

  try {
    const { error } = await resend.emails.send({ from, to, subject, html });

    if (error) {
      logger.error("Failed to send email via Resend", { to, subject, error: error.message });
      return { sent: false, error: error.message };
    }

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Unexpected error sending email via Resend", { to, subject, error: message });
    return { sent: false, error: message };
  }
}
