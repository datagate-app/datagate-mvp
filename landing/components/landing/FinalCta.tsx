import { Mail } from "lucide-react";
import { SignupForm } from "./SignupForm";
import { siteConfig } from "@/lib/config";

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
          {/* Lewa: copy */}
          <div className="lg:col-span-6">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Wczesny dostęp · MVP
            </span>
            <h2
              id="cta-heading"
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight lg:text-5xl"
            >
              Dołącz do testów DataGate i zobacz, co mówią Twoje dane{" "}
              <span className="gradient-text-cyan italic">zanim problem stanie się widoczny w wynikach</span>.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Szukamy pierwszych użytkowników testowych z obszaru finansów, controllingu i pracy
              z danymi. Bez zobowiązań — wczesny dostęp, bezpośredni kontakt z zespołem, realny
              wpływ na rozwój produktu.
            </p>

            <ul className="mt-8 space-y-2.5 text-sm text-white/80">
              <li className="flex items-center gap-2.5">
                <Check />
                Wczesny dostęp do modułu Analyze
              </li>
              <li className="flex items-center gap-2.5">
                <Check />
                Bezpośredni kontakt z zespołem produktowym
              </li>
              <li className="flex items-center gap-2.5">
                <Check />
                Wpływ na priorytety roadmapy
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-2 text-sm text-white/60">
              <a
                href={siteConfig.cta.contactHref}
                className="inline-flex w-fit items-center gap-2 underline-offset-4 hover:text-white hover:underline"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Wolisz porozmawiać? {siteConfig.email}
              </a>
            </div>
          </div>

          {/* Prawa: formularz */}
          <div className="lg:col-span-6">
            <SignupForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <span
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/20"
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 text-success">
        <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
