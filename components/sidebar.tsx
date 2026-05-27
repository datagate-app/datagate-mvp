"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );
}

function IconAdd() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
    </svg>
  );
}

function IconBudget() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  );
}

function LogoGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 4h2v-2h2v2h2v2h-2v2h-2v-2h-2v-2Z"
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const analyzeItems: NavLinkItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <IconGrid />,
    },
    {
      href: "/upload",
      label: "Utwórz raport",
      icon: <IconAdd />,
    },
  ];

  const scenarioItems: NavLinkItem[] = [
    {
      href: "/scenario",
      label: "DataGate Scenario",
      icon: <IconCalendar />,
    },
  ];

  const budgetItems: NavLinkItem[] = [
    {
      href: "/budget",
      label: "DataGate Budget",
      icon: <IconBudget />,
    },
  ];

  const renderNavItem = (item: NavLinkItem) => {
    const isActive =
      pathname === item.href ||
      (item.href === "/dashboard" && pathname.startsWith("/reports"));

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`dg-nav-item ${
          isActive ? "dg-nav-item-active" : ""
        } relative mx-2 flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium`}
      >
        <span className="h-4 w-4 opacity-80">{item.icon}</span>
        <span className="whitespace-nowrap">{item.label}</span>
        {isActive ? (
          <span className="absolute -left-2 top-1/2 hidden h-[18px] w-[3px] -translate-y-1/2 rounded-full bg-sky-500 md:block" />
        ) : null}
      </Link>
    );
  };

  const renderSection = (label: string, items: NavLinkItem[]) => (
    <div className="min-w-fit md:min-w-0">
      <div className="px-4 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25">
        {label}
      </div>
      <div className="flex gap-1 md:block md:space-y-1">
        {items.map(renderNavItem)}
      </div>
    </div>
  );

  return (
    <aside className="dg-sidebar z-10 flex w-full shrink-0 flex-col md:min-h-screen md:w-60">
      <div className="relative z-10 border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="dg-logo-icon flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <span className="h-[18px] w-[18px]">
              <LogoGlyph />
            </span>
          </span>
          <span>
            <span className="block text-[17px] font-bold leading-none tracking-[-0.03em] text-white">
              DataGate
            </span>
            <span className="mt-1 hidden text-[10px] tracking-[0.05em] text-white/35 sm:block">
              Your gate to better insights
            </span>
          </span>
        </Link>
      </div>

      <nav className="relative z-10 flex flex-1 gap-1 overflow-x-auto px-2 py-3 md:block md:space-y-1 md:overflow-x-visible">
        {renderSection("DataGate Analyze", analyzeItems)}
        {renderSection("DataGate Scenario", scenarioItems)}
        {renderSection("DataGate Budget", budgetItems)}
      </nav>
    </aside>
  );
}
