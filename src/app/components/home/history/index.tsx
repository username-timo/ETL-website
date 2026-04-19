import React from "react";
import Link from "next/link";

const milestones = [
  { year: "2006", title: "Company Founded", desc: "ETL was established in Uganda as a private limited liability company focused on quality engineering and construction services." },
  { year: "2012", title: "Public Infrastructure Portfolio", desc: "Expanded delivery across roads, public buildings, and water works for ministries, local governments, and institutional clients." },
  { year: "2020", title: "Large-Scale Delivery Capacity", desc: "Handled high-value civil and road contracts while strengthening equipment, technical teams, and project delivery systems." },
  { year: "2025", title: "Certified National Provider", desc: "Maintained PPDA registration and statutory compliance while delivering major projects for public, donor, and private clients." },
];

const highlights = [
  { value: "19+", label: "Years in Operation" },
  { value: "40+", label: "Documented Projects" },
  { value: "UGX 18B+", label: "Annual Turnover" },
];

export default function History() {
  return (
    <section className="py-24 dark:bg-darkmode overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f5f9fd 0%, #eaf2fb 100%)" }}>
      <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── LEFT: Content + highlights ── */}
          <div data-aos="fade-right" data-aos-duration="800">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full border"
              style={{ color: "#4fa3d1", borderColor: "#cfe3f0", background: "#fff" }}>
              Our Story
            </span>
            <h2 className="font-black text-midnight_text dark:text-white mb-2"
              style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>
              Built on Trust &amp;
            </h2>
            <h2 className="font-black mb-6"
              style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Engineering Excellence
            </h2>
            <div className="w-16 h-1 rounded-full mb-6" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />

            <p className="text-gray text-base leading-relaxed mb-4">
              Since 2006, Engineering Trade Links Co. Ltd has delivered civil engineering, road, building, water, and electro-mechanical projects across Uganda.
            </p>
            <p className="text-gray text-base leading-relaxed mb-8">
              We combine technical expertise with disciplined execution, statutory compliance, and a commitment to quality delivery on every assignment.
            </p>

            {/* Highlight stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {highlights.map((h, i) => (
                <div key={i} className="bg-white dark:bg-darklight rounded-2xl p-5 border border-border dark:border-dark_border shadow-sm text-center">
                  <p className="font-black text-primary text-3xl leading-none mb-1"
                    style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>{h.value}</p>
                  <p className="text-gray text-xs font-semibold uppercase tracking-wide">{h.label}</p>
                </div>
              ))}
            </div>

            <Link href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl border-2 transition-all hover:-translate-y-0.5 text-sm"
              style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
              Work With Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* ── RIGHT: Timeline ── */}
          <div className="relative" data-aos="fade-left" data-aos-duration="800" data-aos-delay="100">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-6 bottom-6 w-0.5 rounded-full"
              style={{ background: "linear-gradient(to bottom,#1a3c6e,#4fa3d1,#cfe3f0)" }} />

            <div className="flex flex-col gap-8">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-6 items-start" data-aos="fade-left" data-aos-delay={`${i * 100}`}>
                  {/* Year badge */}
                  <div className="relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-md z-10"
                    style={{ background: i === milestones.length - 1 ? "linear-gradient(135deg,#c8860a,#e6a830)" : "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
                    <span className="text-white font-black text-[10px] text-center leading-tight"
                      style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                      {m.year}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-5 shadow-sm hover:shadow-property transition-shadow">
                    <p className="font-black text-midnight_text dark:text-white text-base mb-1.5"
                      style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                      {m.title}
                    </p>
                    <p className="text-gray text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
