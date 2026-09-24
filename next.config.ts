import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Cross-origin isolation lets the on-device voice (Kokoro) use several CPU threads,
  // which makes it speak without long pauses. "credentialless" keeps plain cross-origin
  // downloads (the voice model from Hugging Face) working.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
      {
        // The service worker must always be fresh so app updates reach people.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
