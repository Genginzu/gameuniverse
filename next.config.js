const withNextIntl = require("next-intl/plugin")("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
        port: "",
        pathname: "/igdb/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "store.playstation.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gog.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "store.steampowered.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.microsoft.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static-assets-prod.epicgames.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.nintendo.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kwlomzswurveyywcoivy.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Enable compression
  compress: true,
  // Enable React strict mode
  reactStrictMode: true,
  // Disable X-Powered-By header for security
  poweredByHeader: false,
  // Disable trailing slashes
  trailingSlash: false,
  // Security headers for all routes + CORS for API routes only
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "game-universe",
  project: "gameuniverse",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Disable sourcemap upload — sentry-cli crashes with "Resource temporarily unavailable"
  // (Rust panic in stdout write). Re-enable once @sentry/nextjs ships a fixed CLI.
  // See: https://github.com/getsentry/sentry-cli/issues
  sourcemaps: {
    disable: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
