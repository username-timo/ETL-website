import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etluganda.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/ETL-Dashboard.html",
          "/ETL-Invoice.html",
          "/ETL-Invoice-View.html",
          "/ETL-LPO-System.html",
          "/ETL-LPO-Outward.html",
          "/ETL-LPO-View.html",
          "/ETL-Quotation-Request.html",
          "/ETL-Quotation-View.html",
          "/ETL-Quotation-generator.html",
          "/ETL-Inventory.html",
          "/ETL-Site-Stock.html",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
