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
        hostname: "**",
      },
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
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
