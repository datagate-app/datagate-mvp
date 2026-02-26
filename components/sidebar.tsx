"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItem = (href: string, label: string) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`block px-4 py-2 rounded-lg text-sm transition
        ${
          isActive
            ? "bg-white/10 text-white font-medium"
            : "text-white/70 hover:text-white hover:bg-white/5"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: "#0d1a34" }}>
      
      {/* LOGO */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center">
          <div className="relative h-15 w-15">
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
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItem("/dashboard", "Dashboard")}
        {navItem("/upload", "Upload")}
      </nav>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="text-xs text-white/40">
          DataGate MVP
        </div>
      </div>
    </aside>
  );
}