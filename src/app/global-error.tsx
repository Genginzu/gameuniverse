"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect, useState } from "react";

const SUPPORTED_LOCALES = new Set(["fr", "en"]);

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const [locale, setLocale] = useState("fr");

  useEffect(() => {
    Sentry.captureException(error);
    const segment = window.location.pathname.split("/").filter(Boolean)[0] ?? "fr";
    setLocale(SUPPORTED_LOCALES.has(segment) ? segment : "fr");
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
