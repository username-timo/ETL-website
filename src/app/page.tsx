import React from 'react';
import { Metadata } from "next";
import Hero from './components/home/hero';
import About from './components/home/about';
import Features from './components/shared/features';
import Projects from './components/home/projects';
import Turnover from './components/home/turnover';
import Staff from './components/home/staff';
import Portal from './components/home/portal';

export const metadata: Metadata = {
  title: "Engineering Trade Links Co. Ltd – Construction & Procurement Uganda",
  description:
    "ETL is a Ugandan construction and procurement company delivering civil engineering, road works, electro-mechanical systems, and supply services across East Africa since 2006.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Engineering Trade Links Co. Ltd – Uganda",
    description:
      "Civil works, road construction, electro-mechanical systems, and procurement across Uganda & East Africa. PPDA-registered since 2006.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Features />
      <Projects />
      <Turnover />
      <Staff />
      <Portal />
    </main>
  );
}
