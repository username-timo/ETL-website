"use client"
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const HeaderLink: React.FC<{ item: any; sticky?: boolean }> = ({ item, sticky = true }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const path = usePathname();

  // LPO System — gold pill
  if (item.highlight) {
    return (
      <a href={item.href}
        className="lpo-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90 whitespace-nowrap"
        style={{ background: "linear-gradient(135deg,#c8860a,#e6a830)" }}>
        📋 {item.label}
      </a>
    );
  }

  const isActive = path === item.href;
  const textColor = sticky
    ? isActive ? 'text-primary dark:text-secondary' : 'text-midnight_text dark:text-white hover:text-primary dark:hover:text-secondary'
    : isActive ? 'text-secondary' : 'text-white hover:text-secondary';

  return (
    <div
      className={item.submenu ? "relative" : ""}
      onMouseEnter={() => item.submenu && setSubmenuOpen(true)}
      onMouseLeave={() => setSubmenuOpen(false)}
    >
      <a href={item.href}
        className={`flex items-center gap-0.5 py-1.5 font-bold text-sm uppercase tracking-wide transition-colors whitespace-nowrap ${textColor}`}
        style={{ fontFamily: "var(--font-barlow, sans-serif)", letterSpacing: "0.07em" }}>
        {item.label}
        {item.submenu && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 10l5 5l5-5" />
          </svg>
        )}
      </a>

      {submenuOpen && item.submenu && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-darkmode shadow-deatail_shadow rounded-xl border border-border dark:border-dark_border py-2 z-50">
          {item.submenu.map((sub: any, i: number) => (
            <a key={i} href={sub.href}
              className="block px-4 py-2.5 text-sm font-semibold text-midnight_text dark:text-white hover:bg-section dark:hover:bg-semidark hover:text-primary transition-colors">
              {sub.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderLink;
