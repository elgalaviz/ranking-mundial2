import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.mifanbot.com";

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
