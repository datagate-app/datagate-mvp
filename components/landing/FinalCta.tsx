import { ArrowRight, Mail } from "lucide-react";
import { siteConfig } from "@/lib/landing-config";

export function FinalCta() {
  return (
    <section
      id="zglos-sie"
      className="relative overflow-hidden bg-ink py-20 text-white lg:py-28"
      aria-labelledby="cta-heading"
    >
      <div className="blob -top-32 right-0 h-[500px] w-[500px] bg-blue/40" aria-hidden="true" />
      <div className="blob bottom-0 left-0 h-[400px] w-[400px] bg-cyan/30" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Wczesny dostęp · MVP
            </span>
            <h2
              id="cta-heading"
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight lg:text-5xl"
            >
              Zaloguj się do DataGate i zamień dane finansowe w decyzje.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Landing prowadzi bezpośrednio do obecnej aplikacji. Po zalogowaniu
              przejdziesz do dashboardu, importu danych i raportów DataGate Analyze.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 font-medium text-ink shadow-soft transition hover:bg-white/90"
              >
                Przejdź do logowania
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
              <a
                href={siteConfig.cta.contactHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3.5 font-medium text-white transition hover:bg-white/10"
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Kontakt
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <h3 className="font-display text-2xl font-semibold">
                Co dalej po zalogowaniu?
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-white/75">
                <li className="flex gap-3">
                  <Check />
                  Utworzysz raport demo, ręczny bilans albo import z pliku.
                </li>
                <li className="flex gap-3">
                  <Check />
                  Otworzysz dashboard z historią raportów i statusem analiz.
                </li>
                <li className="flex gap-3">
                  <Check />
                  Pobierzesz raport PDF z istniejącego widoku analitycznego.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <span
      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/20"
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 text-success">
        <path
          d="M3 8l3 3 7-7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}
