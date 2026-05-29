"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Logo from "./logo";
import HeaderLink from "./navigation/HeaderLink";
import MobileHeaderLink from "./navigation/MobileHeaderLink";
import { primaryNavItems } from "@/data/navigation";

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 80);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
      setNavbarOpen(false);
    }
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (!navbarOpen) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside, navbarOpen]);

  useEffect(() => {
    document.body.style.overflow = navbarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navbarOpen]);

  return (
    <header
      className={`fixed top-0 z-50 h-20 w-full overflow-visible py-0 transition-all duration-300 lg:h-24 ${sticky ? "border-b border-gray-200 bg-white/97 shadow-md backdrop-blur-md dark:border-dark_border dark:bg-semidark/97" : "bg-black/75 shadow-none backdrop-blur-md"}`}
    >
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md flex h-full items-center justify-between px-4 py-3">
        <Logo sticky={sticky} />
        <nav
          className={`hidden flex-grow items-center justify-center space-x-5 lg:flex ${!sticky ? "[&_a:not(.lpo-btn)]:!text-white [&_a:not(.lpo-btn)]:hover:!text-secondary" : ""}`}
        >
          {primaryNavItems.map((item) => (
            <HeaderLink key={item.href} item={item} sticky={sticky} />
          ))}
        </nav>
        <div className="flex items-center space-x-3">
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-7 w-7 items-center justify-center text-body-color duration-300 dark:text-white"
          >
            <svg
              viewBox="0 0 16 16"
              className={`hidden h-5 w-5 dark:block ${!sticky && "text-white"}`}
            >
              <path d="M4.50663 3.2267L3.30663 2.03337L2.36663 2.97337L3.55996 4.1667L4.50663 3.2267ZM2.66663 7.00003H0.666626V8.33337H2.66663V7.00003ZM8.66663 0.366699H7.33329V2.33337H8.66663V0.366699V0.366699ZM13.6333 2.97337L12.6933 2.03337L11.5 3.2267L12.44 4.1667L13.6333 2.97337ZM11.4933 12.1067L12.6866 13.3067L13.6266 12.3667L12.4266 11.1734L11.4933 12.1067ZM13.3333 7.00003V8.33337H15.3333V7.00003H13.3333ZM7.99996 3.6667C5.79329 3.6667 3.99996 5.46003 3.99996 7.6667C3.99996 9.87337 5.79329 11.6667 7.99996 11.6667C10.2066 11.6667 12 9.87337 12 7.6667C12 5.46003 10.2066 3.6667 7.99996 3.6667ZM7.33329 14.9667H8.66663V13H7.33329V14.9667ZM2.36663 12.36L3.30663 13.3L4.49996 12.1L3.55996 11.16L2.36663 12.36Z" fill="#FFFFFF" />
            </svg>
            <svg
              viewBox="0 0 23 23"
              className={`h-7 w-7 text-dark dark:hidden ${!sticky && "text-white"}`}
            >
              <path d="M16.6111 15.855C17.591 15.1394 18.3151 14.1979 18.7723 13.1623C16.4824 13.4065 14.1342 12.4631 12.6795 10.4711C11.2248 8.47905 11.0409 5.95516 11.9705 3.84818C10.8449 3.9685 9.72768 4.37162 8.74781 5.08719C5.7759 7.25747 5.12529 11.4308 7.29558 14.4028C9.46586 17.3747 13.6392 18.0253 16.6111 15.855Z" />
            </svg>
          </button>

          <a
            href="/ETL-Dashboard.html"
            className={`hidden rounded-lg border px-4 py-2 text-sm font-semibold transition-all lg:block ${sticky ? "border-primary text-primary hover:bg-primary hover:text-white" : "border-white/60 text-white hover:bg-white/20"}`}
          >
            Staff Login
          </a>

          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            className="block lg:hidden p-2 rounded-lg"
            aria-label="Toggle mobile menu"
          >
            <span className={`block h-0.5 w-6 ${sticky ? "bg-black dark:bg-white" : "bg-white"}`}></span>
            <span className={`mt-1.5 block h-0.5 w-6 ${sticky ? "bg-black dark:bg-white" : "bg-white"}`}></span>
            <span className={`mt-1.5 block h-0.5 w-6 ${sticky ? "bg-black dark:bg-white" : "bg-white"}`}></span>
          </button>
        </div>
      </div>
      {navbarOpen && <div className="fixed inset-0 z-[9998] bg-black/65 lg:hidden" />}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed inset-y-0 right-0 z-[9999] h-dvh w-full overflow-y-auto bg-white dark:bg-darkmode shadow-2xl transform transition-transform duration-300 sm:max-w-sm ${navbarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white p-5 shadow-sm dark:border-dark_border dark:bg-darkmode">
          <h2 className="text-lg font-bold text-midnight_text dark:text-white">Menu</h2>
          <button onClick={() => setNavbarOpen(false)} aria-label="Close mobile menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="dark:text-white">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col items-start gap-1 p-5">
          {primaryNavItems.map((item) => (
            <MobileHeaderLink key={item.href} item={item} onNavigate={() => setNavbarOpen(false)} />
          ))}
          <div className="mt-4 flex flex-col space-y-4 w-full">
            <a
              href="/ETL-Dashboard.html"
              className="bg-transparent border border-primary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all"
              onClick={() => setNavbarOpen(false)}
            >
              Staff Login
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
