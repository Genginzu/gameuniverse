import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { ErrorProvider } from "@/components/providers/ErrorProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";

const LOCALE_MAP: Record<string, string> = { fr: "fr_FR", en: "en_US" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL("https://gameuniverse.gg"),
    title: { default: "Game Universe", template: "%s | Game Universe" },
    description: t("description"),
    keywords: t("keywords"),
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Game Universe",
      locale: LOCALE_MAP[locale] ?? "fr_FR",
    },
    twitter: { card: "summary_large_image" },
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: "/fr", en: "/en" },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client side
  const messages = await getMessages();

  return (
    <ErrorProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SWRProvider>
          <AuthErrorHandler />
          {children}
        </SWRProvider>
      </NextIntlClientProvider>
    </ErrorProvider>
  );
}
