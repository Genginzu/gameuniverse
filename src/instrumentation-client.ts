// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://2b03312f340354d97da23aa8bbef6ef2@o4510930434654208.ingest.de.sentry.io/4510930442649680",

  tracesSampleRate: isProduction ? 0.2 : 1.0,
  enableLogs: true,
  sendDefaultPii: true,

  // Replay config — capture 10% of sessions, 100% on error
  replaysSessionSampleRate: isProduction ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,

  environment: isProduction ? "production" : "development",

  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
    // Next.js navigation cancellations
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
