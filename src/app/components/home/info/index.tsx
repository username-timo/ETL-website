import Link from 'next/link';

const stats = [
  { value: "19+", label: "Years of Service Since 2006", icon: "🏆" },
  { value: "40+", label: "Documented Projects Delivered", icon: "✅" },
  { value: "UGX 18.17B", label: "Average Annual Turnover", icon: "📊" },
];

export default function CompanyInfo() {
  return (
    <section className="py-0 pb-24 dark:bg-darkmode">
      <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden shadow-deatail_shadow"
          style={{ background: "linear-gradient(135deg, #1a3c6e 0%, #2d5fa3 50%, #1a3c6e 100%)" }}>

          {/* Top accent */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#4fa3d1,#c8860a,#4fa3d1)" }} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">

            {/* ── Stats ── */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 p-2">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-2 p-8 text-center"
                  data-aos={i === 0 ? "fade-right" : i === 1 ? "fade-up" : "fade-left"}
                  data-aos-delay={`${i * 100}`}>
                  <span className="text-3xl mb-1">{s.icon}</span>
                  <p className="font-black text-white leading-none"
                    style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2.5rem, 4vw, 3.5rem)" }}>
                    {s.value}
                  </p>
                  <p className="text-white/70 text-sm font-semibold leading-tight max-w-[120px]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── CTA ── */}
            <div className="lg:col-span-2 flex flex-col justify-center px-10 py-12 bg-white/5 border-l border-white/10"
              data-aos="fade-left">
              <h3 className="font-black text-white mb-3"
                style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(1.5rem, 2.5vw, 2rem)", lineHeight: 1.2 }}>
                Ready to Start Your Project?
              </h3>
              <p className="text-white/70 text-sm mb-8 leading-relaxed">
                Get a free consultation and competitive quotation. Our team delivers quality engineering solutions — on time, every time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/ETL-Quotation-Request.html"
                  className="flex-1 text-center px-6 py-3 bg-white font-bold rounded-xl text-sm hover:bg-secondary hover:text-white transition-all"
                  style={{ color: "#1a3c6e" }}>
                  📋 Get a Free Quote
                </Link>
                <Link href="/contact"
                  className="flex-1 text-center px-6 py-3 border-2 border-white text-white font-bold rounded-xl text-sm hover:bg-white hover:text-primary transition-all">
                  📞 Call Us
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
