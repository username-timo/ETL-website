"use client";
import React, { useState } from 'react';

const testimonials = [
  {
    quote: "ETL delivered our school's electrical installation on time and within budget. Their team was professional, clean and highly skilled. We've been working with them for over 5 years now.",
    name: "Mr. James Okello",
    role: "Head Teacher, St. Mary's College Mukono",
    initials: "JO",
    color: "#1a3c6e",
  },
  {
    quote: "The procurement service from ETL is outstanding. They source quality materials at competitive prices and always provide proper documentation. An incredibly reliable partner.",
    name: "Eng. Sarah Namutebi",
    role: "Project Manager, Ministry of Works",
    initials: "SN",
    color: "#4fa3d1",
  },
  {
    quote: "We contracted ETL for plumbing and civil works at our new office complex. Excellent project management — no delays, no surprises, full transparency. Will definitely use them again.",
    name: "David Tumwine",
    role: "Director, Kampala Business Park",
    initials: "DT",
    color: "#c8860a",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const t = testimonials[active];

  return (
    <section className="py-24 bg-white dark:bg-darkmode">
      <div className="container lg:max-w-screen-xl md:max-w-screen-md px-4 sm:px-6 lg:px-8 mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-14" data-aos="fade-up">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
            style={{ color: "#4fa3d1", borderColor: "#cfe3f0", background: "#f0f6fb" }}>
            Client Testimonials
          </span>
          <h2 className="font-black text-midnight_text dark:text-white mb-4"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>
            What Our Clients Say
          </h2>
          <div className="w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />
        </div>

        {/* ── Cards row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" data-aos="fade-up">
          {testimonials.map((item, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`text-left rounded-2xl p-6 border-2 transition-all duration-300 ${i === active ? 'shadow-deatail_shadow -translate-y-1' : 'hover:shadow-property hover:-translate-y-0.5'}`}
              style={{
                borderColor: i === active ? item.color : "#cfe3f0",
                background: i === active ? "white" : "#f5f9fd",
              }}>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4" fill="#f59e0b" viewBox="0 0 24 24">
                    <path d="M12 .587l3.668 7.431L24 9.763l-6 5.847L19.336 24 12 20.019 4.664 24 6 15.61 0 9.763l8.332-1.745z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray text-sm leading-relaxed mb-6 line-clamp-4">
                "{item.quote}"
              </p>

              {/* Person */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-xs"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}99)` }}>
                  {item.initials}
                </div>
                <div>
                  <p className="font-bold text-midnight_text dark:text-white text-sm">{item.name}</p>
                  <p className="text-gray text-xs">{item.role}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Dot nav ── */}
        <div className="flex justify-center gap-2">
          {testimonials.map((item, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === active ? "2rem" : "0.5rem",
                background: i === active ? t.color : "#cfe3f0",
              }}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
