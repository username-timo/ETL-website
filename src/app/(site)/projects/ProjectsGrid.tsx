"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { projects, categories, type Project } from "@/data/projects";

const ROLE_COLORS: Record<string, { tc: string; tbg: string }> = {
  "Main Contractor": { tc: "#1a3c6e", tbg: "#eaf2fb" },
  "Sub-Contractor":  { tc: "#7c3aed", tbg: "#f5f3ff" },
};

/* ─── Modal ─── */
function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const total = project.imgs.length;

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4"
      style={{ background: "rgba(8,16,36,0.93)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="flex w-full flex-col overflow-y-auto rounded-2xl bg-white dark:bg-darklight sm:overflow-hidden"
        style={{ maxWidth: 1180, maxHeight: "calc(100dvh - 1.5rem)" }}>

        {/* ── Modal header ── */}
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 px-6 py-4 flex-shrink-0"
          style={{ background: "linear-gradient(90deg,#1a3c6e,#2d5fa3)" }}>
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest mb-1 block"
              style={{ color: "#4fa3d1" }}>{project.cat}</span>
            <h2 className="text-white font-black leading-tight mb-1"
              style={{ fontFamily: "var(--font-barlow,sans-serif)", fontSize: "clamp(1rem,2.5vw,1.4rem)" }}>
              {project.title}
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{project.client}</p>
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.15)" }}
            aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Main image + body (split layout) ── */}
        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
          <div className="flex flex-col lg:min-h-0 lg:w-[58%]">
            <div className="relative h-[42vh] min-h-[220px] max-h-[360px] flex-none lg:min-h-[200px] lg:max-h-none lg:flex-1" style={{ background: "#060e20" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.imgs[idx]} alt={project.title}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />

              {/* Counter */}
              <div className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ background: "rgba(0,0,0,0.55)" }}>
                {idx + 1} / {total}
              </div>

              {/* Arrows */}
              {idx > 0 && (
                <button onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ background: "rgba(10,20,40,0.65)" }} aria-label="Previous">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {idx < total - 1 && (
                <button onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ background: "rgba(10,20,40,0.65)" }} aria-label="Next">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {total > 1 && (
              <div className="px-6 py-3 border-t border-border dark:border-dark_border bg-section dark:bg-darkmode overflow-x-auto flex-shrink-0">
                <div className="flex gap-3 min-w-max">
                  {project.imgs.map((img, thumbIdx) => (
                    <button
                      key={`${img}-${thumbIdx}`}
                      onClick={() => setIdx(thumbIdx)}
                      className="relative h-16 w-24 overflow-hidden rounded-xl border-2 transition-all duration-300"
                      style={{
                        borderColor: thumbIdx === idx ? "#1a3c6e" : "rgba(207,227,240,0.85)",
                        transform: thumbIdx === idx ? "scale(1.04)" : "scale(1)",
                        boxShadow: thumbIdx === idx ? "0 12px 28px rgba(26,60,110,0.18)" : "none",
                      }}
                      aria-label={`View project photo ${thumbIdx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${project.title} thumbnail ${thumbIdx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex-none px-6 py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:w-[42%] lg:border-l lg:border-border lg:dark:border-dark_border">
            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Year", value: project.year },
                { label: "Contract Value", value: project.value },
                { label: "ETL Role", value: project.role },
                { label: "Location", value: project.location },
              ].map((m, i) => (
                <div key={i} className="rounded-xl p-3 bg-section dark:bg-darkmode border border-border dark:border-dark_border">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#4fa3d1" }}>{m.label}</p>
                  <p className="text-xs font-semibold text-midnight_text dark:text-white leading-snug">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="border-t border-border dark:border-dark_border pt-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#1a3c6e" }}>Scope of Work</p>
              <p className="text-sm text-gray leading-relaxed">{project.desc}</p>
            </div>

            <div className="flex justify-end mt-5">
              <button onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 font-bold text-white rounded-xl text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
                Close ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Projects Grid ─── */
export default function ProjectsGrid() {
  const [active, setActive]         = useState("All");
  const [selected, setSelected]     = useState<Project | null>(null);
  const [cardImgIdx, setCardImgIdx] = useState<Record<string, number>>({});

  const getCardIdx = (key: string) => cardImgIdx[key] ?? 0;
  const navigateCard = (key: string, total: number, dir: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardImgIdx(prev => ({ ...prev, [key]: ((prev[key] ?? 0) + dir + total) % total }));
  };

  const filtered = active === "All" ? projects : projects.filter(p => p.cat === active);

  return (
    <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray mb-8">
        <Link href="/" className="hover:text-midnight_text dark:hover:text-white transition-colors">Home</Link>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-midnight_text dark:text-white font-semibold">Projects</span>
      </nav>

      {/* Page header */}
      <div className="mb-10">
        <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
          style={{ color: "#4fa3d1", borderColor: "#cfe3f0", background: "#f0f6fb" }}>
          Our Work
        </span>
        <h1 className="font-black text-midnight_text dark:text-white"
          style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1 }}>
          All Projects
        </h1>
        <p className="text-gray text-sm mt-2">
          {filtered.length} of {projects.length} projects
          {active !== "All" ? ` in ${active}` : " across Uganda since 2006"}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActive(cat)}
            className="px-5 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200"
            style={active === cat
              ? { background: "#1a3c6e", borderColor: "#1a3c6e", color: "#fff" }
              : { background: "#fff", borderColor: "#cfe3f0", color: "#64748b" }}>
            {cat}
            <span className="ml-1.5 text-xs opacity-70">
              ({cat === "All" ? projects.length : projects.filter(p => p.cat === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid — all matching projects, no 9-item cap */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {filtered.map((p, i) => {
          const key   = `${active}-${i}`;
          const cidx  = getCardIdx(key);
          const total = p.imgs.length;

          return (
            <div key={key}
              className="group relative bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border overflow-hidden shadow-sm transition-all duration-300 ease-out cursor-pointer transform-gpu hover:-translate-y-5 hover:scale-[1.065] hover:rotate-[0.2deg] hover:shadow-deatail_shadow hover:z-10"
              onClick={() => setSelected(p)}>

              {/* Image */}
              <div className="relative overflow-hidden" style={{ height: 240 }}>
                <Image
                  src={p.imgs[cidx]}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(180deg, rgba(26,60,110,0.18) 0%, rgba(26,60,110,0.72) 100%)" }}
                />

                {/* Card prev/next */}
                {total > 1 && (
                  <>
                    <button onClick={e => navigateCard(key, total, -1, e)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center text-white hidden group-hover:flex transition-all hover:scale-110 z-10"
                      style={{ background: "rgba(10,20,40,0.65)" }} aria-label="Prev">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button onClick={e => navigateCard(key, total, 1, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center text-white hidden group-hover:flex transition-all hover:scale-110 z-10"
                      style={{ background: "rgba(10,20,40,0.65)" }} aria-label="Next">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Category badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md"
                    style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
                    {p.cat}
                  </span>
                </div>

                {/* Dot indicators */}
                {total > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {p.imgs.map((_, di) => (
                      <button key={di}
                        onClick={e => { e.stopPropagation(); setCardImgIdx(prev => ({ ...prev, [key]: di })); }}
                        className="rounded-full border border-white/60 transition-all duration-200"
                        style={{
                          width:  di === cidx ? "1.4rem" : "0.45rem",
                          height: "0.45rem",
                          background: di === cidx ? "#fff" : "rgba(255,255,255,0.45)",
                        }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: ROLE_COLORS[p.role].tc, background: ROLE_COLORS[p.role].tbg }}>
                    {p.role}
                  </span>
                  <span className="text-xs text-gray font-bold">{p.year}</span>
                </div>

                <h3 className="font-black text-midnight_text dark:text-white mb-2 leading-snug"
                  style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "1rem" }}>
                  {p.title}
                </h3>

                <div className="flex items-start gap-1 mb-1.5">
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray">{p.location}</span>
                </div>

                <p className="text-xs text-gray font-semibold mb-3">
                  Client: <span className="font-normal">{p.client}</span>
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border dark:border-dark_border">
                  <span className="font-black text-base" style={{ color: "#1a3c6e", fontFamily: "var(--font-barlow, sans-serif)" }}>
                    {p.value}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide" style={{ color: "#4fa3d1" }}>
                    Details
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
