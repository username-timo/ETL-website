import type { Metadata } from "next";
import ProjectsGrid from "./ProjectsGrid";

export const metadata: Metadata = {
  title: "Our Projects – Civil, Road & Electrical Works in Uganda",
  description:
    "Explore 40+ completed projects by Engineering Trade Links across Uganda — roads, civil & building, water, and electro-mechanical works delivered since 2006.",
  keywords: [
    "ETL projects Uganda",
    "construction projects Kampala",
    "civil works portfolio Uganda",
    "road construction projects",
    "Mukono contractor portfolio",
  ],
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Our Projects – Engineering Trade Links Uganda",
    description:
      "40+ infrastructure projects delivered across Uganda: roads, buildings, water & electrical works.",
    url: "/projects",
    type: "website",
  },
};

export default function ProjectsPage() {
  return (
    <main className="bg-white dark:bg-darkmode min-h-screen pt-24 pb-16">
      <ProjectsGrid />
    </main>
  );
}
