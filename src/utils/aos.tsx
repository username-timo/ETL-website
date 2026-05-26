"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import type { ReactNode } from "react";

type AosProps = {
  children: ReactNode;
};

const Aoscompo = ({ children }: AosProps) => {
    const pathname = usePathname();

    useEffect(() => {
        AOS.init({
            duration: 700,
            once: true,
            offset: 60,
            easing: 'ease-out-cubic',
        })
        setTimeout(() => AOS.refreshHard(), 100)
    }, [])

    // Re-scan new elements after client-side navigation
    useEffect(() => {
        setTimeout(() => AOS.refreshHard(), 200)
    }, [pathname])

    return <>{children}</>;
};

export default Aoscompo
