import { UploadCloud, SlidersHorizontal, LayoutDashboard, Download } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    n: "01",
    icon: UploadCloud,
    bg: "bg-ink",
    title: "Dodaj plik",
    text: "CSV lub XLSX. W MVP DataGate pracuje na wybranych strukturach danych.",
  },
  {
    n: "02",
    icon: SlidersHorizontal,
    bg: "bg-navy",
    title: "Wybierz typ analizy",
    text: "Finanse, koszty, sprzedaż, controlling — wskazujesz kontekst pracy.",
  },
  {
    n: "03",
    icon: LayoutDashboard,
    bg: "bg-blue",
    title: "Zobacz raport",
    text: "Dashboard z KPI, wykresami, tabelą wskaźników i wnioskami.",
  },
  {
    n: "04",
    icon: Download,
    bg: "bg-success",
    title: "Eksportuj lub zapisz",
    text: "PDF dla zarządu, dane do Excela, historia raportów w panelu.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="jak-dziala" className="bg-white py-20 lg:py-28" aria-labelledby="how-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeader
          eyebrow="02 — Jak działa"
          title={
            <>
              Cztery kroki. <span className="gradient-text italic">Bez ukrytej magii</span> i bez
              ręcznego klejenia arkuszy.
            </>
          }
        />

        <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, icon: Icon, bg, title, text }) => (
            <li key={n} className="relative rounded-2xl bg-white p-6 hairline">
              <span className="pointer-events-none absolute right-5 top-5 select-none font-display text-5xl font-semibold text-bg">
                {n}
              </span>
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white ${bg}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mb-1.5 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
