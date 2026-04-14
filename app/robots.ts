import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/god/", "/leads/", "/api/"],
      },
    ],
    sitemap: "https://prospekto.mx/sitemap.xml",
  };
}
