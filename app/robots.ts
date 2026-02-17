import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://stubbornstumps.co.nz/sitemap.xml",
    host: "https://stubbornstumps.co.nz",
  };
}
