import {
  FileSpreadsheet,
  Percent,
  LayoutDashboard,
  History,
  FileDown,
  GitCompare,
  Sparkles,
  Wallet,
  Plug,
  BarChart3,
  CalendarClock,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Pill } from "@/components/ui/Pill";

type MvpFeature = {
  icon: typeof FileSpreadsheet;
  title: string;
  text: string;
  inDevelopment?: boolean;
};

const mvpFeatures: MvpFeature[] = [
  {
    icon: FileSpreadsheet,
    title: "Import wybranych struktur CSV / XLSX",
    text: "W MVP DataGate pracuje na wybranych strukturach danych i stopniowo rozwija automatyczne rozpoznawanie plików.",
  },
  {
    icon: Percent,
    title: "Wskaźniki finansowe",
    text: "Marża, rentowność, płynność, dynamika — obliczane z paczki standardowych formuł.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard KPI",
    text: "Najważniejsze liczby i trendy w jednym widoku, gotowe do pokazania na zarządzie.",
  },
  {
    icon: History,
    title: "Historia raportów",
    text: "Zapisuj analizy i wracaj do nich w dowolnym momencie. Bez folderów typu „final_v7”.",
  },
  {
    icon: FileDown,
    title: "Eksport PDF",
    text: "Przygotuj raport gotowy do wysłania na zarząd lub do klienta.",
  },
  {
    icon: GitCompare,
    title: "Porównania okresów",
    text: "Zestawienia M/M i R/R bez budowania raportu od zera — w rozwoju.",
    inDevelopment: true,
  },
];

const roadmapFeatures = [
  {
    icon: FileSpreadsheet,
    title: "Automatyczne mapowanie plików",
    text: "Szersze wsparcie różnych formatów i struktur danych.",
  },
  {
    icon: Sparkles,
    title: "Komentarze systemowe i AI",
    text: "Wsparcie interpretacji danych w czytelnym języku biznesowym.",
  },
  {
    icon: BarChart3,
    title: "Scenariusze i symulacje",
    text: "Wpływ zmian przychodów, kosztów i marż na wynik firmy.",
  },
  {
    icon: Wallet,
    title: "Budżetowanie",
    text: "Plan vs wykonanie, kontrola kosztów, budżety działowe.",
  },
  {
    icon: Plug,
    title: "Integracje",
    text: "Połączenia z systemami księgowymi, ERP i hurtowniami danych.",
  },
  {
    icon: CalendarClock,
    title: "Raporty cykliczne",
    text: "Automatyczne dashboardy i raporty miesięczne / kwartalne.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="funkcje" className="bg-white py-20 lg:py-28" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeader
          eyebrow="04 — Funkcje"
          title={
            <>
              Co jest dostępne teraz, a co{" "}
              <span className="gradient-text italic">w rozwoju</span>.
            </>
          }
          description="Mocno praktyczny zestaw funkcji — bez sztucznego „AI everywhere”. Otwarcie pokazujemy, co działa, a nad czym jeszcze pracujemy."
        />

        {/* MVP */}
        <div className="mt-14">
          <div className="mb-6 flex items-center gap-3">
            <Pill tone="success" dot>
              Dostępne / rozwijane w MVP
            </Pill>
            <div className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mvpFeatures.map(({ icon: Icon, title, text, inDevelopment }) => (
              <article key={title} className="lift rounded-2xl bg-white p-6 hairline">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {inDevelopment && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber">
                      w rozwoju
                    </span>
                  )}
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="mt-16">
          <div className="mb-6 flex items-center gap-3">
            <Pill tone="amber" dot>
              W planie / roadmapa
            </Pill>
            <div className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmapFeatures.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-dashed border-line bg-bg/40 p-6"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-muted hairline">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-ink/85">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
