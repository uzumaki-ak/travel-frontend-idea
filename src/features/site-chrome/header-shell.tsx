"use client";

/**
 * Header behaviour only: always pinned to the top, and gains a frosted
 * backdrop once the page scrolls. Markup is passed in as children so it
 * stays server-rendered.
 */
import { useEffect, useState, type ReactNode } from "react";

const SCROLLED_AT = 24;

export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLLED_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="group/header fixed inset-x-0 top-0 z-40 [view-transition-name:site-header] transition-[background-color,box-shadow] duration-500 ease-out-expo data-scrolled:bg-fog/85 data-scrolled:shadow-[0_1px_0_0_rgb(19_32_29/0.08)] data-scrolled:backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {children}
    </header>
  );
}
