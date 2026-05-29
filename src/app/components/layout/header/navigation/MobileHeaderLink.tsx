import { useState } from "react";
import Link from "next/link";
import type { HeaderItem } from "@/app/types/layout/menu";
import { usePathname } from "next/navigation";

const MobileHeaderLink: React.FC<{ item: HeaderItem; onNavigate?: () => void }> = ({ item, onNavigate }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const pathname = usePathname();

  const handleToggle = () => {
    setSubmenuOpen(!submenuOpen);
  };

  const isHashLink = item.href.includes("#");
  const baseHref = item.href.split("#")[0] || "/";
  const isActive = isHashLink
    ? pathname === "/"
    : pathname === baseHref || pathname.startsWith(`${baseHref}/`);

  const linkClass = `flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold focus:outline-none dark:text-white dark:text-opacity-80 ${isActive ? "bg-primary text-white dark:bg-primary dark:text-white dark:text-opacity-100" : "text-black dark:text-white"}`;

  return (
    <div className="relative w-full">
      {item.submenu ? (
        <button onClick={handleToggle} className={linkClass}>
          {item.label}
          <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m7 10l5 5l5-5" />
          </svg>
        </button>
      ) : (
        <Link href={item.href} onClick={onNavigate} className={linkClass}>
          {item.label}
        </Link>
      )}
      {submenuOpen && item.submenu && (
        <div className="bg-white dark:bg-darkmode py-2 px-3 w-full">
          {item.submenu.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              onClick={onNavigate}
              className={`block px-3 py-2 ${subItem.href === pathname ? "!text-primary dark:text-primary" : "text-gray"}`}
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileHeaderLink;
