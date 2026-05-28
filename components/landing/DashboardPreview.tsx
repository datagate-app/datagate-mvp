import { SectionHeader } from "@/components/ui/SectionHeader";
import { DashboardMockup } from "./DashboardMockup";

export function DashboardPreview() {
  return (
    <section
      id="przykladowy-raport"
      className="border-y border-line bg-bg py-20 lg:py-28"
      aria-labelledby="preview-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeader
          eyebrow="03 — Przykładowy raport"
          title={
            <>
              Tak wygląda <span className="gradient-text italic">jeden raport</span> z DataGate.
            </>
          }
          description="Wycinek dashboardu z danymi demonstracyjnymi. KPI, wykres, tabela wskaźników, wnioski i alerty — na jednym ekranie."
        />

        <div className="mt-12">
          <DashboardMockup variant="full" />
        </div>
      </div>
    </section>
  );
}
