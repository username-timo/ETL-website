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
              <a aria-label="Facebook" href="/#" className="p-1.5 rounded-md text-midnight_text bg-white bg-opacity-20 hover:bg-primary transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
                  <path d="M16.294 8.86875H14.369H13.6815V8.18125V6.05V5.3625H14.369H15.8128C16.1909 5.3625 16.5003 5.0875 16.5003 4.675V1.03125C16.5003 0.653125 16.2253 0.34375 15.8128 0.34375H13.3034C10.5878 0.34375 8.69714 2.26875 8.69714 5.12187V8.1125V8.8H8.00964H5.67214C5.19089 8.8 4.74402 9.17812 4.74402 9.72812V12.2031C4.74402 12.6844 5.12214 13.1313 5.67214 13.1313H7.94089H8.62839V13.8188V20.7281C8.62839 21.2094 9.00652 21.6562 9.55652 21.6562H12.7878C12.994 21.6562 13.1659 21.5531 13.3034 21.4156C13.4409 21.2781 13.544 21.0375 13.544 20.8312V13.8531V13.1656H14.2659H15.8128C16.2596 13.1656 16.6034 12.8906 16.6721 12.4781V12.4438V12.4094L17.1534 10.0375C17.1878 9.79688 17.1534 9.52187 16.9471 9.24687C16.8784 9.075 16.569 8.90312 16.294 8.86875Z" />
                </svg>
              </a>
              <a aria-label="LinkedIn" href="/#" className="p-1.5 rounded-md bg-white bg-opacity-20 hover:bg-primary transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
                  <path d="M4.98 3.5C4.98 4.881 3.87 6 2.5 6S.02 4.881.02 3.5C.02 2.12 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM5 8H0v16h5V8zm7.982 0H8.014v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0V24H24V13.869c0-7.88-8.922-7.593-11.018-3.714V8z"/>
                </svg>
              </a>
              <a aria-label="WhatsApp" href="/#" className="p-1.5 rounded-md bg-white bg-opacity-20 hover:bg-primary transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
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
