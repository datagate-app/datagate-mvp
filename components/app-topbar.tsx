"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/user-menu";

const PAGE_META: {
  match: (pathname: string) => boolean;
  title: string;
  crumb: string;
}[] = [
  {
    match: (pathname) => pathname === "/dashboard",
    title: "Dashboard",
    crumb: "Przegląd raportów",
  },
  {
    match: (pathname) => pathname === "/upload",
    title: "Utwórz raport",
    crumb: "Import i dane finansowe",
  },
  {
    match: (pathname) => pathname.startsWith("/reports"),
    title: "Raport finansowy",
    crumb: "Analiza wskaźnikowa",
  },
  {
    match: (pathname) => pathname === "/scenario",
    title: "DataGate Scenario",
    crumb: "Moduł w przygotowaniu",
  },
  {
    match: (pathname) => pathname === "/budget",
    title: "DataGate Budget",
    crumb: "Moduł w przygotowaniu",
  },
];

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

export function AppTopbar() {
  const pathname = usePathname();
  const meta =
    PAGE_META.find((item) => item.match(pathname)) ?? PAGE_META[0];

  return (
    <header className="dg-topbar flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold tracking-[-0.02em] text-[var(--dg-navy)]">
          {meta.title}
        </h1>
        <p className="mt-0.5 text-xs text-[var(--dg-gray-400)]">
          {meta.crumb}
        </p>
      </div>

      <Link href="/upload" className="dg-btn dg-btn-primary">
        <span className="h-3.5 w-3.5">
          <IconPlus />
        </span>
        Nowy raport
      </Link>

      <UserMenu />
    </header>
  );
}
