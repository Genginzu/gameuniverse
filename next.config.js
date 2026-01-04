const withNextIntl = require("next-intl/plugin")("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is enabled by default in Next.js 16
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize images
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
  },
  // Enable compression
  compress: true,
  // Enable React strict mode
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);
