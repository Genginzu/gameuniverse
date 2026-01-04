import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Inter } from "next/font/google";
import "../globals.css";
import type { Metadata } from "next";
import { AuthErrorHandler } from "@/components/AuthErrorHandler";
import { DebugEnv } from "@/components/DebugEnv";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Universe",
  description:
    "Découvrez l'univers du jeu vidéo - La plateforme complète pour explorer, découvrir et partager votre passion du gaming",
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
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthErrorHandler />
          <DebugEnv />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
