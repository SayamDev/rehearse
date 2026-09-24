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
    ];
  },
};

export default nextConfig;
