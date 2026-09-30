import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BOBA 80s Njangi",
    short_name: "BOBA 80s",
    description: "CPC Bali BOBA 80S Njangi contribution ledger",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ff",
    theme_color: "#2f0052",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
