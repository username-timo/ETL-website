"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Projects route error:", error);
  }, [error]);

  return (
    <main className="bg-white dark:bg-darkmode min-h-screen pt-28 pb-16">
      <div className="container lg:max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 text-3xl"
            style={{ background: "linear-gradient(135deg,#fde4e4,#fbc9c9)" }}>
            ⚠️
          </div>
          <h1 className="font-black text-midnight_text dark:text-white mb-3"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(1.8rem,3.5vw,2.5rem)", lineHeight: 1.15 }}>
            We hit a snag loading projects
          </h1>
          <p className="text-gray leading-relaxed mb-8 text-base">
            Something went wrong while preparing the project list. Try again, or head back to the homepage.
          </p>

          {error?.digest && (
            <p className="text-xs text-gray font-mono mb-6">
              Reference: {error.digest}
            </p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold text-white rounded-xl text-sm hover:-translate-y-0.5 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
              🔄 Try Again
            </button>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm hover:-translate-y-0.5 transition-all border border-border dark:border-dark_border bg-section dark:bg-darklight text-midnight_text dark:text-white">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
