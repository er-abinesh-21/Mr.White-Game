import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  turbopack: {}, // Explicitly set empty turbopack to suppress missing mapping issue from PWA plugin in Next 16+
  output: "export",
};

export default withPWA(nextConfig);
