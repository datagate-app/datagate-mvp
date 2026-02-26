"use client";

import Image from "next/image";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <Image
              src="/logo_dark_kwadrat.png"
              alt="DataGate"
              fill
              priority
              className="object-contain"
            />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DataGate
        </p>
      </div>
    </div>
  );
}