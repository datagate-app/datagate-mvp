import { CheckCircle2, Hammer, Rocket } from "lucide-react";
import { Pill } from "@/components/ui/Pill";

const roadmap = [
  {
    icon: CheckCircle2,
    iconClass: "text-success",
    badge: "Teraz",
    badgeClass: "bg-success/10 text-success border-success/25",
    items: [
      "Import wybranych struktur danych",
      "Dashboard KPI",
      "Podstawowe wskaźniki finansowe",
      "Raport PDF",
      "Historia raportów",
    ],
  },
  {
    icon: Hammer,
    iconClass: "text-blue",
    badge: "Następnie",
    badgeClass: "bg-blue/10 text-blue border-blue/25",
    items: [
      "Szersze mapowanie plików",
      "Porównania okresów (M/M, R/R)",
      "Komentarze systemowe",
      "Moduł Scenario",
      "Moduł Budget",
    ],
  },
  {
    icon: Rocket,
    iconClass: "text-cyan",
    badge: "Później",
    badgeClass: "bg-cyan/10 text-cyan border-cyan/25",
    items: [
      "Benchmarki branżowe",
      "Zaawansowana analityka",
      "Integracje z ERP i księgowością",
      "Raporty cykliczne",
      "Role i uprawnienia w zespole",
    ],
  },
] as const;

export function MvpSection() {
  return (
    <section
      className="bg-white py-20 lg:py-28"
      aria-labelledby="mvp-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-3xl">
          <Pill dot className="mb-6">
            Status MVP · Otwarte testy
          </Pill>
          <h2
            id="mvp-heading"
            className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink lg:text-5xl"
          >
            Szczerze: DataGate to{" "}
            <span className="gradient-text italic">rozwijany produkt MVP</span>.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Skupiamy się na praktycznych funkcjach: imporcie danych, obliczaniu wskaźników,
            dashboardach, eksporcie raportów i testach z pierwszymi użytkownikami. Produkt powstaje
            w oparciu o realne potrzeby pracy z danymi finansowymi — nie w oparciu o slajdy z
            konferencji.
          </p>
        </div>

        {/* Roadmap */}
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {roadmap.map((col, idx) => {
            const Icon = col.icon;
            return (
              <article key={col.badge} className="rounded-2xl bg-bg/40 p-6 hairline lg:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${col.badgeClass}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${col.iconClass}`} aria-hidden="true" />
                    {col.badge}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Etap {idx + 1}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-ink/90">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${col.iconClass.replace("text-", "bg-")}`}
                        aria-hidden="true"
                      />
                      {it}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
