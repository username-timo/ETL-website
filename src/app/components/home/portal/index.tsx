export default function Portal() {
  return (
    <section id="portal" className="py-8"
      style={{ background: "var(--etl-portal-gradient)" }}>

      {/* Top accent */}
      <div className="h-1 w-full -mt-8 mb-6" style={{ background: "linear-gradient(90deg,#4fa3d1,#c8860a,#4fa3d1)" }} />

      <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10" data-aos="fade-up">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full"
            style={{ color: "#4fa3d1", border: "1px solid rgba(79,163,209,0.4)", background: "rgba(255,255,255,0.08)" }}>
            Client Portal
          </span>
          <h2 className="font-black text-white mb-4"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1 }}>
            Access ETL Services
          </h2>
          <div className="w-16 h-1 rounded-full mb-5" style={{ background: "linear-gradient(90deg,#4fa3d1,#c8860a)" }} />
          <p className="text-white/70 max-w-xl text-base leading-relaxed">
            Submit quotation requests or manage your procurement orders — all in one place.
          </p>
        </div>

        {/* Two tiles */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Tile 1: Quotation */}
          <a href="/ETL-Quotation-Request.html"
            className="group flex flex-col items-center text-center p-8 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)" }}
            data-aos="fade-right">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform duration-300 group-hover:scale-110 shadow-lg"
              style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
              📋
            </div>
            <h3 className="font-black text-white text-2xl mb-3"
              style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
              Request a Quotation
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Submit your project requirements and receive a competitive quote from our team within 24 hours.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all group-hover:gap-3"
              style={{ background: "linear-gradient(135deg,#1a3c6e,#2d5fa3)" }}>
              Get a Quote
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </a>

          {/* Tile 2: LPO System */}
          <a href="/ETL-LPO-System.html?mode=inward"
            className="group flex flex-col items-center text-center p-8 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)" }}
            data-aos="fade-left">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform duration-300 group-hover:scale-110 shadow-lg"
              style={{ background: "linear-gradient(135deg,#c8860a,#e6a830)" }}>
              🗂️
            </div>
            <h3 className="font-black text-white text-2xl mb-3"
              style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
              LPO Management
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Track and manage Local Purchase Orders, invoices, inventory, and procurement documentation online.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all group-hover:gap-3"
              style={{ background: "linear-gradient(135deg,#c8860a,#e6a830)" }}>
              Submit LPO
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}
