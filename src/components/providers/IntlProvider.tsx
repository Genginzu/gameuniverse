import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

interface IntlProviderProps {
  children: React.ReactNode;
  locale: string;
}

export async function IntlProvider({ children, locale }: IntlProviderProps) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
