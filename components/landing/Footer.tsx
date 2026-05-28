import { Mail } from "lucide-react";
import Image from "next/image";
import { siteConfig, nav } from "@/lib/landing-config";

export function Footer() {
  return (
    <footer id="kontakt" className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <a href="#top" className="flex items-center" aria-label="DataGate — góra strony">
              <span className="relative inline-flex h-10 w-[150px]" aria-hidden="true">
                <Image
                  src="/logo_dark_napis.png"
                  alt=""
                  fill
                  sizes="150px"
                  className="object-contain"
                />
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Narzędzie do analizy danych finansowych, dashboardów i raportowania dla firm.
              Mniej ręcznego liczenia — więcej decyzji opartych na danych.
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-6 inline-flex items-center gap-2 text-sm text-ink transition hover:text-navy"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {siteConfig.email}
            </a>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Produkt
            </h3>
            <ul className="space-y-2.5 text-sm">
              {nav.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-text/80 transition hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Firma
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={siteConfig.cta.contactHref} className="text-text/80 transition hover:text-ink">
                  Kontakt
                </a>
              </li>
              <li>
                {/* TODO: podmień na link do realnej polityki */}
                <a href="/polityka-prywatnosci" className="text-text/80 transition hover:text-ink">
                  Polityka prywatności
                </a>
              </li>
              <li>
                {/* TODO: podmień na link do realnego regulaminu */}
                <a href="/regulamin" className="text-text/80 transition hover:text-ink">
                  Regulamin
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Status
            </h3>
            <div className="space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                MVP w aktywnym rozwoju
              </p>
              <p>Wersja produkcyjna w przygotowaniu.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted">
            A product by{" "}
            <span className="font-medium text-ink">{siteConfig.company.parent}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

