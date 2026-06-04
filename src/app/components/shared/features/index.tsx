"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { projects, type Project } from "@/data/projects";

type ServiceGroup = "All" | "Construction" | "Systems & Design" | "Supply";

type Service = {
  title: string;
  slug: string;
  group: Exclude<ServiceGroup, "All">;
  cat: string | null;       // maps to Project.cat — null = no linked projects
  tag: string | null;       // shown instead of count when cat is null
  desc: string;
  image: string;
  gallery?: string[];
  deliverables: string[];
};

const services: Service[] = [
  {
    title: "Civil & Building Works",
    slug: "civil-building",
    group: "Construction",
    cat: "Civil & Building",
    tag: null,
    desc: "New building works for commercial and residential sectors. Schools, hospitals, offices and government facilities constructed to international standards.",
    image: "/etl-images/makindye-court-01.jpg",
    gallery: [
      "/etl-images/makindye-court-01.jpg",
      "/etl-images/bunagana-border-02.jpg",
      "/etl-images/ciforo-market-01.jpg",
      "/etl-images/mbarara-school-01.jpg",
      "/etl-images/murchison-falls-03.jpg",
      "/etl-images/unhcr-kiryandongo-01.jpg",
    ],
    deliverables: [
      "Commercial offices & retail buildings",
      "Schools, dormitories & student hostels",
      "Hospitals & health facilities",
      "Government & institutional buildings",
      "Earthworks, retaining walls & concrete works",
      "Turnkey delivery — structural to finishes",
    ],
  },
  {
    title: "Road Construction",
    slug: "roads",
    group: "Construction",
    cat: "Roads",
    tag: null,
    desc: "Comprehensive road construction, maintenance, rehabilitation and low-cost sealing of district and community access roads across Uganda.",
    image: "/etl-images/electoral-commission-04.jpg",
    gallery: [
      "/etl-images/electoral-commission-04.jpg",
      "/etl-images/electoral-commission-03.jpg",
      "/etl-images/electoral-commission-02.jpg",
      "/etl-images/ura-nakawa-parking-01.jpg",
      "/etl-images/unra-road-01.jpg",
      "/etl-images/ura-nakawa-parking-03.jpg",
    ],
    deliverables: [
      "Asphalt & bituminous surfacing",
      "Low-cost sealing of access roads",
      "Grading, gravelling & compaction",
      "Culverts & drainage structures",
      "Road rehabilitation & routine maintenance",
    ],
  },
  {
    title: "Water Engineering",
    slug: "water",
    group: "Construction",
    cat: "Water",
    tag: null,
    desc: "Full water supply infrastructure — borehole drilling, pump testing, pipe laying, tank installation and drainage construction for communities.",
    image: "/etl-images/shallow-wells-budaka-01.jpg",
    gallery: [
      "/etl-images/shallow-wells-budaka-02.jpg",
      "/etl-images/svc-water-pipes.jpg",
      "/etl-images/shallow-wells-budaka-01.jpg",
    ],
    deliverables: [
      "Borehole drilling & pump testing",
      "Shallow wells construction",
      "Pipe-water extension networks",
      "Water tank installation",
      "Drainage & sewerage works",
    ],
  },
  {
    title: "Concrete Manufacturing",
    slug: "concrete",
    group: "Construction",
    cat: null,
    tag: "Precast",
    desc: "Supply of precast concrete products: pavers, road kerbs, culverts, slabs and drainage components for roads, parking and landscaping.",
    image: "/etl-images/svc-concrete-products.jpg",
    deliverables: [
      "Interlocking & standard pavers",
      "Road kerbstones & edge restraints",
      "Reinforced concrete culverts",
      "Concrete slabs & drainage channels",
    ],
  },
  {
    title: "Electro-Mechanical Systems",
    slug: "electro-mechanical",
    group: "Systems & Design",
    cat: "Electrical",
    tag: null,
    desc: "Installation of plumbing, HVAC, industrial machinery, power transmission lines and rural electrification for urban and rural areas.",
    image: "/etl-images/mtn-bubada-01.jpg",
    gallery: [
      "/etl-images/mtn-bubada-01.jpg",
      "/etl-images/mtn-bubada-03.jpg",
      "/etl-images/etl-solar-01.jpg",
      "/etl-images/power-sector-07.jpg",
      "/etl-images/etl-solar-02.jpg",
    ],
    deliverables: [
      "Industrial plumbing & HVAC",
      "Power transmission (MV & LV)",
      "Rural electrification programmes",
      "Telecom tower civil & electrical works",
      "Solar PV installations",
    ],
  },
  {
    title: "Steel & Aluminium Fabrication",
    slug: "fabrication",
    group: "Systems & Design",
    cat: null,
    tag: "Specialty",
    desc: "Custom metal fabrication including structural steel frames, doors, windows, handrails and industrial components to architectural specifications.",
    image: "/etl-images/svc-steel-aluminium-custom.png",
    deliverables: [
      "Structural steel frames & trusses",
      "Aluminium doors & window systems",
      "Handrails, staircases & balustrades",
      "Custom industrial components",
    ],
  },
  {
    title: "Architectural & Engineering Design",
    slug: "design",
    group: "Systems & Design",
    cat: null,
    tag: "Design",
    desc: "In-house architectural and engineering design services covering structural, civil, mechanical and electrical disciplines — from concept drawings to full working drawings.",
    image: "/etl-images/mbarara-school-02.jpg",
    deliverables: [
      "Architectural concept & working drawings",
      "Structural engineering design",
      "Civil & drainage design",
      "Mechanical & electrical design",
      "Full tender documentation packages",
    ],
  },
  {
    title: "Belgotex SA — Floor Finishing",
    slug: "belgotex",
    group: "Supply",
    cat: null,
    tag: "Distributorship",
    desc: "Authorised distributor of Belgotex (South Africa) floor finishing products — carpets, vinyl and commercial flooring systems supplied and installed across Uganda.",
    image: "/etl-images/belgotex-floor-finishing.png",
    deliverables: [
      "Commercial carpet tiles & broadloom",
      "Vinyl flooring (sheet & plank)",
      "Sports & specialty flooring systems",
      "Supply, installation & aftercare",
    ],
  },
  {
    title: "Instarmac UK — Road Repair Premix",
    slug: "instarmac",
    group: "Supply",
    cat: null,
    tag: "Distributorship",
    desc: "Authorised distributor of Instarmac (United Kingdom) premixed road repair and reinstatement products for durable pothole and utility cut repairs.",
    image: "/etl-images/ura-nakawa-parking-04.jpg",
    deliverables: [
      "Permanent cold-lay pothole repair premix",
      "Utility cut reinstatement products",
      "All-weather application (wet or dry)",
      "Bagged supply for immediate use",
    ],
  },
];

