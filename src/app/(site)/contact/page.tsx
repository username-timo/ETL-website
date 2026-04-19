
import React from "react";
import { Metadata } from "next";
import HeroSub from "@/app/components/shared/hero-sub";
import ContactInfo from "@/app/components/contact/contact-info";
import Portal from "@/app/components/home/portal";
import Location from "@/app/components/contact/office-location";
export const metadata: Metadata = {
  title: "Contact ETL Uganda – Mukono Head Office & Client Portal",
  description:
    "Get in touch with Engineering Trade Links Co. Ltd. Head office: Plot 1353, Sonde-Seeta Road, Goma Division, Mukono. P.O. Box 27555, Kampala. Phone +256 776 566 522 / +256 704 545 163 · tradelinksltd@gmail.com.",
  keywords: [
    "contact ETL Uganda",
    "Engineering Trade Links phone",
    "Mukono contractor contact",
    "ETL quotation request",
    "ETL client portal",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Engineering Trade Links – Uganda",
    description:
      "Reach ETL for tenders, quotations and project partnerships across Uganda.",
    url: "/contact",
    type: "website",
  },
};

const page = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/contact", text: "Contact" },
  ];
  return (
    <>
      <HeroSub
        title="Contact Us"
        description="Reach Engineering Trade Links Co. Ltd for tenders, quotations, project partnerships, and engineering services across Uganda."
        breadcrumbLinks={breadcrumbLinks}
      />
      <ContactInfo />
      <Portal />
      <Location />
    </>
  );
};

export default page;
