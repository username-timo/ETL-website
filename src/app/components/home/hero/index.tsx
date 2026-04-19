"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    img: "https://engineeringtradelinks.com/wp-content/uploads/2025/09/engineering-tradelinks-41.jpg",
    headline: "Quality at Service",
    sub: "Engineering Trade Links",
  },
  {
    img: "https://engineeringtradelinks.com/wp-content/uploads/2025/09/engineering-tradelinks-42.jpg",
    headline: "Built to Last",
    sub: "Engineering Trade Links",
  },
  {
    img: "https://engineeringtradelinks.com/wp-content/uploads/2025/09/engineering-tradelinks-47.jpg",
    headline: "Delivering Excellence",
    sub: "Engineering Trade Links",
  },
  {
    img: "https://engineeringtradelinks.com/wp-content/uploads/2025/06/engineering-tradelinks-17-1.jpg",
    headline: "Your Trusted Partner",
    sub: "Engineering Trade Links",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(true);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % slides.length);
        setAnimating(true);
      }, 100);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => {
    setAnimating(false);
    setTimeout(() => { setCurrent(i); setAnimating(true); }, 100);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "100vh", minHeight: 560 }}>

      {/* ── Slides ── */}
      {slides.map((s, i) => (
        <div key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}>
          {/* Background image */}
          <div className="absolute inset-0 bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(${s.img})`, backgroundPosition: "center" }} />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,20,40,0.55) 0%, rgba(10,20,40,0.45) 60%, rgba(10,20,40,0.7) 100%)" }} />
        </div>
      ))}

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <p
          className="text-white/80 font-semibold tracking-[0.4em] uppercase mb-4 text-sm md:text-base"
          style={{
            fontFamily: "'Titillium Web', 'DM Sans', sans-serif",
            opacity: animating ? 1 : 0,
            transform: animating ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
          }}>
          {slides[current].sub}
        </p>

        <h1
          className="text-white font-black mb-8"
          style={{
            fontFamily: "'Titillium Web', 'Barlow Condensed', sans-serif",
            fontSize: "clamp(2.8rem, 8vw, 6rem)",
            lineHeight: 1.05,
            textShadow: "0 4px 24px rgba(0,0,0,0.4)",
            opacity: animating ? 1 : 0,
            transform: animating ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s",
          }}>
          {slides[current].headline}
        </h1>

        <a
          href="/#about"
          className="inline-flex items-center gap-3 border-2 border-white/60 text-white font-bold uppercase tracking-widest px-8 py-3.5 rounded-sm hover:bg-white hover:text-primary transition-all duration-300 text-sm"
          style={{
            opacity: animating ? 1 : 0,
            transform: animating ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
          }}>
          About Us
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* ── Arrow controls ── */}
      <button onClick={prev}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border-2 border-white/50 text-white flex items-center justify-center hover:bg-white/20 transition-all"
        aria-label="Previous slide">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button onClick={next}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border-2 border-white/50 text-white flex items-center justify-center hover:bg-white/20 transition-all"
        aria-label="Next slide">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300 border border-white/60"
            style={{
              width: i === current ? "2rem" : "0.6rem",
              height: "0.6rem",
              background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Bottom scroll hint ── */}
      <div className="absolute bottom-8 right-8 z-20 hidden md:flex flex-col items-center gap-1">
        <span className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
        <div className="w-px h-8 bg-white/30" />
      </div>

    </section>
  );
}
