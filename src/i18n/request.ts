import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Detect language from cookies or default to French
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
