const turnovers = [
  { fy: "FY 2021/2022", amount: "17.24B", full: "UGX 17,243,583,212", growth: "—", width: 88 },
  { fy: "FY 2022/2023", amount: "18.45B", full: "UGX 18,450,634,037", growth: "+7.0%", width: 94 },
  { fy: "FY 2023/2024", amount: "18.82B", full: "UGX 18,819,646,718", growth: "+2.0%", width: 97 },
];

const capacities = [
  { icon: "🏦", label: "Bankers", value: "Equity Bank Uganda Ltd" },
  { icon: "📊", label: "Average Annual Turnover", value: "UGX 18,171,287,989" },
  { icon: "📋", label: "PPDA Registration", value: "PRV/WKRS/25051515" },
  { icon: "🗓️", label: "PPDA Validity", value: "23 May 2025 → 23 May 2026" },
  { icon: "✅", label: "VAT Registered", value: "No. 49481-L" },
  { icon: "🧾", label: "Auditors", value: "Kasawuli Associates CPA" },
];

const ppdaCategories = [
  "Building / Construction",
  "Civil Engineering",
  "Community Access Roads",
  "Roads & Bridges",
  "Warehouses",
];

export default function Turnover() {
  return (
    <section className="pt-10 pb-8 dark:bg-darkmode"
      style={{ background: "linear-gradient(160deg,#f5f9fd 0%,#eaf2fb 100%)" }}>
      <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16" data-aos="fade-up">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
            style={{ color: "#4fa3d1", borderColor: "#cfe3f0", background: "#fff" }}>
            Financial Capacity
          </span>
          <h2 className="font-black text-midnight_text dark:text-white mb-4"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1 }}>
            Annual Construction Turnover
          </h2>
          <div className="w-16 h-1 rounded-full mb-5" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />
          <p className="text-gray max-w-xl text-base leading-relaxed">
            ETL demonstrates consistent financial growth and the capacity to handle large-scale engineering and procurement contracts across Uganda.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* ── Left column: Bar chart + PPDA categories ── */}
          <div className="space-y-5" data-aos="fade-right">
            <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-8 shadow-sm">
              <h3 className="font-black text-midnight_text dark:text-white text-xl mb-8"
                style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                Certified Payments Received (UGX)
              </h3>
              <div className="space-y-7">
                {turnovers.map((t, i) => (
                  <div key={i} data-aos="fade-right" data-aos-delay={`${i * 80}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-midnight_text dark:text-white">{t.fy}</span>
                      <div className="flex items-center gap-2">
                        {t.growth !== "—" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "#e6f7ef", color: "#0f7a4a" }}>
                            {t.growth}
                          </span>
                        )}
                        <span className="text-sm font-black text-primary dark:text-secondary"
                          style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                          {t.amount}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray mb-2 font-mono">{t.full}</p>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "#e2eaf3" }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${t.width}%`,
                          background: i === 2
                            ? "linear-gradient(90deg,#1a3c6e,#4fa3d1)"
                            : i === 1
                            ? "linear-gradient(90deg,#1a3c6e,#3d7ab5)"
                            : "linear-gradient(90deg,#1a3c6e,#2d5fa3)",
                        }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Average */}
              <div className="mt-10 pt-6 border-t border-border dark:border-dark_border">
                <p className="text-xs text-gray font-semibold uppercase tracking-widest mb-1">3-Year Average Annual Turnover</p>
                <p className="font-black text-midnight_text dark:text-white"
                  style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "1.75rem", lineHeight: 1 }}>
                  UGX 18,171,287,989
                </p>
                <p className="text-xs text-gray mt-1">
                  *Average calculated as total certified payments ÷ number of years (per PPDA Sub-Factor 6.2.5)
                </p>
              </div>
            </div>

            {/* PPDA work categories — moved here to fill left gap */}
            <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-midnight_text dark:text-white text-xl"
                  style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                  PPDA Work Categories
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "#e6f7ef", color: "#0f7a4a" }}>
                  Certified
                </span>
              </div>
              <p className="text-xs text-gray mb-4 leading-relaxed">
                Registered by the Public Procurement &amp; Disposal of Public Assets Authority to bid on public works in the following disciplines:
              </p>
              <div className="flex flex-wrap gap-2">
                {ppdaCategories.map((cat, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                    style={{ color: "#1a3c6e", borderColor: "#cfe3f0", background: "#f0f6fb" }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: Capacity cards + Compliant banner ── */}
          <div className="space-y-5" data-aos="fade-left" data-aos-delay="100">
            <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-7 shadow-sm">
              <h3 className="font-black text-midnight_text dark:text-white text-xl mb-6"
                style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                Financial &amp; Legal Capacity
              </h3>
              <div className="space-y-3">
                {capacities.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: i % 2 === 0 ? "#f5f9fd" : "#fff" }}>
                    <span className="text-xl flex-shrink-0">{c.icon}</span>
                    <div>
                      <p className="text-xs text-gray font-semibold uppercase tracking-wide mb-0.5">{c.label}</p>
                      <p className="font-bold text-midnight_text dark:text-white text-sm">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1,#c8860a)" }} />
              <div className="bg-white dark:bg-darklight border border-t-0 border-border dark:border-dark_border p-6">
                <p className="text-sm text-gray leading-relaxed">
                  <span className="font-black text-midnight_text dark:text-white">Fully compliant: </span>
                  ETL maintains all statutory compliance — URA tax clearance, NSSF, PPDA registration, VAT and incorporation certificates — ensuring smooth engagement on government and donor-funded contracts.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
