/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'engineeringtradelinks.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;

// Wire up Cloudflare bindings (KV/R2/D1/env vars) during `next dev` so
// getCloudflareContext() works locally. No-op in production / in normal build.
// See: https://opennext.js.org/cloudflare/get-started
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
