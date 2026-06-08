"use client";

import { useEffect, useState } from "react";

interface ContactHeroSliderProps {
  title: string;
  description: string;
}

type SlideFit = "cover" | "contain" | "wide";
type SlideTextMode = "standard" | "caption";

interface ContactHeroSlide {
  img: string;
  fit?: SlideFit;
  textMode?: SlideTextMode;
  caption?: string;
}

const slides = [
  {
    img: "/upscaled-ETL-images/ETL%20SIGN%20POST.png",
    fit: "wide",
    textMode: "caption",
    caption: "Tenders | Quotations | Project Partnerships",
  },
  {
    img: "/etl-images/naguru-asphalt-08.jpg.jpeg",
    fit: "contain",
  },
  {
    img: "/etl-images/iraji-bridge-02.jpg",
  },
  {
    img: "/etl-images/makindye-court-01.jpg",
  },
  {
    img: "/etl-images/mtn-bubada-01.jpg",
  },
] satisfies ContactHeroSlide[];

export default function ContactHeroSlider({
  title,
  description,
}: ContactHeroSliderProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => setCurrent(i);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);
  const activeSlide = slides[current];
  const captionOnly = activeSlide.textMode === "caption";

  return (
    <section className="relative w-full overflow-hidden py-0" style={{ height: "clamp(320px, 50vw, 620px)" }}>
      {slides.map((slide, i) => (
        <div
          key={slide.img}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          {slide.fit === "contain" || slide.fit === "wide" ? (
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-xl"
              style={{ backgroundImage: `url(${slide.img})` }}
            />
          ) : null}
          <div
            className={`absolute inset-0 bg-center bg-no-repeat ${slide.fit === "contain" ? "bg-contain" : slide.fit === "wide" ? "" : "bg-cover"}`}
            style={{
              backgroundImage: `url(${slide.img})`,
              backgroundSize: slide.fit === "wide" ? "100% auto" : undefined,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: slide.textMode === "caption"
                ? "linear-gradient(to bottom, rgba(8,18,36,0.32) 0%, rgba(8,18,36,0.2) 52%, rgba(8,18,36,0.62) 100%)"
                : "linear-gradient(to bottom, rgba(8,18,36,0.6) 0%, rgba(8,18,36,0.5) 55%, rgba(8,18,36,0.75) 100%)",
            }}
          />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full max-w-screen-xl flex-col items-center justify-end px-4 pb-14 text-center text-white sm:pb-16 lg:pb-20">
        {captionOnly ? (
          <p className="mb-8 max-w-3xl text-xs font-semibold uppercase tracking-[0.28em] text-white/80 drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] sm:text-sm">
            {activeSlide.caption}
          </p>
        ) : (
          <>
            <h1
              className="mb-4 max-w-5xl text-balance font-black tracking-[0.03em] text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
              style={{
                fontFamily: "'Titillium Web', 'Barlow Condensed', sans-serif",
                fontSize: "clamp(2.1rem, 5vw, 4rem)",
                lineHeight: 1.02,
                opacity: 0.7,
              }}
            >
              {title}
            </h1>
            <p className="mb-7 max-w-3xl text-sm text-white/75 sm:text-base">{description}</p>
          </>
        )}
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 text-white transition-all hover:bg-white/20"
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 text-white transition-all hover:bg-white/20"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.img}
            onClick={() => goTo(i)}
            className="rounded-full border border-white/60 transition-all duration-300"
            style={{
              width: i === current ? "1.8rem" : "0.55rem",
              height: "0.55rem",
              background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
