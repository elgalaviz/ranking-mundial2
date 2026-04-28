import { MetadataRoute } from "next";

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mifanbot.com";
const BASE_URL = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/god/", "/dashboard/", "/api/", "/quiniela/login"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
