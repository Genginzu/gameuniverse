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
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Enable compression
  compress: true,
  // Enable React strict mode
  reactStrictMode: true,
  // Configure headers for CORS in development
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
