import { UserCog, BarChart3, Briefcase, Building } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const personas = [
  {
    icon: UserCog,
    bg: "bg-ink",
    role: "Właściciel firmy",
    text: "Chce szybko wiedzieć, czy firma zarabia, gdzie rosną koszty i co wymaga reakcji.",
  },
  {
    icon: BarChart3,
    bg: "bg-navy",
    role: "Controller / analityk",
    text: "Chce ograniczyć ręczną pracę, szybciej przygotowywać raporty i mieć mniej powtarzalnych zadań.",
  },
  {
    icon: Briefcase,
    bg: "bg-blue",
    role: "Menedżer operacyjny",
    text: "Chce widzieć trendy, odchylenia i dane wspierające codzienne decyzje operacyjne.",
  },
  {
    icon: Building,
    bg: "bg-cyan",
    role: "Mała lub średnia firma",
    text: "Nie ma ciężkiego systemu BI, ale chce mieć lepszy obraz finansów i kosztów.",
  },
] as const;

export function AudienceSection() {
  return (
    <section id="dla-kogo" className="bg-bg py-20 lg:py-28" aria-labelledby="audience-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeader
          eyebrow="06 — Dla kogo"
          title={
            <>
              Dla tych, którzy pracują z liczbami i{" "}
              <span className="gradient-text italic">nie mają czasu na chaos</span>.
            </>
          }
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map(({ icon: Icon, bg, role, text }) => (
            <article key={role} className="lift rounded-2xl bg-white p-6 hairline">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white ${bg}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">{role}</h3>
              <p className="text-sm leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
