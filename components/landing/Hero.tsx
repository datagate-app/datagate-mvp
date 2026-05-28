import { AlertTriangle, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Pill } from "@/components/ui/Pill";
import { DashboardMockup } from "./DashboardMockup";
import { siteConfig } from "@/lib/landing-config";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div className="blob -left-20 -top-40 h-[480px] w-[480px] bg-blue/40" aria-hidden="true" />
      <div className="blob right-0 top-20 h-[420px] w-[420px] bg-cyan/30" aria-hidden="true" />
      <div className="blob -bottom-32 left-1/3 h-[360px] w-[360px] bg-success/25" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left: text */}
          <div className="lg:col-span-6">
            <Pill dot className="mb-6">
              MVP w aktywnym rozwoju · Wczesny dostęp
            </Pill>

            <h1
              id="hero-heading"
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]"
            >
              Zamień pliki finansowe w&nbsp;
              <span className="gradient-text font-medium italic">
                raporty, wskaźniki
              </span>{" "}
              i&nbsp;konkretne decyzje.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Wgraj dane, zobacz kluczowe wskaźniki i otrzymaj czytelny raport bez ręcznego składania
              arkuszy od zera. DataGate jest rozwijanym narzędziem MVP dla firm, które chcą szybciej
              analizować finanse, koszty i wyniki.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={siteConfig.cta.primaryHref} size="lg" withArrow>
                {siteConfig.cta.primaryLabel}
              </ButtonLink>
              <ButtonLink href={siteConfig.cta.secondaryHref} variant="secondary" size="lg">
                {siteConfig.cta.secondaryLabel}
              </ButtonLink>
            </div>

            <p className="mt-4 text-sm text-muted">
              Bez zobowiązań. Szukamy pierwszych użytkowników testowych.
            </p>

            {/* micro proof points */}
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              <div>
                <dt className="mt-1 text-xs text-muted">Import w MVP</dt>
                <dd className="font-display text-2xl font-semibold text-ink">CSV · XLSX</dd>
              </div>
              <div>
                <dt className="mt-1 text-xs text-muted">Wskaźniki z paczki</dt>
                <dd className="font-display text-2xl font-semibold text-ink">+20</dd>
              </div>
              <div>
                <dt className="mt-1 text-xs text-muted">Eksport raportu</dt>
                <dd className="font-display text-2xl font-semibold text-ink">PDF</dd>
              </div>
            </dl>
          </div>

          {/* Right: dashboard mockup z floating cards */}
          <div className="relative lg:col-span-6">
            {/* Floating alert */}
            <div
              className="absolute -top-4 right-2 z-20 w-56 rounded-xl bg-white p-3.5 shadow-lift hairline sm:right-4"
              role="note"
              aria-label="Przykładowy alert"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-ink">Alert</span>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Spadek marży o <span className="font-semibold text-red-500">8%</span> w segmencie B.
              </p>
            </div>

            {/* Floating insight */}
            <div
              className="absolute -bottom-4 left-2 z-20 w-60 rounded-xl bg-white p-3.5 shadow-lift hairline sm:left-4"
              role="note"
              aria-label="Przykładowy wniosek systemowy"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50">
                  <Sparkles className="h-4 w-4 text-success" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-ink">Wniosek systemowy</span>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Cash flow stabilny, ale rosną koszty transportu (+11,8% m/m).
              </p>
            </div>

            <DashboardMockup variant="compact" />
          </div>
        </div>
      </div>
    </section>
  );
}
