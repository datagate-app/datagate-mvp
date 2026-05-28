import { Copy, Calculator, LayoutDashboard, AlertCircle } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const problems = [
  {
    icon: Copy,
    title: "Ręczne kopiowanie danych",
    text: "Przeklejanie między arkuszami zżera godziny i wprowadza błędy.",
  },
  {
    icon: Calculator,
    title: "Wskaźniki liczone „na piechotę”",
    text: "Marża, rentowność, płynność — co miesiąc te same formuły od zera.",
  },
  {
    icon: LayoutDashboard,
    title: "Brak jednego widoku firmy",
    text: "Dane są wszędzie: CSV, XLSX, PDF, skrzynki. Nigdzie nie ma jednego obrazu.",
  },
  {
    icon: AlertCircle,
    title: "Raport dopiero po fakcie",
    text: "Problemy widać, gdy ktoś usiądzie do raportu. Wtedy bywa już za późno.",
  },
] as const;

export function ProblemSection() {
  return (
    <section
      className="relative border-y border-line bg-white py-20 lg:py-28"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeader
          eyebrow="01 — Problem"
          title={
            <>
              Firmowe dane są w plikach. Problem zaczyna się, gdy trzeba{" "}
              <span className="gradient-text italic">szybko wyciągnąć z nich wnioski</span>.
            </>
          }
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(({ icon: Icon, title, text }) => (
            <article key={title} className="lift rounded-2xl bg-bg/40 p-6 hairline">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white hairline">
                <Icon className="h-5 w-5 text-ink" aria-hidden="true" />
              </div>
              <h3 className="mb-1.5 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Heading id pod nawigację skip-link
ProblemSection.id = "problem-heading";
