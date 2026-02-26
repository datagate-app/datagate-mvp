import ReportView from "@/app/(app)/reports/components/ReportView";
import { generateDemoMetrics } from "@/lib/demo/demoData";

export default function DemoReportPage() {
  const metrics = generateDemoMetrics();

  return (
    <ReportView
      metrics={metrics}
      reportName="Raport demonstracyjny"
      industry="Produkcja"
    />
  );
}