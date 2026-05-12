"use client";

import type {
  CombinedMetrics,
  IncomeMetrics,
  Metrics,
  PeriodKey,
  SinglePeriodCombinedMetrics,
  SinglePeriodIncomeMetrics,
  SinglePeriodMetrics,
} from "@/lib/types/metrics";
import { INDUSTRIES } from "@/lib/config/industries";

type ReportPrintViewProps = {
  reportName?: string;
  industry?: string;
  metrics?: Metrics | null;
  incomeMetrics?: IncomeMetrics | null;
  combinedMetrics?: CombinedMetrics | null;
};

type ChangeColor = "green" | "red" | "gray";
type ValueTone = "green" | "yellow" | "red";

const PERIODS: PeriodKey[] = [
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

const PERIOD_LABELS: Record<PeriodKey, string> = {
  tMinus2: "t-2",
  tMinus1: "t-1",
  t0: "t0",
  t1: "t1",
  t2: "t2",
  t3: "t3",
  t4: "t4",
  t5: "t5",
  t6: "t6",
};

const EPSILON = 0.000001;

function getPeriodLabel(period: PeriodKey) {
  return PERIOD_LABELS[period] ?? period;
}

function industryLabel(industry?: string) {
  if (!industry) return "—";

  if (Array.isArray(INDUSTRIES)) {
    const found = INDUSTRIES.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "value" in item &&
        "label" in item &&
        (item as { value: string }).value === industry
    ) as { value: string; label: string } | undefined;

    return found?.label ?? industry;
  }

  return (INDUSTRIES as Record<string, string>)[industry] ?? industry;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMeaningfulNumber(value: unknown): value is number {
  return isFiniteNumber(value) && Math.abs(value) > EPSILON;
}

function formatCurrency(value?: number) {
  if (!isFiniteNumber(value)) return "—";
  return `${((value ?? 0) * 1000).toLocaleString("pl-PL")} zł`;
}

function formatPercent(value?: number) {
  if (!isFiniteNumber(value)) return "—";
  return `${((value ?? 0) * 100).toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatNumber(value?: number) {
  if (!isFiniteNumber(value)) return "—";
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDays(value?: number) {
  if (!isFiniteNumber(value)) return "—";
  return `${value.toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} dni`;
}

function formatDeltaPercent(current?: number, previous?: number) {
  if (!isFiniteNumber(current) || !isFiniteNumber(previous) || previous === 0) {
    return "—";
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}% vs poprzedni okres`;
}

function comparePeriods(
  current?: number,
  prev?: number
): { text: string; color: ChangeColor } {
  if (!isFiniteNumber(prev)) {
    return { text: "brak danych", color: "gray" };
  }

  if (prev === 0) {
    if ((current ?? 0) === 0) return { text: "0.0%", color: "gray" };
    return { text: "▲ n/d", color: "green" };
  }

  const diff = ((current ?? 0) - prev) / prev;
  const sign = diff > 0 ? "▲" : diff < 0 ? "▼" : "•";

  let color: ChangeColor = "gray";
  if (diff > 0) color = "green";
  if (diff < 0) color = "red";

  return {
    text: `${sign} ${(diff * 100).toFixed(1)}% vs poprzedni okres`,
    color,
  };
}

function getBalancePeriod(
  metrics?: Metrics | null,
  period?: PeriodKey
): SinglePeriodMetrics {
  if (!metrics || !period) return {};
  return metrics[period] ?? {};
}

function getIncomePeriod(
  incomeMetrics?: IncomeMetrics | null,
  period?: PeriodKey
): SinglePeriodIncomeMetrics {
  if (!incomeMetrics || !period) return {};
  return incomeMetrics[period] ?? {};
}

function getCombinedPeriod(
  combinedMetrics?: CombinedMetrics | null,
  period?: PeriodKey
): SinglePeriodCombinedMetrics {
  if (!combinedMetrics || !period) return {};
  return combinedMetrics[period] ?? {};
}

function hasRealBalanceData(item?: SinglePeriodMetrics) {
  if (!item) return false;

  return (
    isMeaningfulNumber(item.aktywaRazem) ||
    isMeaningfulNumber(item.kapitalWlasny) ||
    isMeaningfulNumber(item.zobowiazania) ||
    isMeaningfulNumber(item.debtRatio) ||
    isMeaningfulNumber(item.equityRatio) ||
    isMeaningfulNumber(item.leverage) ||
    isMeaningfulNumber(item.debtToEquity) ||
    isMeaningfulNumber(item.solvencyRatio)
  );
}

function hasRealIncomeData(item?: SinglePeriodIncomeMetrics) {
  if (!item) return false;

  return (
    isMeaningfulNumber(item.revenue) ||
    isMeaningfulNumber(item.operatingCosts) ||
    isMeaningfulNumber(item.operatingProfit) ||
    isMeaningfulNumber(item.grossProfit) ||
    isMeaningfulNumber(item.netProfit) ||
    isMeaningfulNumber(item.operatingMargin) ||
    isMeaningfulNumber(item.netMargin) ||
    isMeaningfulNumber(item.ros)
  );
}

function hasRealCombinedData(item?: SinglePeriodCombinedMetrics) {
  if (!item) return false;

  return (
    isMeaningfulNumber(item.roa) ||
    isMeaningfulNumber(item.roe) ||
    isMeaningfulNumber(item.receivablesTurnoverDays) ||
    isMeaningfulNumber(item.inventoryTurnoverDays)
  );
}

function getRealBalancePeriods(metrics?: Metrics | null) {
  return PERIODS.filter((period) => hasRealBalanceData(getBalancePeriod(metrics, period)));
}

function getRealIncomePeriods(incomeMetrics?: IncomeMetrics | null) {
  return PERIODS.filter((period) =>
    hasRealIncomeData(getIncomePeriod(incomeMetrics, period))
  );
}

function getRealCombinedPeriods(combinedMetrics?: CombinedMetrics | null) {
  return PERIODS.filter((period) =>
    hasRealCombinedData(getCombinedPeriod(combinedMetrics, period))
  );
}

function getSelectedPeriod(periods: PeriodKey[]): PeriodKey | undefined {
  if (periods.includes("t0")) return "t0";
  return periods[periods.length - 1];
}

function getPreviousPeriod(periods: PeriodKey[], current?: PeriodKey) {
  if (!current) return undefined;
  const index = periods.indexOf(current);
  if (index <= 0) return undefined;
  return periods[index - 1];
}

function scoreDebtRatio(value = 0) {
  if (value <= 0.4) return 100;
  if (value <= 0.5) return 85;
  if (value <= 0.6) return 70;
  if (value <= 0.7) return 50;
  if (value <= 0.8) return 25;
  return 0;
}

function scoreEquityRatio(value = 0) {
  if (value >= 0.5) return 100;
  if (value >= 0.4) return 85;
  if (value >= 0.3) return 65;
  if (value >= 0.2) return 40;
  if (value >= 0.1) return 20;
  return 0;
}

function scoreLeverage(value = 0) {
  if (value <= 1.5) return 100;
  if (value <= 2.0) return 85;
  if (value <= 2.5) return 70;
  if (value <= 3.0) return 50;
  if (value <= 4.0) return 25;
  return 0;
}

function scoreDebtToEquity(value = 0) {
  if (value <= 0.5) return 100;
  if (value <= 1.0) return 85;
  if (value <= 1.5) return 70;
  if (value <= 2.0) return 50;
  if (value <= 3.0) return 25;
  return 0;
}

function scoreSolvencyRatio(value = 0) {
  if (value >= 2.0) return 100;
  if (value >= 1.5) return 80;
  if (value >= 1.2) return 60;
  if (value >= 1.0) return 40;
  if (value >= 0.8) return 20;
  return 0;
}

function getHealthScore(metricsForPeriod?: {
  debtRatio?: number;
  equityRatio?: number;
  leverage?: number;
  debtToEquity?: number;
  solvencyRatio?: number;
}) {
  const debtRatio = metricsForPeriod?.debtRatio ?? 0;
  const equityRatio = metricsForPeriod?.equityRatio ?? 0;
  const leverage = metricsForPeriod?.leverage ?? 0;
  const debtToEquity = metricsForPeriod?.debtToEquity ?? 0;
  const solvencyRatio = metricsForPeriod?.solvencyRatio ?? 0;

  const score = Math.round(
    scoreDebtRatio(debtRatio) * 0.3 +
      scoreEquityRatio(equityRatio) * 0.25 +
      scoreLeverage(leverage) * 0.2 +
      scoreDebtToEquity(debtToEquity) * 0.15 +
      scoreSolvencyRatio(solvencyRatio) * 0.1
  );

  if (score >= 80) return { score, label: "Bardzo dobra kondycja", tone: "good" };
  if (score >= 60) return { score, label: "Stabilna kondycja", tone: "good" };
  if (score >= 40) return { score, label: "Umiarkowane ryzyko", tone: "warn" };
  return { score, label: "Wysokie ryzyko", tone: "bad" };
}

function getMetricTone(
  value: number | undefined,
  goodMin?: number,
  warnMin?: number,
  reverse = false
): ValueTone {
  const v = value ?? 0;

  if (!reverse) {
    if (goodMin !== undefined && v >= goodMin) return "green";
    if (warnMin !== undefined && v >= warnMin) return "yellow";
    return "red";
  }

  if (goodMin !== undefined && v <= goodMin) return "green";
  if (warnMin !== undefined && v <= warnMin) return "yellow";
  return "red";
}

function MiniTrendBars({ values }: { values: number[] }) {
  const safe = values.map((v) => (Number.isFinite(v) ? Math.max(v, 0) : 0));
  const max = Math.max(...safe, 1);

  return (
    <div className="mini-bars">
      {safe.map((v, i) => (
        <div
          key={i}
          className="mini-bar"
          style={{ height: `${Math.max((v / max) * 100, 10)}%` }}
        />
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: number[];
  tone?: ValueTone;
}) {
  return (
    <div className={`kpi-card ${tone ? `tone-${tone}` : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta ? <div className="kpi-delta">{delta}</div> : null}
      {trend && trend.length > 1 ? <MiniTrendBars values={trend} /> : null}
    </div>
  );
}

function TrendTable({
  title,
  subtitle,
  headers,
  rows,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Array<{ label: string; values: string[] }>;
}) {
  if (!rows.length || !headers.length) return null;

  return (
    <section className="print-section section-card">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>

      <div className="table-wrap">
        <table className="print-table">
          <thead>
            <tr>
              <th>Pozycja</th>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className={rowIndex % 2 === 1 ? "alt-row" : ""}>
                <td className="row-label">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={`${row.label}-${index}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ReportPrintView({
  reportName,
  industry,
  metrics,
  incomeMetrics,
  combinedMetrics,
}: ReportPrintViewProps) {
  const balancePeriods = getRealBalancePeriods(metrics);
  const incomePeriods = getRealIncomePeriods(incomeMetrics);
  const combinedPeriods = getRealCombinedPeriods(combinedMetrics);

  const selectedBalancePeriod = getSelectedPeriod(balancePeriods);
  const selectedIncomePeriod = getSelectedPeriod(incomePeriods);
  const selectedCombinedPeriod = getSelectedPeriod(combinedPeriods);

  const previousBalancePeriod = getPreviousPeriod(balancePeriods, selectedBalancePeriod);
  const previousIncomePeriod = getPreviousPeriod(incomePeriods, selectedIncomePeriod);
  const previousCombinedPeriod = getPreviousPeriod(
    combinedPeriods,
    selectedCombinedPeriod
  );

  const selectedBalance = getBalancePeriod(metrics, selectedBalancePeriod);
  const previousBalance = getBalancePeriod(metrics, previousBalancePeriod);

  const selectedIncome = getIncomePeriod(incomeMetrics, selectedIncomePeriod);
  const previousIncome = getIncomePeriod(incomeMetrics, previousIncomePeriod);

  const selectedCombined = getCombinedPeriod(combinedMetrics, selectedCombinedPeriod);
  const previousCombined = getCombinedPeriod(
    combinedMetrics,
    previousCombinedPeriod
  );

  const healthBase =
    hasRealBalanceData(getBalancePeriod(metrics, "t0"))
      ? getBalancePeriod(metrics, "t0")
      : selectedBalance;

  const health = getHealthScore(healthBase);

  const balanceHeaders = balancePeriods.map(getPeriodLabel);
  const incomeHeaders = incomePeriods.map(getPeriodLabel);
  const combinedHeaders = combinedPeriods.map(getPeriodLabel);

  const balanceRows = balancePeriods.length
    ? [
        {
          label: "Aktywa razem",
          values: balancePeriods.map((p) =>
            formatCurrency(getBalancePeriod(metrics, p).aktywaRazem)
          ),
        },
        {
          label: "Kapitał własny",
          values: balancePeriods.map((p) =>
            formatCurrency(getBalancePeriod(metrics, p).kapitalWlasny)
          ),
        },
        {
          label: "Zobowiązania",
          values: balancePeriods.map((p) =>
            formatCurrency(getBalancePeriod(metrics, p).zobowiazania)
          ),
        },
        {
          label: "Wskaźnik zadłużenia",
          values: balancePeriods.map((p) =>
            formatPercent(getBalancePeriod(metrics, p).debtRatio)
          ),
        },
        {
          label: "Wskaźnik kapitału własnego",
          values: balancePeriods.map((p) =>
            formatPercent(getBalancePeriod(metrics, p).equityRatio)
          ),
        },
        {
          label: "Dźwignia finansowa",
          values: balancePeriods.map((p) =>
            formatNumber(getBalancePeriod(metrics, p).leverage)
          ),
        },
        {
          label: "Dług / Kapitał własny",
          values: balancePeriods.map((p) =>
            formatNumber(getBalancePeriod(metrics, p).debtToEquity)
          ),
        },
        {
          label: "Wypłacalność",
          values: balancePeriods.map((p) =>
            formatNumber(getBalancePeriod(metrics, p).solvencyRatio)
          ),
        },
      ]
    : [];

  const incomeRows = incomePeriods.length
    ? [
        {
          label: "Przychody",
          values: incomePeriods.map((p) =>
            formatCurrency(getIncomePeriod(incomeMetrics, p).revenue)
          ),
        },
        {
          label: "Koszty operacyjne",
          values: incomePeriods.map((p) =>
            formatCurrency(getIncomePeriod(incomeMetrics, p).operatingCosts)
          ),
        },
        {
          label: "Wynik operacyjny",
          values: incomePeriods.map((p) =>
            formatCurrency(getIncomePeriod(incomeMetrics, p).operatingProfit)
          ),
        },
        {
          label: "Wynik brutto",
          values: incomePeriods.map((p) =>
            formatCurrency(getIncomePeriod(incomeMetrics, p).grossProfit)
          ),
        },
        {
          label: "Wynik netto",
          values: incomePeriods.map((p) =>
            formatCurrency(getIncomePeriod(incomeMetrics, p).netProfit)
          ),
        },
        {
          label: "Marża operacyjna",
          values: incomePeriods.map((p) =>
            formatPercent(getIncomePeriod(incomeMetrics, p).operatingMargin)
          ),
        },
        {
          label: "Marża netto",
          values: incomePeriods.map((p) =>
            formatPercent(getIncomePeriod(incomeMetrics, p).netMargin)
          ),
        },
        {
          label: "ROS",
          values: incomePeriods.map((p) =>
            formatPercent(getIncomePeriod(incomeMetrics, p).ros)
          ),
        },
      ]
    : [];

  const combinedRows = combinedPeriods.length
    ? [
        {
          label: "ROA",
          values: combinedPeriods.map((p) =>
            formatPercent(getCombinedPeriod(combinedMetrics, p).roa)
          ),
        },
        {
          label: "ROE",
          values: combinedPeriods.map((p) =>
            formatPercent(getCombinedPeriod(combinedMetrics, p).roe)
          ),
        },
        {
          label: "Rotacja należności",
          values: combinedPeriods.map((p) =>
            formatDays(
              getCombinedPeriod(combinedMetrics, p).receivablesTurnoverDays
            )
          ),
        },
        {
          label: "Rotacja zapasów",
          values: combinedPeriods.map((p) =>
            formatDays(
              getCombinedPeriod(combinedMetrics, p).inventoryTurnoverDays
            )
          ),
        },
      ]
    : [];

  return (
    <div className="print-root">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        html,
        body {
          background: #ffffff;
        }

        .print-root {
          margin: 0 auto;
          max-width: 1200px;
          padding: 18px;
          background: #ffffff;
          color: #0f172a;
        }

        .page-break {
          break-before: page;
          page-break-before: always;
        }

        .avoid-break {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .report-header {
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
          padding: 24px;
          margin-bottom: 20px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }

        .brand-logo {
          width: 220px;
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }

        .header-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          background: #f8fafc;
          color: #0f172a;
        }

        .meta-pill.health.good {
          border-color: #86efac;
          background: #f0fdf4;
          color: #166534;
        }

        .meta-pill.health.warn {
          border-color: #fde68a;
          background: #fffbeb;
          color: #a16207;
        }

        .meta-pill.health.bad {
          border-color: #fca5a5;
          background: #fef2f2;
          color: #b91c1c;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }

        .report-title {
          font-size: 34px;
          line-height: 1.1;
          margin: 0 0 12px;
          color: #0f172a;
        }

        .intro {
          margin: 0;
          max-width: 920px;
          font-size: 14px;
          line-height: 1.7;
          color: #334155;
        }

        .top-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .panel {
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
          padding: 20px;
        }

        .health-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 6px;
        }

        .health-value {
          font-size: 42px;
          line-height: 1;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .health-text {
          font-size: 16px;
          color: #334155;
          margin-bottom: 14px;
        }

        .progress-track {
          height: 12px;
          width: 100%;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
        }

        .progress-fill.good {
          background: #22c55e;
        }

        .progress-fill.warn {
          background: #f59e0b;
        }

        .progress-fill.bad {
          background: #ef4444;
        }

        .health-note {
          font-size: 12px;
          line-height: 1.6;
          color: #475569;
        }

        .summary-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #0f172a;
        }

        .summary-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 14px;
        }

        .summary-grid,
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .print-section {
          margin-bottom: 20px;
        }

        .section-card {
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
          padding: 20px;
        }

        .section-head {
          margin-bottom: 14px;
        }

        .section-title {
          margin: 0 0 6px;
          font-size: 24px;
          color: #0f172a;
        }

        .section-subtitle {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        .kpi-card {
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: #ffffff;
          padding: 16px;
          min-height: 148px;
        }

        .kpi-card.tone-green {
          border-color: #bbf7d0;
          background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
        }

        .kpi-card.tone-yellow {
          border-color: #fde68a;
          background: linear-gradient(180deg, #ffffff 0%, #fffbeb 100%);
        }

        .kpi-card.tone-red {
          border-color: #fecaca;
          background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%);
        }

        .kpi-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .kpi-value {
          font-size: 26px;
          line-height: 1.1;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .kpi-delta {
          font-size: 12px;
          color: #475569;
        }

        .mini-bars {
          margin-top: 14px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 40px;
        }

        .mini-bar {
          width: 8px;
          border-radius: 999px;
          background: #cbd5e1;
        }

        .table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
        }

        .print-table th,
        .print-table td {
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          padding: 10px 8px;
          text-align: left;
          vertical-align: top;
          word-break: break-word;
        }

        .print-table th:last-child,
        .print-table td:last-child {
          border-right: none;
        }

        .print-table thead th {
          background: #f8fafc;
          font-weight: 700;
          color: #0f172a;
        }

        .alt-row td {
          background: #fcfdff;
        }

        .row-label {
          font-weight: 600;
          width: 220px;
        }

        @media (max-width: 1100px) {
          .top-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid,
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .header-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-badges {
            justify-content: flex-start;
          }

          .summary-grid,
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }

          html,
          body {
            width: auto;
            min-height: auto;
            background: #ffffff !important;
            color: #111827;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-root {
            width: 190mm;
            max-width: none;
            margin: 0 auto;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 9.5pt;
            line-height: 1.35;
          }

          .report-header,
          .panel,
          .section-card,
          .kpi-card {
            box-shadow: none;
            border-color: #d6dde8;
            border-radius: 6px;
          }

          .report-header {
            position: relative;
            overflow: hidden;
            padding: 6.5mm 8mm 7mm;
            margin-bottom: 5mm;
            border-top: 0;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 58%);
          }

          .report-header::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1.7mm;
            background: #0f172a;
          }

          .header-top {
            gap: 10mm;
            margin-bottom: 6mm;
            padding-top: 2mm;
          }

          .brand-logo {
            display: block;
            width: 58mm;
            max-height: 16mm;
            object-fit: contain;
            object-position: left center;
          }

          .header-badges {
            max-width: 96mm;
            gap: 2mm;
            padding-top: 1mm;
          }

          .meta-pill {
            border-radius: 4px;
            padding: 2mm 3mm;
            font-size: 8pt;
            line-height: 1.2;
          }

          .eyebrow {
            font-size: 7.5pt;
            margin-bottom: 2.4mm;
          }

          .report-title {
            font-size: 20pt;
            line-height: 1.15;
            margin-bottom: 2.6mm;
            letter-spacing: 0;
          }

          .intro {
            max-width: none;
            font-size: 9pt;
            line-height: 1.45;
          }

          .top-grid {
            grid-template-columns: 54mm 1fr;
            gap: 4mm;
            margin-bottom: 5mm;
          }

          .panel,
          .section-card {
            padding: 5mm;
          }

          .panel {
            background: #ffffff;
          }

          .health-value {
            font-size: 28pt;
          }

          .health-text,
          .summary-subtitle,
          .section-subtitle,
          .health-note {
            font-size: 8.5pt;
            line-height: 1.35;
          }

          .summary-title,
          .section-title {
            font-size: 15pt;
            line-height: 1.2;
          }

          .summary-grid,
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2.6mm;
          }

          .print-section {
            margin-bottom: 5mm;
          }

          .section-head {
            margin-bottom: 4mm;
            padding-bottom: 3mm;
            border-bottom: 1px solid #e2e8f0;
          }

          .balance-section {
            break-before: page;
            page-break-before: always;
          }

          .kpi-card {
            position: relative;
            min-height: 25mm;
            padding: 3.5mm;
            background: #ffffff !important;
          }

          .kpi-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 0.8mm;
            background: #cbd5e1;
            border-radius: 6px 6px 0 0;
          }

          .kpi-card.tone-green::before {
            background: #22c55e;
          }

          .kpi-card.tone-yellow::before {
            background: #f59e0b;
          }

          .kpi-card.tone-red::before {
            background: #ef4444;
          }

          .kpi-label,
          .kpi-delta {
            font-size: 7.6pt;
            line-height: 1.25;
          }

          .kpi-label {
            color: #64748b;
            font-weight: 600;
          }

          .kpi-value {
            font-size: 13.2pt;
            line-height: 1.15;
            margin-bottom: 1.5mm;
            overflow-wrap: anywhere;
          }

          .mini-bars {
            height: 8.5mm;
            margin-top: 2.2mm;
            gap: 1mm;
          }

          .mini-bar {
            width: 1.8mm;
          }

          .table-wrap {
            border-radius: 4px;
            overflow: visible;
          }

          .print-table {
            table-layout: fixed;
            font-size: 7.4pt;
            line-height: 1.22;
          }

          .print-table th,
          .print-table td {
            padding: 2mm 1.4mm;
            word-break: normal;
            overflow-wrap: anywhere;
            hyphens: auto;
          }

          .print-table th:not(:first-child),
          .print-table td:not(:first-child) {
            text-align: right;
          }

          .row-label {
            width: 36mm;
          }

          .page-break {
            break-before: page;
            page-break-before: always;
          }

          .avoid-break,
          .kpi-card,
          .report-header,
          .panel,
          .balance-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .section-card {
            break-inside: auto;
            page-break-inside: auto;
          }

          .section-card.avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <header className="report-header avoid-break">
        <div className="header-top">
          <div>
            <div className="eyebrow">DataGate Insight</div>
            <img src="/logo_dark_napis.png" alt="DataGate" className="brand-logo" />
          </div>

          <div className="header-badges">
            <span className="meta-pill">Branża: {industryLabel(industry)}</span>
            <span className="meta-pill">
              Okres główny:{" "}
              {selectedBalancePeriod ? getPeriodLabel(selectedBalancePeriod) : "—"}
            </span>
            <span className={`meta-pill health ${health.tone}`}>
              Health Score: {health.score}/100
            </span>
          </div>
        </div>

        <h1 className="report-title">{reportName || "Raport finansowy"}</h1>

        <p className="intro">
          Raport łączy analizę bilansu, RZiS oraz wskaźniki łączne. Wersja PDF
          pokazuje tylko realne okresy danych i pomija techniczne okresy zerowe,
          dzięki czemu jest bliższa realnemu widokowi produktu.
        </p>
      </header>

      <section className="top-grid avoid-break">
        <div className="panel">
          <div className="health-label">Health Score</div>
          <div className="health-value">{health.score}/100</div>
          <div className="health-text">{health.label}</div>

          <div className="progress-track">
            <div
              className={`progress-fill ${health.tone}`}
              style={{ width: `${health.score}%` }}
            />
          </div>

          <div className="health-note">
            Score liczony jest na podstawie kluczowych wskaźników bilansowych
            dla głównego okresu raportu.
          </div>
        </div>

        <div className="panel">
          <div className="summary-title">Podsumowanie</div>
          <div className="summary-subtitle">
            Najważniejsze liczby dla bieżących okresów sekcyjnych.
          </div>

          <div className="summary-grid">
            <KpiCard
              label="Aktywa razem"
              value={formatCurrency(selectedBalance.aktywaRazem)}
              delta={formatDeltaPercent(
                selectedBalance.aktywaRazem,
                previousBalance.aktywaRazem
              )}
            />
            <KpiCard
              label="Kapitał własny"
              value={formatCurrency(selectedBalance.kapitalWlasny)}
              delta={formatDeltaPercent(
                selectedBalance.kapitalWlasny,
                previousBalance.kapitalWlasny
              )}
            />
            <KpiCard
              label="Zadłużenie"
              value={formatPercent(selectedBalance.debtRatio)}
              tone={getMetricTone(selectedBalance.debtRatio, 0.5, 0.7, true)}
              delta={formatDeltaPercent(
                selectedBalance.debtRatio,
                previousBalance.debtRatio
              )}
            />
            <KpiCard
              label="Przychody"
              value={formatCurrency(selectedIncome.revenue)}
              delta={formatDeltaPercent(
                selectedIncome.revenue,
                previousIncome.revenue
              )}
            />
            <KpiCard
              label="Wynik netto"
              value={formatCurrency(selectedIncome.netProfit)}
              tone={(selectedIncome.netProfit ?? 0) >= 0 ? "green" : "red"}
              delta={formatDeltaPercent(
                selectedIncome.netProfit,
                previousIncome.netProfit
              )}
            />
            <KpiCard
              label="ROE"
              value={formatPercent(selectedCombined.roe)}
              tone={getMetricTone(selectedCombined.roe, 0.15, 0.07)}
              delta={formatDeltaPercent(
                selectedCombined.roe,
                previousCombined.roe
              )}
            />
          </div>
        </div>
      </section>

      <section className="print-section section-card balance-section avoid-break">
        <div className="section-head">
          <h2 className="section-title">Bilans</h2>
          <p className="section-subtitle">
            Kluczowe wskaźniki bilansowe dla wybranego okresu.
          </p>
        </div>

        <div className="kpi-grid">
          <KpiCard
            label="Aktywa razem"
            value={formatCurrency(selectedBalance.aktywaRazem)}
            delta={comparePeriods(
              selectedBalance.aktywaRazem,
              previousBalance.aktywaRazem
            ).text}
            trend={balancePeriods.map(
              (p) => getBalancePeriod(metrics, p).aktywaRazem ?? 0
            )}
          />
          <KpiCard
            label="Kapitał własny"
            value={formatCurrency(selectedBalance.kapitalWlasny)}
            delta={comparePeriods(
              selectedBalance.kapitalWlasny,
              previousBalance.kapitalWlasny
            ).text}
            trend={balancePeriods.map(
              (p) => getBalancePeriod(metrics, p).kapitalWlasny ?? 0
            )}
          />
          <KpiCard
            label="Zobowiązania"
            value={formatCurrency(selectedBalance.zobowiazania)}
            delta={comparePeriods(
              selectedBalance.zobowiazania,
              previousBalance.zobowiazania
            ).text}
            trend={balancePeriods.map(
              (p) => getBalancePeriod(metrics, p).zobowiazania ?? 0
            )}
          />
          <KpiCard
            label="Wskaźnik zadłużenia"
            value={formatPercent(selectedBalance.debtRatio)}
            tone={getMetricTone(selectedBalance.debtRatio, 0.5, 0.7, true)}
            delta={comparePeriods(
              selectedBalance.debtRatio,
              previousBalance.debtRatio
            ).text}
            trend={balancePeriods.map(
              (p) => getBalancePeriod(metrics, p).debtRatio ?? 0
            )}
          />
          <KpiCard
            label="Wskaźnik kapitału własnego"
            value={formatPercent(selectedBalance.equityRatio)}
            tone={getMetricTone(selectedBalance.equityRatio, 0.5, 0.3)}
            delta={comparePeriods(
              selectedBalance.equityRatio,
              previousBalance.equityRatio
            ).text}
            trend={balancePeriods.map(
              (p) => getBalancePeriod(metrics, p).equityRatio ?? 0
            )}
          />
          <KpiCard
            label="Dźwignia finansowa"
            value={formatNumber(selectedBalance.leverage)}
            tone={getMetricTone(selectedBalance.leverage, 2, 3, true)}
            delta={comparePeriods(
              selectedBalance.leverage,
              previousBalance.leverage
            ).text}
            trend={balancePeriods.map(
              (p) => getBalancePeriod(metrics, p).leverage ?? 0
            )}
          />
        </div>
      </section>

      <TrendTable
        title="Trend wskaźników bilansowych"
        subtitle="Tylko realne okresy danych bilansowych."
        headers={balanceHeaders}
        rows={balanceRows}
      />

      {incomeRows.length > 0 && (
        <>
          <section className="print-section section-card page-break avoid-break">
            <div className="section-head">
              <h2 className="section-title">RZiS</h2>
              <p className="section-subtitle">
                Wyniki finansowe i rentowność dla wybranego okresu.
              </p>
            </div>

            <div className="kpi-grid">
              <KpiCard
                label="Przychody"
                value={formatCurrency(selectedIncome.revenue)}
                delta={comparePeriods(
                  selectedIncome.revenue,
                  previousIncome.revenue
                ).text}
                trend={incomePeriods.map(
                  (p) => getIncomePeriod(incomeMetrics, p).revenue ?? 0
                )}
              />
              <KpiCard
                label="Wynik operacyjny"
                value={formatCurrency(selectedIncome.operatingProfit)}
                tone={(selectedIncome.operatingProfit ?? 0) >= 0 ? "green" : "red"}
                delta={comparePeriods(
                  selectedIncome.operatingProfit,
                  previousIncome.operatingProfit
                ).text}
                trend={incomePeriods.map(
                  (p) => getIncomePeriod(incomeMetrics, p).operatingProfit ?? 0
                )}
              />
              <KpiCard
                label="Wynik brutto"
                value={formatCurrency(selectedIncome.grossProfit)}
                tone={(selectedIncome.grossProfit ?? 0) >= 0 ? "green" : "red"}
                delta={comparePeriods(
                  selectedIncome.grossProfit,
                  previousIncome.grossProfit
                ).text}
                trend={incomePeriods.map(
                  (p) => getIncomePeriod(incomeMetrics, p).grossProfit ?? 0
                )}
              />
              <KpiCard
                label="Wynik netto"
                value={formatCurrency(selectedIncome.netProfit)}
                tone={(selectedIncome.netProfit ?? 0) >= 0 ? "green" : "red"}
                delta={comparePeriods(
                  selectedIncome.netProfit,
                  previousIncome.netProfit
                ).text}
                trend={incomePeriods.map(
                  (p) => getIncomePeriod(incomeMetrics, p).netProfit ?? 0
                )}
              />
              <KpiCard
                label="Marża operacyjna"
                value={formatPercent(selectedIncome.operatingMargin)}
                tone={getMetricTone(selectedIncome.operatingMargin, 0.1, 0.03)}
                delta={comparePeriods(
                  selectedIncome.operatingMargin,
                  previousIncome.operatingMargin
                ).text}
                trend={incomePeriods.map(
                  (p) => getIncomePeriod(incomeMetrics, p).operatingMargin ?? 0
                )}
              />
              <KpiCard
                label="Marża netto"
                value={formatPercent(selectedIncome.netMargin)}
                tone={getMetricTone(selectedIncome.netMargin, 0.08, 0.03)}
                delta={comparePeriods(
                  selectedIncome.netMargin,
                  previousIncome.netMargin
                ).text}
                trend={incomePeriods.map(
                  (p) => getIncomePeriod(incomeMetrics, p).netMargin ?? 0
                )}
              />
            </div>
          </section>

          <TrendTable
            title="Trend wyników w czasie"
            subtitle="Tylko realne okresy danych z rachunku zysków i strat."
            headers={incomeHeaders}
            rows={incomeRows}
          />
        </>
      )}

      {combinedRows.length > 0 && (
        <>
          <section className="print-section section-card page-break avoid-break">
            <div className="section-head">
              <h2 className="section-title">Analiza łączna</h2>
              <p className="section-subtitle">
                Wskaźniki liczone z połączenia bilansu i RZiS.
              </p>
            </div>

            <div className="kpi-grid">
              <KpiCard
                label="ROA"
                value={formatPercent(selectedCombined.roa)}
                tone={getMetricTone(selectedCombined.roa, 0.08, 0.03)}
                delta={comparePeriods(
                  selectedCombined.roa,
                  previousCombined.roa
                ).text}
                trend={combinedPeriods.map(
                  (p) => getCombinedPeriod(combinedMetrics, p).roa ?? 0
                )}
              />
              <KpiCard
                label="ROE"
                value={formatPercent(selectedCombined.roe)}
                tone={getMetricTone(selectedCombined.roe, 0.15, 0.07)}
                delta={comparePeriods(
                  selectedCombined.roe,
                  previousCombined.roe
                ).text}
                trend={combinedPeriods.map(
                  (p) => getCombinedPeriod(combinedMetrics, p).roe ?? 0
                )}
              />
              <KpiCard
                label="Rotacja należności"
                value={formatDays(selectedCombined.receivablesTurnoverDays)}
                delta={comparePeriods(
                  selectedCombined.receivablesTurnoverDays,
                  previousCombined.receivablesTurnoverDays
                ).text}
                trend={combinedPeriods.map(
                  (p) =>
                    getCombinedPeriod(combinedMetrics, p).receivablesTurnoverDays ??
                    0
                )}
              />
              <KpiCard
                label="Rotacja zapasów"
                value={formatDays(selectedCombined.inventoryTurnoverDays)}
                delta={comparePeriods(
                  selectedCombined.inventoryTurnoverDays,
                  previousCombined.inventoryTurnoverDays
                ).text}
                trend={combinedPeriods.map(
                  (p) =>
                    getCombinedPeriod(combinedMetrics, p).inventoryTurnoverDays ?? 0
                )}
              />
            </div>
          </section>

          <TrendTable
            title="Trend wskaźników łącznych"
            subtitle="Tylko realne okresy danych z analizy łącznej."
            headers={combinedHeaders}
            rows={combinedRows}
          />
        </>
      )}
    </div>
  );
}
