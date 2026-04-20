"use client";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="relative z-10 bg-midnight_text dark:bg-semidark">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md pt-10 pb-5 px-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4">

          {/* Logo + Tagline */}
          <div className="md:col-span-4 col-span-12 flex flex-col justify-start px-4 sm:px-0">
            <Link href="/" className="mb-4 inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <span className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>ETL</span>
              </div>
              <div>
                <span className="block text-white font-bold text-base tracking-wide" style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                  ENGINEERING TRADE LINKS
                </span>
                <span className="block text-gray text-xs tracking-widest uppercase">Co. Ltd — Uganda</span>
              </div>
            </Link>
            <p className="text-gray text-sm mb-5 max-w-xs">
              Procurement, supply and engineering solutions for East Africa. Reliable. Efficient. Professional.
            </p>
            <div className="flex items-center gap-2">
              <a aria-label="Chat on WhatsApp" href="https://wa.me/256776566522?text=Hello%20ETL%2C%20I%20would%20like%20to%20enquire%20about%20your%20engineering%20and%20procurement%20services." target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white bg-opacity-20 hover:bg-[#25D366] transition-colors text-white text-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="md:col-span-8 col-span-12 grid grid-cols-12 gap-4 px-4 sm:px-0">
            {/* Address */}
            <div className="w-full lg:col-span-4 col-span-12">
              <h4 className="mb-4 text-lg text-white font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                Address
              </h4>
              <p className="mb-2 text-gray text-sm">Plot 1353, Sonde-Seeta Road</p>
              <p className="mb-1 text-gray text-sm">Goma Division, Mukono, Uganda</p>
              <p className="mb-4 text-gray text-sm">P.O. Box 27555, Kampala</p>
              <p className="text-gray text-sm mb-1">
                <span className="text-white">Phone: </span>+256 776 566 522 / +256 704 545 163
              </p>
              <p className="text-gray text-sm">
                <span className="text-white">Email: </span>tradelinksltd@gmail.com
              </p>
            </div>

            {/* Quick Links */}
            <div className="w-full lg:col-span-4 col-span-12">
              <h4 className="mb-4 text-lg text-white font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                Quick Links
              </h4>
              <ul>
                <li><Link href="/" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Home</Link></li>
                <li><a href="/ETL-Quotation-Request.html" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Request a Quotation</a></li>
                <li><Link href="/#services" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/contact" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div className="w-full lg:col-span-4 col-span-12">
              <h4 className="mb-4 text-lg text-white font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-barlow, sans-serif)" }}>
                Our Services
              </h4>
              <ul>
                <li><a href="/ETL-Quotation-Request.html" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Electrical Works</a></li>
                <li><a href="/ETL-Quotation-Request.html" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Mechanical & Plumbing</a></li>
                <li><a href="/ETL-Quotation-Request.html" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Civil Works</a></li>
                <li><a href="/ETL-Quotation-Request.html" className="mb-3 inline-block text-sm text-gray hover:text-white transition-colors">Supply & Procurement</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border dark:border-dark_border py-6">
        <div className="container flex flex-col lg:flex-row justify-between items-center mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 gap-4">
          <p className="text-gray text-sm text-center lg:text-left">
            © {new Date().getFullYear()} Engineering Trade Links Co. Ltd. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/contact" className="text-sm text-gray hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="text-sm text-gray hover:text-white transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
