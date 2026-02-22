// This file configures the initialization of Sentry for edge features (middleware, edge routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://2b03312f340354d97da23aa8bbef6ef2@o4510930434654208.ingest.de.sentry.io/4510930442649680",

  tracesSampleRate: isProduction ? 0.2 : 1.0,

  enableLogs: true,
  sendDefaultPii: true,

  environment: isProduction ? "production" : "development",
});
