import { DM_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Aoscompo from "@/utils/aos";
const dmsans = DM_Sans({ subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow",
});
import type { Metadata } from "next";
import NextTopLoader from 'nextjs-toploader';
import Footer from "./components/layout/footer";
import ScrollToTop from "./components/scroll-to-top";
import Header from "./components/layout/header";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etluganda.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Engineering Trade Links Co. Ltd – Construction & Procurement Uganda",
    template: "%s | Engineering Trade Links",
  },
  description:
    "ETL delivers civil engineering, road construction, electro-mechanical systems, and supply & procurement services across Uganda and East Africa since 2006.",
  keywords: [
    "construction company Uganda",
    "civil works contractor Kampala",
    "road construction Uganda",
    "procurement supply East Africa",
    "electro-mechanical Uganda",
    "PPDA registered contractor",
    "ETL Uganda",
    "Engineering Trade Links",
    "contractor Mukono",
  ],
  authors: [{ name: "Engineering Trade Links Co. Ltd" }],
  creator: "Engineering Trade Links Co. Ltd",
  publisher: "Engineering Trade Links Co. Ltd",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_UG",
    url: SITE_URL,
    siteName: "Engineering Trade Links",
    title: "Engineering Trade Links Co. Ltd – Uganda",
    description:
      "Quality at Service — construction, civil works, road, electro-mechanical & procurement across East Africa since 2006.",
    images: [
      {
        url: "/etl-images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Engineering Trade Links Co. Ltd – Uganda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Trade Links Co. Ltd",
    description:
      "Construction, civil works & procurement across East Africa. Quality at Service.",
    images: ["/etl-images/og-cover.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Fill these after registering on the respective webmaster tools:
    // google: "<google-site-verification-code>",
    // other: { "msvalidate.01": "<bing-code>" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    name: "Engineering Trade Links Co. Ltd",
    alternateName: "ETL",
    url: SITE_URL,
    logo: `${SITE_URL}/etl-images/etl-logo.png`,
    image: `${SITE_URL}/etl-images/og-cover.jpg`,
    description:
      "Civil engineering, road construction, electro-mechanical systems, and procurement & supply services in Uganda since 2006.",
    telephone: ["+256776566522", "+256704545163"],
    email: "tradelinksltd@gmail.com",
    foundingDate: "2006",
    taxID: "1000161539",
    vatID: "49481-L",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Plot 1353, Sonde-Seeta Road, Goma Division",
      postOfficeBoxNumber: "27555",
      addressLocality: "Mukono",
      addressRegion: "Central Region",
      addressCountry: "UG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 0.3519,
      longitude: 32.7553,
    },
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "Place", name: "East Africa" },
    ],
    knowsAbout: [
      "Civil Engineering",
      "Road Construction",
      "Electro-Mechanical Works",
      "Procurement and Supply",
      "Water Engineering",
    ],
    slogan: "Quality at Service",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmsans.className} ${barlowCondensed.variable}`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
          />
          <ThemeProvider
            attribute="class"
            enableSystem={false}
            defaultTheme="light"
          >
            <Aoscompo>
              <Header />
              <NextTopLoader color="#1a3c6e" />
              {children}
              <Footer />
            </Aoscompo>
            <ScrollToTop />
          </ThemeProvider>
      </body>
    </html>
  );
}
