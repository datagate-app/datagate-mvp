import { Check } from "lucide-react";

interface Module {
  letter: "A" | "B" | "C";
  name: string;
  status: "Dostępny" | "W przygotowaniu";
  statusTone: "success" | "amber";
  description: string;
  bullets: string[];
}

const modules: Module[] = [
  {
    letter: "A",
    name: "DataGate Analyze",
    status: "Dostępny",
    statusTone: "success",
    description:
      "Moduł do analizy danych finansowych, raportów, wskaźników i dashboardów. Pomaga szybko zobaczyć kondycję firmy i kluczowe odchylenia.",
    bullets: [
      "Import danych CSV / XLSX",
      "Dashboard KPI",
      "Raporty i wskaźniki",
      "Komentarze i sugestie",
      "Eksport PDF",
    ],
  },
  {
    letter: "B",
    name: "DataGate Scenario",
    status: "W przygotowaniu",
    statusTone: "amber",
    description:
      "Moduł do planowania scenariuszy i sprawdzania, jak zmiany przychodów, kosztów lub marż mogą wpłynąć na wynik firmy.",
    bullets: [
      "Symulacje finansowe",
      "Warianty optymistyczne / pesymistyczne",
      "Wpływ decyzji na wynik",
      "Analiza wrażliwości",
    ],
  },
  {
    letter: "C",
    name: "DataGate Budget",
    status: "W przygotowaniu",
    statusTone: "amber",
    description:
      "Moduł do budżetowania, kontroli planu i porównywania wykonania z założeniami.",
    bullets: [
      "Plan vs wykonanie",
      "Kontrola kosztów",
      "Analiza odchyleń",
      "Budżety działowe",
    ],
  },
];

export function ModulesSection() {
  return (
    <section
      id="moduly"
      className="relative overflow-hidden bg-ink py-20 text-white lg:py-28"
      aria-labelledby="modules-heading"
    >
      <div className="blob -left-20 -top-32 h-[500px] w-[500px] bg-blue/30" aria-hidden="true" />
      <div className="blob bottom-0 right-0 h-[400px] w-[400px] bg-cyan/20" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            05 — Moduły
          </div>
          <h2
            id="modules-heading"
            className="font-display text-3xl font-semibold leading-[1.1] tracking-tight lg:text-5xl"
          >
            Trzy moduły. Jedna spójna brama do{" "}
            <span className="gradient-text-cyan italic">danych firmy</span>.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            DataGate rośnie modułowo. Zaczynamy od analizy, dodajemy planowanie scenariuszy i
            budżetowanie — wszystko w tym samym środowisku pracy.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {modules.map((m) => (
            <article
              key={m.letter}
              className="lift rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Moduł {m.letter}
                </span>
                <ModuleStatus tone={m.statusTone} label={m.status} />
              </div>
              <h3 className="mb-2 font-display text-2xl font-semibold">{m.name}</h3>
              <p className="mb-5 text-sm leading-relaxed text-white/70">{m.description}</p>
              <ul className="space-y-2 text-sm">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-white/85">
                    <Check className="h-4 w-4 text-cyan" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleStatus({ tone, label }: { tone: "success" | "amber"; label: string }) {
  const tones = {
    success: "bg-success/15 text-success border-success/25",
    amber: "bg-amber/15 text-amber border-amber/25",
  };
  const dot = tone === "success" ? "bg-success" : "bg-amber";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${tones[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
