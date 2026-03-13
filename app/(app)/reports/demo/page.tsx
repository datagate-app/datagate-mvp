import ReportView from "@/app/(app)/reports/components/ReportView";
import { generateDemoMetrics } from "@/lib/demo/demoData";
import {
  calculateCombinedMetrics,
  calculateIncomeMetrics,
} from "@/lib/parser/calculateMetrics";
import type { IncomeStatementData, PeriodKey } from "@/lib/types/metrics";

const PERIOD_KEYS: PeriodKey[] = [
  "tMinus2",
  "tMinus1",
  "t0",
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
];

const PERIOD_MULTIPLIERS: Record<PeriodKey, number> = {
  tMinus2: 0.78,
  tMinus1: 0.89,
  t0: 1,
  t1: 1.08,
  t2: 1.17,
  t3: 1.27,
  t4: 1.38,
  t5: 1.5,
  t6: 1.63,
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function buildDemoIncomeStatementData(): IncomeStatementData {
  const baseRevenue = 3200;
  const baseOperatingMargin = 0.13125; // 420 / 3200
  const baseGrossMargin = 0.121875; // 390 / 3200
  const baseNetMargin = 0.096875; // 310 / 3200

  const data = {} as IncomeStatementData;

  for (const [index, period] of PERIOD_KEYS.entries()) {
    const multiplier = PERIOD_MULTIPLIERS[period];
    const revenue = round2(baseRevenue * multiplier);

    const operatingMargin = Math.min(
      Math.max(baseOperatingMargin + (index - 2) * 0.005, 0.05),
      0.3
    );
    const grossMargin = Math.min(
      Math.max(baseGrossMargin + (index - 2) * 0.004, 0.04),
      0.28
    );
    const netMargin = Math.min(
      Math.max(baseNetMargin + (index - 2) * 0.003, 0.03),
      0.22
    );

    const operatingProfit = round2(revenue * operatingMargin);
    const grossProfit = round2(revenue * grossMargin);
    const netProfit = round2(revenue * netMargin);
    const operatingCosts = round2(revenue - operatingProfit);

    data[period] = {
      przychodyNettoZeSprzedazy: revenue,
      kosztyDzialalnosciOperacyjnej: operatingCosts,
      zyskStrataZDzialalnosciOperacyjnej: operatingProfit,
      zyskStrataBrutto: grossProfit,
      zyskStrataNetto: netProfit,
    };
  }

  return data;
}

export default function DemoReportPage() {
  const metrics = generateDemoMetrics();
  const incomeStatementData = buildDemoIncomeStatementData();
  const incomeMetrics = calculateIncomeMetrics(incomeStatementData);
  const combinedMetrics = calculateCombinedMetrics({
    bilans: metrics,
    income: incomeMetrics,
  });

  return (
    <ReportView
      metrics={metrics}
      incomeMetrics={incomeMetrics}
      combinedMetrics={combinedMetrics}
      reportName="Raport demonstracyjny"
      industry="manufacturing"
    />
  );
}