const baseUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://scanops.io";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/owner"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
