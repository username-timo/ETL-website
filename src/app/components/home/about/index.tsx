import Image from 'next/image';

const registrations = [
  { label: "Registration No.", value: "82786" },
  { label: "Year Incorporated", value: "2006" },
  { label: "TIN", value: "1000161539" },
  { label: "VAT Reg No.", value: "49481-L" },
  { label: "PPDA Reg No.", value: "PRV/WKRS/25051515" },
  { label: "Trading License", value: "2026 (Current)" },
  { label: "Bankers", value: "Equity Bank Uganda Ltd" },
  { label: "Auditors", value: "Kasawuli Associates CPA" },
];

const objectives = [
  {
    title: "Client Satisfaction",
    desc: "Effective and efficient complaints-handling processes oriented to ensure complete project-owner satisfaction and continuous improvement of every construction element we execute.",
  },
  {
    title: "Growth & Innovation",
    desc: "Increased volume of work with a focus on technology improvement, work efficiency, and constant evolution of construction methods and employee competencies.",
  },
  {
    title: "Environmental Stewardship",
    desc: "Maintaining a win-win environment for all parties in our value chain, with environmental preservation and protection as a fundamental goal of every project.",
  },
  {
    title: "Sustainable Impact",
    desc: "Sustainability in service delivery covering social development, economic growth, and eradication of poverty and hunger to ensure healthy communities.",
  },
  {
    title: "Disciplined Profitability",
    desc: "Maximising daily profitability of individual projects and the company overall, focusing on bottom-line results by ensuring deliverables are executed correctly and accurately.",
  },
];

const highlights = [
  { icon: "🏗️", value: "19+", label: "Years in Operation" },
  { icon: "📋", value: "40+", label: "Projects Delivered" },
  { icon: "🇺🇬", value: "UGX 18B+", label: "Annual Turnover" },
  { icon: "👷", value: "50+", label: "Skilled Staff" },
];

export default function About() {
  return (
    <section id="about" className="pt-24 pb-8 bg-white dark:bg-darkmode">
      <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8">

        <div className="relative flex flex-col items-start text-left mb-12 sm:mb-16 pt-16 pb-6 sm:pt-20 sm:pb-10">
          <div
            className="absolute -right-10 -top-14 sm:right-8 sm:-top-4 pointer-events-none select-none"
            aria-hidden="true"
          >
            <Image
              src="/etl-images/etl-logo.png"
              alt=""
              width={280}
              height={280}
              className="object-contain opacity-[0.58] sm:opacity-[0.46] dark:opacity-[0.28]"
            />
          </div>

          <h2 className="relative z-10 font-black text-midnight_text dark:text-white mb-3"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1 }}>
            About ETL
          </h2>
          <span className="relative z-10 inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
            style={{ color: "#4fa3d1", borderColor: "#cfe3f0", background: "#f0f6fb" }}>
            Who We Are
          </span>
          <div className="relative z-10 w-16 h-1 rounded-full mb-6" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#c8860a" }}>
              "Quality at Service"
            </p>
            <h3 className="font-black text-midnight_text dark:text-white mb-5"
              style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(1.4rem,2.5vw,2rem)", lineHeight: 1.2 }}>
              Engineering Trade Links Co. Ltd
            </h3>
            <p className="text-gray leading-relaxed mb-5 text-base">
              Established in Uganda in 2006, Engineering Trade Links Co. Ltd (ETL) operates as a Private Limited
              Liability Company. ETL integrates talent, skills, experience, professionalism, and expertise to meet
              the diverse needs of its clients across civil engineering, road construction, water engineering,
              electro-mechanical systems, and supply &amp; procurement.
            </p>

            <div className="space-y-3 mb-7">
              <div className="rounded-xl p-4 border-l-4 bg-section dark:bg-darklight" style={{ borderColor: "#1a3c6e" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-primary dark:text-secondary">Vision</p>
                <p className="text-sm text-midnight_text dark:text-white font-semibold leading-relaxed">
                  Deliver superior quality service that exceeds the standards set by our peer providers in Africa.
                </p>
              </div>
              <div className="rounded-xl p-4 border-l-4 bg-section dark:bg-darklight" style={{ borderColor: "#c8860a" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#c8860a" }}>Mission</p>
                <p className="text-sm text-midnight_text dark:text-white font-semibold leading-relaxed">
                  Transform ideas into reality by fostering long-term relationships built on trust, integrity, and performance &mdash; ensuring complete client satisfaction while preserving and protecting the environment.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col">
            <div className="rounded-xl border border-border dark:border-dark_border overflow-hidden flex flex-col flex-1">
              <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-white"
                style={{ background: "linear-gradient(90deg,#1a3c6e,#2d5fa3)" }}>
                Corporate Identity
              </div>
              <table className="w-full text-sm h-full">
                <tbody>
                  {registrations.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-section dark:bg-darklight" : "bg-white dark:bg-darkmode"}>
                      <td className="px-4 py-2.5 font-semibold text-midnight_text dark:text-white w-1/2 text-xs">{r.label}</td>
                      <td className="px-4 py-2.5 text-gray dark:text-gray font-mono text-xs">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex flex-col items-center text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
              style={{ color: "#c8860a", borderColor: "#f0e0bf", background: "#fbf6ed" }}>
              What Drives Us
            </span>
            <h3 className="font-black text-midnight_text dark:text-white mb-3"
              style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(1.6rem,3vw,2.25rem)", lineHeight: 1.15 }}>
              Goals &amp; Objectives
            </h3>
            <div className="w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg,#c8860a,#e6a830)" }} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {objectives.map((o, i) => (
              <div key={i}
                className="relative rounded-2xl p-6 border border-border dark:border-dark_border bg-section dark:bg-darklight hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg mb-4 text-white font-black text-sm"
                  style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
                  {i + 1}
                </div>
                <h4 className="font-bold text-midnight_text dark:text-white mb-2 text-base"
                  style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                  {o.title}
                </h4>
                <p className="text-gray text-sm leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
          {highlights.map((h, i) => (
            <div key={i}
              className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-border dark:border-dark_border bg-section dark:bg-darklight hover:-translate-y-1 transition-all duration-300"
              data-aos-delay={`${i * 60}`}>
              <span className="text-3xl mb-2">{h.icon}</span>
              <p className="font-black text-midnight_text dark:text-white text-2xl leading-none mb-1"
                style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                {h.value}
              </p>
              <p className="text-gray text-xs font-semibold uppercase tracking-wide">{h.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
