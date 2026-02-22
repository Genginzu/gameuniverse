// This file configures the initialization of Sentry on the server.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://2b03312f340354d97da23aa8bbef6ef2@o4510930434654208.ingest.de.sentry.io/4510930442649680",

  // Sample 100% of errors, but only 20% of traces in production
  tracesSampleRate: isProduction ? 0.2 : 1.0,

  enableLogs: true,
  sendDefaultPii: true,

  // Filter out noisy or irrelevant errors
  ignoreErrors: [
    // Browser extensions and non-app errors
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
  ],

  environment: isProduction ? "production" : "development",
});
