"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type GroupKey = "analyze" | "scenario" | "budget";

type NavLinkItem = {
  href: string;
  label: string;
  subtitle?: string;
};

export default function Sidebar() {
  const pathname = usePathname();

  const isGroupActive = (items: NavLinkItem[]) =>
    items.some((item) => pathname === item.href);

  const analyzeItems: NavLinkItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      subtitle: "Przegląd raportów i wyników",
    },
    {
      href: "/upload",
      label: "Utwórz raport",
      subtitle: "Dodaj dane finansowe firmy",
    },
  ];

  const scenarioItems: NavLinkItem[] = [
    {
      href: "/scenario",
      label: "DataGate Scenario",
      subtitle: "Symulacja decyzji finansowych",
    },
  ];

  const budgetItems: NavLinkItem[] = [
    {
      href: "/budget",
      label: "DataGate Budget",
      subtitle: "Budżet i prognozy finansowe",
    },
  ];

  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    analyze: true,
    scenario: false,
    budget: false,
  });

  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      analyze: isGroupActive(analyzeItems) ? true : prev.analyze,
      scenario: isGroupActive(scenarioItems) ? true : prev.scenario,
      budget: isGroupActive(budgetItems) ? true : prev.budget,
    }));
  }, [pathname]);

  const toggleGroup = (group: GroupKey) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const renderNavItem = (href: string, label: string, subtitle?: string) => {
    const isActive = pathname === href;

    return (
      <Link
        key={href}
        href={href}
        className={`block rounded-lg px-4 py-3 transition ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>

          {subtitle ? (
            <span className="mt-0.5 text-xs text-white/40">{subtitle}</span>
          ) : null}
        </div>
      </Link>
    );
  };

  const renderGroup = (
    groupKey: GroupKey,
    title: string,
    items: NavLinkItem[]
  ) => {
    const isOpen = openGroups[groupKey];
    const active = isGroupActive(items);

    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => toggleGroup(groupKey)}
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
            active
              ? "text-white"
              : "text-white/80 hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          <span className="text-sm font-semibold">{title}</span>

          <span
            className={`text-xs text-white/50 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {isOpen ? (
          <div className="space-y-2 px-3 pb-3">
            {items.map((item) =>
              renderNavItem(item.href, item.label, item.subtitle)
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside
      className="flex min-h-screen w-64 flex-col"
      style={{ backgroundColor: "#0d1a34" }}
    >
      {/* LOGO */}
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/dashboard" className="flex items-center">
          <div className="relative h-12 w-12">
            <Image
              src="/logo_dark_big.png"
              alt="DataGate"
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-4 px-4 py-6">
        {renderGroup("analyze", "DataGate Analyze", analyzeItems)}
        {renderGroup("scenario", "DataGate Scenario", scenarioItems)}
        {renderGroup("budget", "DataGate Budget", budgetItems)}
      </nav>
    </aside>
  );
}