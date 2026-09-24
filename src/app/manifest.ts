import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rehearse: free interview practice",
    short_name: "Rehearse",
    description: "Practise job interview questions, get one clear fix, and try again. Free, no signup.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f4fb",
    theme_color: "#f3f4fb",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Practise", url: "/practice/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Get ready", url: "/prepare", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Calm corner", url: "/calm", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
