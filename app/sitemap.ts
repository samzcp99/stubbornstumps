import type { MetadataRoute } from "next";

const baseUrl = "https://stubbornstumps.co.nz";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/services", "/gallery", "/quote", "/faq", "/contact"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