const GROUPS: ServiceGroup[] = ["All", "Construction", "Systems & Design", "Supply"];

const GROUP_COLORS: Record<string, { c: string; bg: string }> = {
  Construction:        { c: "#1a3c6e", bg: "#eaf2fb" },
  "Systems & Design":  { c: "#7c3aed", bg: "#f5f3ff" },
  Supply:              { c: "#c8860a", bg: "#fbf6ed" },
};

/* ─── Service Modal ─── */
function ServiceModal({
  service,
  related,
  onClose,
}: {
  service: Service;
  related: Project[];
  onClose: () => void;
}) {
  const gallery = useMemo(() => {
    if (service.gallery?.length) return service.gallery;
    const fromProjects = related.flatMap(p => p.imgs.slice(0, 1));
    return [service.image, ...fromProjects].slice(0, 6);
  }, [service.gallery, service.image, related]);

  const [idx, setIdx] = useState(0);
  const total = gallery.length;

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
  }, [onClose]);

  const groupColor = GROUP_COLORS[service.group];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-3 sm:p-4 lg:items-center"
      style={{ background: "rgba(8,16,36,0.93)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="my-auto bg-white dark:bg-darklight rounded-2xl w-full max-h-[calc(100dvh-24px)] overflow-y-auto lg:overflow-hidden flex flex-col"
        style={{ maxWidth: 1180 }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 flex-shrink-0"
          style={{ background: "linear-gradient(90deg,#1a3c6e,#2d5fa3)" }}>
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest mb-1 block"
              style={{ color: "#4fa3d1" }}>{service.group}</span>
            <h2 className="text-white font-black leading-tight mb-1"
              style={{ fontFamily: "var(--font-barlow,sans-serif)", fontSize: "clamp(1rem,2.5vw,1.4rem)" }}>
              {service.title}
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
              {service.cat
                ? `${related.length} completed project${related.length === 1 ? "" : "s"}`
                : service.tag}
            </p>
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.15)" }} aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Split body */}
        <div className="flex flex-col lg:flex-row lg:min-h-0 lg:flex-1">

          {/* Left: image + gallery */}
          <div className="flex flex-col lg:min-h-0 lg:w-[58%]">
            <div className="relative h-[240px] sm:h-[320px] lg:h-auto lg:flex-1 lg:min-h-[340px] overflow-hidden" style={{ background: "#060e20" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gallery[idx]} alt="" aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 blur-2xl"
                style={{ objectFit: "cover", opacity: 0.48 }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gallery[idx]} alt={service.title}
                className="relative z-[1] h-full w-full"
                style={{ objectFit: "contain", display: "block" }} />
              <div className="absolute inset-0 z-[2] pointer-events-none"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)" }} />

              {/* Counter */}
              {total > 1 && (
                <div className="absolute top-3 right-3 z-[3] text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  {idx + 1} / {total}
                </div>
              )}

              {/* Arrows */}
              {idx > 0 && (
                <button onClick={prev}
                  className="absolute left-3 top-1/2 z-[3] -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ background: "rgba(10,20,40,0.65)" }} aria-label="Previous">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {idx < total - 1 && (
                <button onClick={next}
                  className="absolute right-3 top-1/2 z-[3] -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ background: "rgba(10,20,40,0.65)" }} aria-label="Next">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="px-6 py-3 border-t border-border dark:border-dark_border bg-section dark:bg-darkmode overflow-x-auto flex-shrink-0">
                <div className="flex gap-3 min-w-max">
                  {gallery.map((img, i) => (
                    <button key={`${img}-${i}`} onClick={() => setIdx(i)}
                      className="relative h-16 w-24 overflow-hidden rounded-xl border-2 transition-all duration-300"
                      style={{
                        borderColor: i === idx ? "#1a3c6e" : "rgba(207,227,240,0.85)",
                        transform: i === idx ? "scale(1.04)" : "scale(1)",
                        boxShadow: i === idx ? "0 12px 28px rgba(26,60,110,0.18)" : "none",
                      }}
                      aria-label={`View photo ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="px-6 py-5 flex-1 lg:min-h-0 lg:w-[42%] lg:overflow-y-auto lg:border-l lg:border-border lg:dark:border-dark_border">

            <p className="text-sm text-gray leading-relaxed mb-5">{service.desc}</p>

            {/* Deliverables */}
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#1a3c6e" }}>
              What&apos;s included
            </p>
            <ul className="space-y-2 mb-6">
              {service.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-midnight_text dark:text-white">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
                    style={{ color: "#4fa3d1" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            {/* Related projects */}
            {related.length > 0 && (
              <div className="border-t border-border dark:border-dark_border pt-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#1a3c6e" }}>
                  Recent projects
                </p>
                <ul className="space-y-2">
                  {related.slice(0, 4).map((p, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-midnight_text dark:text-white font-semibold leading-snug">
                        {p.title}
                      </span>
                      <span className="text-gray whitespace-nowrap">{p.year}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-wrap gap-2 justify-end">
              {service.cat && (
                <Link href="/projects"
                  className="inline-flex items-center gap-2 px-4 py-2.5 font-bold text-white rounded-xl text-xs transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
                  View {service.cat} projects →
                </Link>
              )}
              <Link href="/ETL-Quotation-Request.html"
                className="inline-flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-xs transition-all hover:-translate-y-0.5 border-2"
                style={{ borderColor: groupColor.c, color: groupColor.c, background: "#fff" }}>
                Request a quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Features Section ─── */
export default function Features() {
  const [active, setActive]     = useState<ServiceGroup>("All");
  const [selected, setSelected] = useState<Service | null>(null);

  const counts = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const p of projects) byCat[p.cat] = (byCat[p.cat] ?? 0) + 1;
    return byCat;
  }, []);

  const filtered = active === "All" ? services : services.filter(s => s.group === active);

  const getRelated = (s: Service): Project[] =>
    s.cat ? projects.filter(p => p.cat === s.cat) : [];

  const groupCount = (g: ServiceGroup) =>
    g === "All" ? services.length : services.filter(s => s.group === g).length;

  return (
    <section id="services" className="pt-12 pb-10"
      style={{ background: "var(--etl-section-gradient)" }}>
      <div className="container px-4 lg:max-w-screen-xl md:max-w-screen-md mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-10" data-aos="fade-up">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
            style={{ color: "#4fa3d1", borderColor: "var(--etl-pill-border)", background: "var(--etl-pill-bg)" }}>
            Expertise
          </span>
          <h2 className="font-black text-midnight_text dark:text-white mb-4"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>
            Services
          </h2>
          <div className="w-16 h-1 rounded-full mb-5" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />
          <p className="text-gray max-w-xl text-base leading-relaxed">
            End-to-end engineering solutions across civil, structural, mechanical, electrical and water infrastructure disciplines.
          </p>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {GROUPS.map(g => (
            <button key={g} onClick={() => setActive(g)}
              className="px-5 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200"
              style={active === g
                ? { background: "#1a3c6e", borderColor: "#1a3c6e", color: "#fff" }
                : { background: "#fff", borderColor: "#cfe3f0", color: "#64748b" }}>
              {g}
              <span className="ml-1.5 text-xs opacity-70">({groupCount(g)})</span>
            </button>
          ))}
        </div>

        {/* ── Services Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filtered.map((s, i) => {
            const count = s.cat ? counts[s.cat] ?? 0 : 0;
            const badgeText = s.cat
              ? `${count} ${count === 1 ? "project" : "projects"}`
              : s.tag ?? "Service";
            const groupColor = GROUP_COLORS[s.group];

            return (
              <button key={s.slug}
                onClick={() => setSelected(s)}
                className="etl-svc-card text-left"
                data-aos="fade-up" data-aos-delay={`${i * 60}`}
                aria-label={`${s.title} — view details`}>

                {/* Background image */}
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="etl-svc-bg object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Gradient overlay */}
                <div className="etl-svc-overlay" />

                {/* Badge */}
                <div className="etl-svc-badge"
                  style={{ color: groupColor.c, background: groupColor.bg }}>
                  {badgeText}
                </div>

                {/* Content */}
                <div className="etl-svc-content">
                  <div className="etl-svc-line" />
                  <h3 className="etl-svc-title">{s.title}</h3>
                  <p className="etl-svc-desc">{s.desc}</p>
                  <span className="etl-svc-cta">
                    View details
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── CTA strip ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl px-8 py-6 border border-border dark:border-dark_border bg-white dark:bg-darklight"
          data-aos="fade-up">
          <div>
            <p className="font-black text-midnight_text dark:text-white text-xl mb-1"
              style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
              Need a custom engineering solution?
            </p>
            <p className="text-gray text-sm">Our team responds within 24 hours with a competitive quote.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/ETL-Quotation-Request.html"
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
              style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}
            >
              Request a Quotation
            </Link>
            <Link
              href="/ETL-LPO-System.html?mode=inward"
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
              style={{ background: "linear-gradient(135deg,#c8860a,#e6a830)" }}
            >
              Submit a Local Purchase Order
            </Link>
          </div>

      </div>
    </div>

      {/* ── Modal ── */}
      {selected && (
        <ServiceModal
          service={selected}
          related={getRelated(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Service card styles ── */}
      <style>{`
        .etl-svc-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          height: 320px;
          width: 100%;
          display: block;
          box-shadow: 0 4px 20px rgba(26,60,110,0.12);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          cursor: pointer;
          border: 0;
          padding: 0;
          background: transparent;
        }
        .etl-svc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(26,60,110,0.22);
        }
        .etl-svc-bg {
          transition: transform 0.5s ease !important;
        }
        .etl-svc-card:hover .etl-svc-bg {
          transform: scale(1.07) !important;
        }
        .etl-svc-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom,
            rgba(0,0,0,0.05) 0%,
            rgba(0,0,0,0.30) 50%,
            rgba(0,0,0,0.82) 100%
          );
          transition: background 0.4s ease;
        }
        .etl-svc-card:hover .etl-svc-overlay {
          background: linear-gradient(to bottom,
            rgba(0,0,0,0.10) 0%,
            rgba(0,0,0,0.40) 50%,
            rgba(0,0,0,0.88) 100%
          );
        }
        .etl-svc-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 2;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18);
        }
        .etl-svc-content {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 24px 26px 28px;
          z-index: 2;
        }
        .etl-svc-line {
          width: 36px;
          height: 3px;
          background: #4fa3d1;
          border-radius: 999px;
          margin-bottom: 10px;
          transition: width 0.3s ease;
        }
        .etl-svc-card:hover .etl-svc-line {
          width: 60px;
        }
        .etl-svc-title {
          font-family: var(--font-barlow, 'Barlow Condensed', sans-serif);
          font-size: 1.4rem;
          font-weight: 900;
          color: #fff !important;
          text-shadow: 0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.2;
          margin: 0 0 8px;
        }
        .etl-svc-desc {
          font-size: 0.825rem;
          color: rgba(255,255,255,0.78);
          line-height: 1.6;
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease;
          margin: 0;
        }
        .etl-svc-card:hover .etl-svc-desc {
          max-height: 110px;
          opacity: 1;
          margin: 0 0 10px;
        }
        .etl-svc-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4fa3d1;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s;
        }
        .etl-svc-card:hover .etl-svc-cta {
          opacity: 1;
          transform: translateY(0);
        }
        /* Touch devices: always show desc + cta so the card is usable without hover */
        @media (hover: none) {
          .etl-svc-desc {
            max-height: 110px;
            opacity: 1;
            margin: 0 0 10px;
          }
          .etl-svc-cta {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
