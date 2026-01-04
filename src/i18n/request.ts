import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  // Get locale from URL or default to French
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Extract locale from pathname or default to 'fr'
  let locale = "fr";
  if (pathname.startsWith("/en")) {
    locale = "en";
  } else if (pathname.startsWith("/fr")) {
    locale = "fr";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
