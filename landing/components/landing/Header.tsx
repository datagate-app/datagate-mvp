"use client";

import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { nav, siteConfig } from "@/lib/config";

export function Header() {
  const [open, setOpen] = useState(false);

  // Close mobile menu na escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="DataGate — strona główna">
          <Logo />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              {siteConfig.name}
            </span>
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {siteConfig.tagline}
            </span>
          </span>
        </a>

        <nav aria-label="Główna nawigacja" className="hidden items-center gap-8 text-sm lg:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-text/80 transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={siteConfig.cta.primaryHref}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-navy"
          >
            {siteConfig.cta.primaryLabel}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 p-2 text-ink lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-line bg-white p-6 shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setOpen(false)}
            className="p-2 text-ink"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex flex-col gap-5 text-lg" aria-label="Nawigacja mobilna">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-ink"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={siteConfig.cta.primaryHref}
          onClick={() => setOpen(false)}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-white"
        >
          {siteConfig.cta.primaryLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="relative inline-flex h-8 w-8 overflow-hidden rounded-lg bg-ink" aria-hidden="true">
      <span className="absolute inset-0 bg-gradient-to-br from-blue/60 via-cyan/40 to-success/30" />
      <span className="relative m-auto font-display text-base font-semibold leading-none text-white">
        D
      </span>
    </span>
  );
}
