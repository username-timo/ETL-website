import Image from 'next/image';

const PLACEHOLDER = "https://engineeringtradelinks.com/wp-content/uploads/2025/06/engineering-tradelinks-11.jpg";

const team = [
  {
    name: "Mr. Brian Osuna",
    role: "Managing Director",
    qual: "B.A. Business Administration, Makerere University",
    exp: "15+ Years",
    photo: "https://engineeringtradelinks.com/wp-content/uploads/2025/06/Ben.jpg",
    accent: "#1a3c6e",
  },
  {
    name: "Ms. Vanessa Anna Aketch",
    role: "Director — Finance & Administration",
    qual: "Certified Public Accountant (CPA)",
    exp: "2 Years",
    photo: "https://engineeringtradelinks.com/wp-content/uploads/2025/06/vannesa.jpg",
    accent: "#4fa3d1",
  },
  {
    name: "Eng. Patrick Nyathingu",
    role: "Senior Civil Engineer",
    qual: "Civil Engineering, Ndejje University",
    exp: "15 Years",
    photo: "https://engineeringtradelinks.com/wp-content/uploads/2025/06/patrik.jpg",
    accent: "#0d9488",
  },
  {
    name: "Miss Tamali Scovia",
    role: "Accountant",
    qual: "Bachelor of Commerce, Makerere University",
    exp: "10 Years",
    photo: "https://engineeringtradelinks.com/wp-content/uploads/2025/06/scovia.jpg",
    accent: "#ec4899",
  },
  {
    name: "Wafula Harry",
    role: "Logistics Officer",
    qual: "Diploma in Procurement & Logistics",
    exp: "5 Years",
    photo: "https://engineeringtradelinks.com/wp-content/uploads/2025/06/harry.jpg",
    accent: "#64748b",
  },
  {
    name: "Sande Robert",
    role: "Site Agent",
    qual: "Site Supervision & Project Coordination",
    exp: "8 Years",
    photo: PLACEHOLDER,
    accent: "#f59e0b",
  },
];

export default function Staff() {
  return (
    <section id="team" className="pt-12 pb-8 bg-white dark:bg-darkmode">
      <div className="container lg:max-w-screen-xl md:max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16" data-aos="fade-up">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full border"
            style={{ color: "#4fa3d1", borderColor: "#cfe3f0", background: "#f0f6fb" }}>
            Our People
          </span>
          <h2 className="font-black text-midnight_text dark:text-white mb-4"
            style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1 }}>
            Senior Management Team
          </h2>
          <div className="w-16 h-1 rounded-full mb-5" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />
          <p className="text-gray max-w-xl text-base leading-relaxed">
            A multi-talented team of men and women qualified and experienced in management, finance, civil engineering, water works, road construction and procurement.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <div key={i}
              className="group bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border overflow-hidden hover:shadow-deatail_shadow hover:-translate-y-1 transition-all duration-300"
              data-aos="fade-up" data-aos-delay={`${i * 50}`}>

              {/* Photo */}
              <div className="relative h-72 sm:h-64 overflow-hidden bg-section dark:bg-darkmode">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-contain object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(26,60,110,0.75) 0%, transparent 50%)" }} />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full"
                    style={{ background: `${member.accent}dd` }}>
                    {member.role}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-black text-midnight_text dark:text-white text-base leading-tight mb-1"
                  style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                  {member.name}
                </h3>
                <div className="h-0.5 w-8 rounded-full mb-3" style={{ background: member.accent }} />
                <p className="text-gray text-xs leading-relaxed mb-1">{member.qual}</p>
                <p className="text-xs font-bold" style={{ color: member.accent }}>
                  {member.exp} experience
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
