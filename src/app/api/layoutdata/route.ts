import { NextResponse } from "next/server";

const headerData = [
  { label: "Home",          href: "/" },
  { label: "About Us",      href: "/#about" },
  { label: "Services",      href: "/#services" },
  { label: "Projects",      href: "/projects" },
  { label: "Contact Us",    href: "/contact" },
  { label: "Portal",        href: "/#portal" },
];

export const GET = async () => {
  return NextResponse.json({ headerData });
};
