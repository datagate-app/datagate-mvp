"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import { auth } from "@/lib/firebase";

/* ================= BENCHMARK TYPES ================= */

type BenchmarkResponse = {
  industry: string;
  period: string;
  n: number;
  stats: Record<
    string,
    {
      n: number;
      p25: number | null;
      p50: number | null;
      p75: number | null;
    }
  >;
  unavailable?: boolean;
  reason?: string;
};

/* ================= TYPES ================= */

type ChangeColor = "green" | "red" | "gray";
type BenchTone = "good" | "mid" | "bad" | "none";
type ValueTone = "green" | "yellow" | "red";
type ReportTab = "balance" | "income" | "combined";

type BenchKey =
  | "debtRatio"
  | "equityRatio"
  | "leverage"
  | "debtToEquity"
  | "solvencyRatio";

type TrendMetricKey =
  | "debtRatio"
  | "equityRatio"
  | "leverage"
  | "debtToEquity"
  | "solvencyRatio"
  | "aktywaRazem"
  | "kapitalWlasny"
  | "zobowiazania";

type IncomeTrendMetricKey =
  | "revenue"
  | "operatingProfit"
  | "grossProfit"
  | "netProfit"
  | "operatingMargin"
  | "netMargin"
  | "ros";

type CombinedTrendMetricKey =
  | "roa"
  | "roe"
  | "receivablesTurnoverDays"
  | "inventoryTurnoverDays";

type HealthBreakdownItem = {
  key: BenchKey;
  label: string;
  rawValue?: number;
  rawScore: number;
  weight: number;
  weightedPoints: number;
  format: "percent" | "number";
};

/* ================= HELPERS ================= */

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

const BENCH_DIRECTION: Record<
  BenchKey,
  "higherIsBetter" | "lowerIsBetter"
> = {
  debtRatio: "lowerIsBetter",
  equityRatio: "higherIsBetter",
  leverage: "lowerIsBetter",
  debtToEquity: "lowerIsBetter",
  solvencyRatio: "higherIsBetter",
};

const TREND_METRIC_OPTIONS: {
  key: TrendMetricKey;
  label: string;
  type: "percent" | "number" | "currency";
}[] = [
  { key: "debtRatio", label: "Wskaźnik zadłużenia", type: "percent" },
  {
    key: "equityRatio",
    label: "Wskaźnik kapitału własnego",
    type: "percent",
  },
  { key: "leverage", label: "Dźwignia finansowa", type: "number" },
  { key: "debtToEquity", label: "Dług / Kapitał własny", type: "number" },
  { key: "solvencyRatio", label: "Wypłacalność", type: "number" },
];

const INCOME_TREND_OPTIONS: {
  key: IncomeTrendMetricKey;
  label: string;
  type: "percent" | "number" | "currency";
}[] = [
  { key: "revenue", label: "Przychody", type: "currency" },
  { key: "operatingProfit", label: "Wynik operacyjny", type: "currency" },
  { key: "grossProfit", label: "Wynik brutto", type: "currency" },
  { key: "netProfit", label: "Wynik netto", type: "currency" },
  { key: "operatingMargin", label: "Marża operacyjna", type: "percent" },
  { key: "netMargin", label: "Marża netto", type: "percent" },
  { key: "ros", label: "ROS", type: "percent" },
];

const COMBINED_TREND_OPTIONS: {
  key: CombinedTrendMetricKey;
  label: string;
  type: "percent" | "number" | "currency";
}[] = [
  { key: "roa", label: "ROA", type: "percent" },
  { key: "roe", label: "ROE", type: "percent" },
  {
    key: "receivablesTurnoverDays",
    label: "Rotacja należności",
    type: "number",
  },
  {
    key: "inventoryTurnoverDays",
    label: "Rotacja zapasów",
    type: "number",
  },
];

const HEALTH_WEIGHTS: Record<BenchKey, number> = {
  debtRatio: 0.3,
  equityRatio: 0.25,
  leverage: 0.2,
  debtToEquity: 0.15,
  solvencyRatio: 0.1,
};

function getPeriodLabel(period: string) {
  return (PERIOD_LABELS as Record<string, string>)[period] ?? period;
}

function industryLabel(industry?: string) {
  if (!industry) return "—";
  return (INDUSTRIES as Record<string, string>)[industry] ?? industry;
}

function formatCurrency(value?: number) {
  return `${((value ?? 0) * 1000).toLocaleString("pl-PL")} zł`;
}

function formatPercent(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}

function formatNumber(value?: number) {
  return (value ?? 0).toFixed(2);
}

function formatDays(value?: number) {
  return `${(value ?? 0).toFixed(1)} dni`;
}

function formatValueByType(
  value: number | undefined,
  type: "percent" | "number" | "currency"
) {
  if (type === "percent") return formatPercent(value);
  if (type === "currency") return formatCurrency(value);
  return formatNumber(value);
}

function buildTrend(
  metrics: Metrics,
  key: keyof SinglePeriodMetrics,
  periods: readonly PeriodKey[]
) {
  return periods.map((p) => metrics[p]?.[key] ?? 0);
}

function buildIncomeTrend(
  metrics: IncomeMetrics,
  key: keyof SinglePeriodIncomeMetrics,
  periods: readonly PeriodKey[]
) {
  return periods.map((p) => metrics[p]?.[key] ?? 0);
}

function buildCombinedTrend(
  metrics: CombinedMetrics,
  key: keyof SinglePeriodCombinedMetrics,
  periods: readonly PeriodKey[]
) {
  return periods.map((p) => metrics[p]?.[key] ?? 0);
}

function comparePeriods(
  current?: number,
  prev?: number
): { text: string; color: ChangeColor } {
  if (prev === undefined || prev === null) {
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

/* ================= HEALTH SCORE V2 ================= */

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

function calculateHealthScoreDetails(m: SinglePeriodMetrics) {
  const breakdown: HealthBreakdownItem[] = [
    {
      key: "debtRatio",
      label: "Zadłużenie",
      rawValue: m.debtRatio,
      rawScore: scoreDebtRatio(m.debtRatio),
      weight: HEALTH_WEIGHTS.debtRatio,
      weightedPoints: scoreDebtRatio(m.debtRatio) * HEALTH_WEIGHTS.debtRatio,
      format: "percent",
    },
    {
      key: "equityRatio",
      label: "Kapitał własny",
      rawValue: m.equityRatio,
      rawScore: scoreEquityRatio(m.equityRatio),
      weight: HEALTH_WEIGHTS.equityRatio,
      weightedPoints:
        scoreEquityRatio(m.equityRatio) * HEALTH_WEIGHTS.equityRatio,
      format: "percent",
    },
    {
      key: "leverage",
      label: "Dźwignia",
      rawValue: m.leverage,
      rawScore: scoreLeverage(m.leverage),
      weight: HEALTH_WEIGHTS.leverage,
      weightedPoints: scoreLeverage(m.leverage) * HEALTH_WEIGHTS.leverage,
      format: "number",
    },
    {
      key: "debtToEquity",
      label: "Dług / Kapitał",
      rawValue: m.debtToEquity,
      rawScore: scoreDebtToEquity(m.debtToEquity),
      weight: HEALTH_WEIGHTS.debtToEquity,
      weightedPoints:
        scoreDebtToEquity(m.debtToEquity) * HEALTH_WEIGHTS.debtToEquity,
      format: "number",
    },
    {
      key: "solvencyRatio",
      label: "Wypłacalność",
      rawValue: m.solvencyRatio,
      rawScore: scoreSolvencyRatio(m.solvencyRatio),
      weight: HEALTH_WEIGHTS.solvencyRatio,
      weightedPoints:
        scoreSolvencyRatio(m.solvencyRatio) * HEALTH_WEIGHTS.solvencyRatio,
      format: "number",
    },
  ];

  const score = Math.round(
    breakdown.reduce((sum, item) => sum + item.weightedPoints, 0)
  );

  return {
    score,
    breakdown,
  };
}

function getHealthLabel(score: number) {
  if (score >= 80) return "Bardzo dobra kondycja";
  if (score >= 60) return "Stabilna kondycja";
  if (score >= 40) return "Umiarkowane ryzyko";
  return "Wysokie ryzyko";
}

function getHealthTone(score: number): ValueTone {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

function getDebtColor(value?: number): ValueTone {
  const v = value ?? 0;
  if (v < 0.5) return "green";
  if (v < 0.7) return "yellow";
  return "red";
}

function getEquityColor(value?: number): ValueTone {
  const v = value ?? 0;
  if (v > 0.5) return "green";
  if (v > 0.3) return "yellow";
  return "red";
}

function getLeverageColor(value?: number): ValueTone {
  const v = value ?? 0;
  if (v <= 2) return "green";
  if (v <= 3) return "yellow";
  return "red";
}

function getDebtToEquityColor(value?: number): ValueTone {
  const v = value ?? 0;
  if (v <= 1.5) return "green";
  if (v <= 2.5) return "yellow";
  return "red";
}

function getSolvencyColor(value?: number): ValueTone {
  const v = value ?? 0;
  if (v >= 2) return "green";
  if (v >= 1.2) return "yellow";
  return "red";
}

function getMetricTone(
  key: BenchKey,
  value?: number
): "green" | "yellow" | "red" {
  if (key === "debtRatio") return getDebtColor(value);
  if (key === "equityRatio") return getEquityColor(value);
  if (key === "leverage") return getLeverageColor(value);
  if (key === "debtToEquity") return getDebtToEquityColor(value);
  return getSolvencyColor(value);
}

function getHealthBreakdownTone(rawScore: number): ValueTone {
  if (rawScore >= 80) return "green";
  if (rawScore >= 60) return "yellow";
  return "red";
}

function getToneClasses(tone?: ValueTone) {
  if (tone === "green") {
    return {
      text: "text-green-700",
      badge: "bg-green-50 text-green-700 border-green-200",
      border: "border-green-200",
      bg: "bg-green-50/40",
      soft: "bg-green-500",
    };
  }

  if (tone === "yellow") {
    return {
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      border: "border-amber-200",
      bg: "bg-amber-50/40",
      soft: "bg-amber-500",
    };
  }

  return {
    text: "text-red-700",
    badge: "bg-red-50 text-red-700 border-red-200",
    border: "border-red-200",
    bg: "bg-red-50/40",
    soft: "bg-red-500",
  };
}

function getBenchmarkStat(
  benchmark: BenchmarkResponse | null | undefined,
  key: string
) {
  const s = benchmark?.stats?.[key];
  if (!s) return null;
  return s;
}

function inRangeLabel(
  value?: number,
  p25?: number | null,
  p75?: number | null
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (p25 == null || p75 == null) return null;

  if (value < p25) return "poniżej typowego zakresu";
  if (value > p75) return "powyżej typowego zakresu";
  return "w typowym zakresie";
}

function benchToneFor(
  key: BenchKey,
  value?: number,
  p25?: number | null,
  p75?: number | null
): BenchTone {
  if (typeof value !== "number" || !Number.isFinite(value)) return "none";
  if (p25 == null || p75 == null) return "none";

  if (value >= p25 && value <= p75) return "mid";

  const dir = BENCH_DIRECTION[key];

  if (dir === "higherIsBetter") {
    if (value > p75) return "good";
    if (value < p25) return "bad";
  } else {
    if (value < p25) return "good";
    if (value > p75) return "bad";
  }

  return "mid";
}

function toneToLabel(tone: BenchTone) {
  if (tone === "good") return "korzystnie względem branży";
  if (tone === "mid") return "w typowym zakresie branży";
  if (tone === "bad") return "niekorzystnie względem branży";
  return "brak benchmarku";
}

function toneToClasses(tone: BenchTone) {
  if (tone === "good") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (tone === "mid") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (tone === "bad") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-gray-50 text-gray-600 border-gray-200";
}

function buildInsightList(args: {
  current: SinglePeriodMetrics;
  healthScore: number;
  benchmark?: BenchmarkResponse | null;
}) {
  const { current, healthScore, benchmark } = args;
  const insights: { title: string; tone: BenchTone | "neutral" }[] = [];

  if (healthScore < 40) {
    insights.push({
      title: "Ogólna kondycja finansowa wskazuje na wysokie ryzyko.",
      tone: "bad",
    });
  } else if (healthScore >= 80) {
    insights.push({
      title: "Ogólna kondycja finansowa wygląda bardzo dobrze.",
      tone: "good",
    });
  } else if (healthScore >= 60) {
    insights.push({
      title: "Ogólna kondycja finansowa wygląda stabilnie.",
      tone: "mid",
    });
  }

  const debtStat = getBenchmarkStat(benchmark, "debtRatio");
  const debtTone = benchToneFor(
    "debtRatio",
    current.debtRatio,
    debtStat?.p25,
    debtStat?.p75
  );

  if (debtTone === "bad") {
    insights.push({
      title: "Zadłużenie jest powyżej typowego zakresu branżowego.",
      tone: "bad",
    });
  } else if (debtTone === "good") {
    insights.push({
      title: "Poziom zadłużenia wygląda korzystnie względem branży.",
      tone: "good",
    });
  }

  const solvencyStat = getBenchmarkStat(benchmark, "solvencyRatio");
  const solvencyTone = benchToneFor(
    "solvencyRatio",
    current.solvencyRatio,
    solvencyStat?.p25,
    solvencyStat?.p75
  );

  if (solvencyTone === "bad") {
    insights.push({
      title: "Wypłacalność jest poniżej typowego zakresu branżowego.",
      tone: "bad",
    });
  } else if (solvencyTone === "good") {
    insights.push({
      title: "Wypłacalność wygląda korzystnie względem branży.",
      tone: "good",
    });
  }

  const equityStat = getBenchmarkStat(benchmark, "equityRatio");
  const equityTone = benchToneFor(
    "equityRatio",
    current.equityRatio,
    equityStat?.p25,
    equityStat?.p75
  );

  if (equityTone === "bad") {
    insights.push({
      title: "Udział kapitału własnego jest poniżej typowego zakresu.",
      tone: "bad",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Brak silnych odchyleń alarmowych w aktualnie wybranym okresie.",
      tone: "neutral",
    });
  }

  return insights.slice(0, 3);
}

function buildIncomeInsights(args: {
  current: SinglePeriodIncomeMetrics;
  combined?: SinglePeriodCombinedMetrics;
}) {
  const { current, combined } = args;
  const insights: { title: string; tone: BenchTone | "neutral" }[] = [];

  if ((current.netMargin ?? 0) < 0) {
    insights.push({
      title: "Firma notuje ujemną marżę netto w wybranym okresie.",
      tone: "bad",
    });
  } else if ((current.netMargin ?? 0) >= 0.1) {
    insights.push({
      title: "Marża netto wygląda solidnie na tle typowych poziomów.",
      tone: "good",
    });
  }

  if ((current.revenueGrowth ?? 0) > 0.1) {
    insights.push({
      title: "Przychody rosną względem poprzedniego okresu.",
      tone: "good",
    });
  } else if ((current.revenueGrowth ?? 0) < -0.1) {
    insights.push({
      title: "Przychody spadają względem poprzedniego okresu.",
      tone: "bad",
    });
  }

  if ((combined?.roe ?? 0) >= 0.15) {
    insights.push({
      title: "ROE wskazuje na dobrą efektywność kapitału własnego.",
      tone: "good",
    });
  } else if ((combined?.roe ?? 0) < 0.05 && (combined?.roe ?? 0) > 0) {
    insights.push({
      title: "ROE jest niskie — kapitał pracuje mało efektywnie.",
      tone: "mid",
    });
  } else if ((combined?.roe ?? 0) < 0) {
    insights.push({
      title: "ROE jest ujemne, co oznacza stratę względem kapitału własnego.",
      tone: "bad",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Brak silnych odchyleń w wynikach operacyjnych i rentowności.",
      tone: "neutral",
    });
  }

  return insights.slice(0, 3);
}

/* ================= SMALL UI PARTS ================= */

function MiniTrendBars({ values }: { values: number[] }) {
  const safe = values.map((v) => (Number.isFinite(v) ? Math.max(v, 0) : 0));
  const max = Math.max(...safe, 1);

  return (
    <div className="mt-4 flex h-10 items-end gap-1">
      {safe.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-slate-300"
          style={{ height: `${Math.max((v / max) * 100, 10)}%` }}
        />
      ))}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="dg-card p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--dg-navy)]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-5 text-[var(--dg-gray-400)]">{subtitle}</p>}
        </div>
        {right && <div>{right}</div>}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: BenchTone | "neutral";
}) {
  const classes =
    tone === "good"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "bad"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "mid"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function TabSwitch({
  activeTab,
  onChange,
}: {
  activeTab: ReportTab;
  onChange: (tab: ReportTab) => void;
}) {
  const items: { key: ReportTab; label: string }[] = [
    { key: "balance", label: "Bilans" },
    { key: "income", label: "RZiS" },
    { key: "combined", label: "Analiza łączna" },
  ];

  return (
    <div className="dg-card p-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {items.map((item) => {
          const active = item.key === activeTab;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-br from-[var(--dg-teal)] to-[var(--dg-blue)] text-white"
                  : "bg-white text-[var(--dg-gray-600)] hover:bg-[var(--dg-gray-50)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--dg-radius)] border border-dashed border-[var(--dg-gray-300)] bg-[var(--dg-gray-50)] p-8">
      <h3 className="text-lg font-semibold text-[var(--dg-navy)]">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--dg-gray-500)]">
        {description}
      </p>
    </div>
  );
}

function HealthBreakdownCard({
  item,
}: {
  item: HealthBreakdownItem;
}) {
  const tone = getHealthBreakdownTone(item.rawScore);
  const toneClasses = getToneClasses(tone);

  return (
    <div className={`rounded-[var(--dg-radius)] border p-4 ${toneClasses.border} ${toneClasses.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{item.label}</p>
          <p className="mt-1 text-xs text-slate-500">
            Wartość:{" "}
            <span className="font-medium text-slate-700">
              {item.format === "percent"
                ? formatPercent(item.rawValue)
                : formatNumber(item.rawValue)}
            </span>
          </p>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses.badge}`}
        >
          {item.rawScore}/100
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Waga: {(item.weight * 100).toFixed(0)}%</span>
          <span>Wpływ: {item.weightedPoints.toFixed(1)} pkt</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${toneClasses.soft}`}
            style={{ width: `${Math.max(0, Math.min(item.rawScore, 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function HealthScoreCard({
  score,
  breakdown,
}: {
  score: number;
  breakdown: HealthBreakdownItem[];
}) {
  const tone = getHealthTone(score);
  const toneClasses = getToneClasses(tone);

  return (
    <div className={`rounded-[var(--dg-radius)] border p-5 ${toneClasses.border} ${toneClasses.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Health Score</p>
          <div className={`mt-2 text-4xl font-bold ${toneClasses.text}`}>
            {score}/100
          </div>
          <p className="mt-2 text-sm text-slate-700">{getHealthLabel(score)}</p>
        </div>

        <StatusBadge
          label={
            tone === "green"
              ? "dobry"
              : tone === "yellow"
              ? "umiarkowany"
              : "ryzyko"
          }
          tone={tone === "green" ? "good" : tone === "yellow" ? "mid" : "bad"}
        />
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneClasses.soft}`}
          style={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
        />
      </div>

      <div className="mt-5 rounded-[var(--dg-radius)] border border-[var(--dg-gray-200)] bg-white/70 p-4">
        <p className="text-sm font-medium text-slate-800">
          Jak liczony jest wynik
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Score opiera się na 5 wskaźnikach finansowych. Każdy ma własny próg
          oceny i wagę w końcowym wyniku.
        </p>

        <div className="mt-4 grid gap-3">
          {breakdown.map((item) => (
            <HealthBreakdownCard key={item.key} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutiveInsightCard({
  title,
  tone,
}: {
  title: string;
  tone: BenchTone | "neutral";
}) {
  const classes =
    tone === "good"
      ? "border-green-200 bg-green-50/60"
      : tone === "bad"
      ? "border-red-200 bg-red-50/60"
      : tone === "mid"
      ? "border-amber-200 bg-amber-50/60"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[var(--dg-radius)] border p-4 ${classes}`}>
      <p className="text-sm font-medium text-slate-800">{title}</p>
    </div>
  );
}

function TrendLineChart({
  values,
  periods,
  formatter,
}: {
  values: number[];
  periods: PeriodKey[];
  formatter: (value?: number) => string;
}) {
  const width = 100;
  const height = 32;

  const safeValues = values.map((v) => (Number.isFinite(v) ? v : 0));
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);

  const normalized = safeValues.map((v, index) => {
    const x =
      safeValues.length === 1 ? 50 : (index / (safeValues.length - 1)) * width;

    const y =
      max === min
        ? height / 2
        : height - ((v - min) / (max - min)) * (height - 4) - 2;

    return { x, y, value: v };
  });

  const polyline = normalized.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="rounded-[var(--dg-radius)] border border-[var(--dg-gray-200)] bg-[var(--dg-gray-50)] p-4">
      <div className="h-40 md:h-48">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-slate-700"
            points={polyline}
          />
          {normalized.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="1.7"
              className="fill-slate-900"
            />
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9">
        {normalized.map((point, i) => (
          <div
            key={`${periods[i]}-${i}`}
            className="rounded-[var(--dg-radius-sm)] border border-[var(--dg-gray-200)] bg-white p-3"
          >
            <p className="text-xs text-slate-500">{getPeriodLabel(periods[i])}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatter(point.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenchmarkRangeBar({
  title,
  value,
  formatter,
  stat,
  tone,
}: {
  title: string;
  value?: number;
  formatter: (value?: number) => string;
  stat:
    | {
        n: number;
        p25: number | null;
        p50: number | null;
        p75: number | null;
      }
    | null
    | undefined;
  tone: BenchTone;
}) {
  const p25 = stat?.p25;
  const p50 = stat?.p50;
  const p75 = stat?.p75;

  const hasData =
    typeof value === "number" &&
    Number.isFinite(value) &&
    p25 != null &&
    p50 != null &&
    p75 != null;

  const allValues = hasData
    ? [value as number, p25 as number, p50 as number, p75 as number]
    : [];
  const min = hasData ? Math.min(...allValues) : 0;
  const max = hasData ? Math.max(...allValues, min + 1) : 1;

  const pos = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const toneClasses = toneToClasses(tone);

  return (
    <div className="rounded-[var(--dg-radius)] border border-[var(--dg-gray-200)] bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Twoja firma:{" "}
            <span className="font-medium text-slate-800">{formatter(value)}</span>
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClasses}`}
        >
          {toneToLabel(tone)}
        </span>
      </div>

      {hasData ? (
        <>
          <div className="relative mt-5 h-12">
            <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-slate-100" />

            <div
              className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-300/80"
              style={{
                left: `${pos(p25 as number)}%`,
                width: `${Math.max(pos(p75 as number) - pos(p25 as number), 2)}%`,
              }}
            />

            <div
              className="absolute top-1/2 h-6 w-[2px] -translate-y-1/2 bg-slate-800"
              style={{ left: `${pos(p50 as number)}%` }}
              title={`Mediana: ${formatter(p50 as number)}`}
            />

            <div
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow ${
                tone === "good"
                  ? "bg-green-500"
                  : tone === "bad"
                  ? "bg-red-500"
                  : tone === "mid"
                  ? "bg-amber-500"
                  : "bg-slate-500"
              }`}
              style={{
                left: `calc(${pos(value as number)}% - 10px)`,
              }}
              title={`Twoja firma: ${formatter(value)}`}
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">P25</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatter(p25 as number)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Mediana</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatter(p50 as number)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">P75</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatter(p75 as number)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Próba</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {stat?.n ?? 0}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-[var(--dg-radius)] border border-dashed border-[var(--dg-gray-200)] bg-[var(--dg-gray-50)] p-4 text-sm text-[var(--dg-gray-500)]">
          Brak pełnych danych benchmarkowych dla tego wskaźnika.
        </div>
      )}
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  tone?: ValueTone;
  change?: string;
  changeColor?: ChangeColor;
  trend?: number[];
  benchmarkLine1?: string;
  benchmarkLine2?: string;
  benchmarkTone?: BenchTone;
};

function MetricCard({
  title,
  value,
  tone,
  change,
  changeColor,
  trend,
  benchmarkLine1,
  benchmarkLine2,
  benchmarkTone = "none",
}: MetricCardProps) {
  const toneClasses = tone ? getToneClasses(tone) : null;

  const changeColorClass =
    changeColor === "green"
      ? "text-green-600"
      : changeColor === "red"
      ? "text-red-600"
      : "text-slate-500";

  return (
    <div
      className={`rounded-[var(--dg-radius)] border bg-white p-5 shadow-sm dg-card-hover ${
        toneClasses ? toneClasses.border : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              toneClasses ? toneClasses.text : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>

        {benchmarkLine2 && (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneToClasses(
              benchmarkTone
            )}`}
          >
            {toneToLabel(benchmarkTone)}
          </span>
        )}
      </div>

      {change && <p className={`mt-2 text-sm ${changeColorClass}`}>{change}</p>}

      {benchmarkLine1 && (
        <div className="mt-4 rounded-[var(--dg-radius-sm)] bg-[var(--dg-gray-50)] p-3">
          <p className="text-xs leading-5 text-slate-600">{benchmarkLine1}</p>
          {benchmarkLine2 && (
            <p className="mt-2 text-xs font-medium text-slate-700">
              {benchmarkLine2}
            </p>
          )}
        </div>
      )}

      {trend && trend.length > 1 && <MiniTrendBars values={trend} />}
    </div>
  );
}

function SummaryMetricCard({
  title,
  value,
  tone,
  helper,
}: {
  title: string;
  value: string;
  tone?: ValueTone;
  helper?: string;
}) {
  const toneClasses = tone ? getToneClasses(tone) : null;

  return (
    <div
      className={`rounded-[var(--dg-radius)] border bg-white p-4 ${
        toneClasses ? toneClasses.border : "border-slate-200"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p
        className={`mt-2 text-xl font-bold ${
          toneClasses ? toneClasses.text : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

/* ================= COMPONENT ================= */

interface ReportViewProps {
  metrics: Metrics;
  incomeMetrics?: IncomeMetrics;
  combinedMetrics?: CombinedMetrics;
  reportName?: string;
  industry?: string;
  benchmark?: BenchmarkResponse | null;
  benchmarkLoading?: boolean;
}

export default function ReportView({
  metrics,
  incomeMetrics,
  combinedMetrics,
  reportName,
  industry,
  benchmark,
  benchmarkLoading,
}: ReportViewProps) {
  const params = useParams<{ id: string }>();
  const reportId = params?.id;

  const [activeTab, setActiveTab] = useState<ReportTab>("balance");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("t0");
  const [selectedTrendMetric, setSelectedTrendMetric] =
    useState<TrendMetricKey>("debtRatio");
  const [selectedIncomeTrendMetric, setSelectedIncomeTrendMetric] =
    useState<IncomeTrendMetricKey>("revenue");
  const [selectedCombinedTrendMetric, setSelectedCombinedTrendMetric] =
    useState<CombinedTrendMetricKey>("roa");

  const [currentBenchmark, setCurrentBenchmark] = useState<
    BenchmarkResponse | null | undefined
  >(benchmark);

  const [currentBenchmarkLoading, setCurrentBenchmarkLoading] = useState(
    Boolean(benchmarkLoading)
  );

  const currentIndex = PERIODS.indexOf(selectedPeriod);
  const prevKey = currentIndex > 0 ? PERIODS[currentIndex - 1] : undefined;

  const current = metrics[selectedPeriod];
  const prev = prevKey ? metrics[prevKey] : undefined;

  const currentIncome = incomeMetrics?.[selectedPeriod];
  const prevIncome = prevKey ? incomeMetrics?.[prevKey] : undefined;

  const currentCombined = combinedMetrics?.[selectedPeriod];
  const prevCombined = prevKey ? combinedMetrics?.[prevKey] : undefined;

  const healthDetails = useMemo(
    () => calculateHealthScoreDetails(current),
    [current]
  );
  const healthScore = healthDetails.score;

  useEffect(() => {
    setCurrentBenchmark(benchmark);
  }, [benchmark]);

  useEffect(() => {
    let cancelled = false;

    async function loadBenchmarkForPeriod() {
      if (!reportId) return;

      if (selectedPeriod === "t0" && benchmark) {
        setCurrentBenchmark(benchmark);
        setCurrentBenchmarkLoading(false);
        return;
      }

      try {
        setCurrentBenchmarkLoading(true);

        const user = auth.currentUser;
        if (!user) {
          setCurrentBenchmark(null);
          setCurrentBenchmarkLoading(false);
          return;
        }

        const token = await user.getIdToken();

        const res = await fetch(
          `/api/reports/${reportId}/benchmark?period=${selectedPeriod}&limit=200`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(`Benchmark fetch failed: ${res.status}`);
        }

        const data = (await res.json()) as BenchmarkResponse;

        if (!cancelled) {
          setCurrentBenchmark(data);
        }
      } catch (error) {
        console.error("Błąd pobierania benchmarku:", error);

        if (!cancelled) {
          setCurrentBenchmark({
            industry: industry ?? "",
            period: selectedPeriod,
            n: 0,
            stats: {},
            unavailable: true,
            reason: "Nie udało się pobrać benchmarku dla wybranego okresu.",
          });
        }
      } finally {
        if (!cancelled) {
          setCurrentBenchmarkLoading(false);
        }
      }
    }

    void loadBenchmarkForPeriod();

    return () => {
      cancelled = true;
    };
  }, [benchmark, industry, reportId, selectedPeriod]);

  const cmp = useMemo(() => {
    return {
      aktywaRazem: comparePeriods(current.aktywaRazem, prev?.aktywaRazem),
      kapitalWlasny: comparePeriods(current.kapitalWlasny, prev?.kapitalWlasny),
      zobowiazania: comparePeriods(current.zobowiazania, prev?.zobowiazania),
      debtRatio: comparePeriods(current.debtRatio, prev?.debtRatio),
      equityRatio: comparePeriods(current.equityRatio, prev?.equityRatio),
      leverage: comparePeriods(current.leverage, prev?.leverage),
      debtToEquity: comparePeriods(current.debtToEquity, prev?.debtToEquity),
      solvencyRatio: comparePeriods(current.solvencyRatio, prev?.solvencyRatio),
    };
  }, [current, prev]);

  const incomeCmp = useMemo(() => {
    return {
      revenue: comparePeriods(currentIncome?.revenue, prevIncome?.revenue),
      operatingProfit: comparePeriods(
        currentIncome?.operatingProfit,
        prevIncome?.operatingProfit
      ),
      grossProfit: comparePeriods(
        currentIncome?.grossProfit,
        prevIncome?.grossProfit
      ),
      netProfit: comparePeriods(currentIncome?.netProfit, prevIncome?.netProfit),
      operatingMargin: comparePeriods(
        currentIncome?.operatingMargin,
        prevIncome?.operatingMargin
      ),
      netMargin: comparePeriods(currentIncome?.netMargin, prevIncome?.netMargin),
      ros: comparePeriods(currentIncome?.ros, prevIncome?.ros),
    };
  }, [currentIncome, prevIncome]);

  const combinedCmp = useMemo(() => {
    return {
      roa: comparePeriods(currentCombined?.roa, prevCombined?.roa),
      roe: comparePeriods(currentCombined?.roe, prevCombined?.roe),
      receivablesTurnoverDays: comparePeriods(
        currentCombined?.receivablesTurnoverDays,
        prevCombined?.receivablesTurnoverDays
      ),
      inventoryTurnoverDays: comparePeriods(
        currentCombined?.inventoryTurnoverDays,
        prevCombined?.inventoryTurnoverDays
      ),
    };
  }, [currentCombined, prevCombined]);

  const benchMeta = useMemo(() => {
    if (currentBenchmarkLoading) {
      return { title: "Benchmark branżowy", subtitle: "Ładowanie danych…" };
    }

    if (!currentBenchmark) {
      return {
        title: "Benchmark branżowy",
        subtitle: "Brak danych benchmarku.",
      };
    }

    if (currentBenchmark.unavailable) {
      return {
        title: "Benchmark branżowy",
        subtitle: currentBenchmark.reason ?? "Benchmark niedostępny.",
      };
    }

    return {
      title: `Benchmark branżowy – ${industryLabel(currentBenchmark.industry)}`,
      subtitle: `Próba: ${currentBenchmark.n} • okres benchmarku: ${getPeriodLabel(
        currentBenchmark.period
      )}`,
    };
  }, [currentBenchmark, currentBenchmarkLoading]);

  function benchLinesFor(
    key: BenchKey,
    currentValue?: number,
    formatter: (v?: number) => string = formatNumber
  ) {
    const s = getBenchmarkStat(currentBenchmark, key);

    if (!s || currentBenchmark?.unavailable) {
      return {
        line1: undefined,
        line2: undefined,
        tone: "none" as BenchTone,
      };
    }

    const label = inRangeLabel(currentValue, s.p25, s.p75);
    const tone = benchToneFor(key, currentValue, s.p25, s.p75);

    const line1 = `Branża: mediana ${formatter(
      s.p50 ?? undefined
    )} (p25–p75: ${formatter(s.p25 ?? undefined)} – ${formatter(
      s.p75 ?? undefined
    )})`;

    const line2 = label ? `Twoja firma: ${label}` : undefined;

    return { line1, line2, tone };
  }

  const benchDebt = benchLinesFor(
    "debtRatio",
    current.debtRatio,
    formatPercent
  );
  const benchEquity = benchLinesFor(
    "equityRatio",
    current.equityRatio,
    formatPercent
  );
  const benchLev = benchLinesFor("leverage", current.leverage, formatNumber);
  const benchD2E = benchLinesFor(
    "debtToEquity",
    current.debtToEquity,
    formatNumber
  );
  const benchSolv = benchLinesFor(
    "solvencyRatio",
    current.solvencyRatio,
    formatNumber
  );

  const balanceInsights = useMemo(
    () =>
      buildInsightList({
        current,
        healthScore,
        benchmark: currentBenchmark ?? null,
      }),
    [current, healthScore, currentBenchmark]
  );

  const incomeInsights = useMemo(
    () =>
      buildIncomeInsights({
        current: currentIncome ?? {},
        combined: currentCombined,
      }),
    [currentIncome, currentCombined]
  );

  const trendMeta =
    TREND_METRIC_OPTIONS.find((item) => item.key === selectedTrendMetric) ??
    TREND_METRIC_OPTIONS[0];

  const incomeTrendMeta =
    INCOME_TREND_OPTIONS.find(
      (item) => item.key === selectedIncomeTrendMetric
    ) ?? INCOME_TREND_OPTIONS[0];

  const combinedTrendMeta =
    COMBINED_TREND_OPTIONS.find(
      (item) => item.key === selectedCombinedTrendMetric
    ) ?? COMBINED_TREND_OPTIONS[0];

  const trendValues = buildTrend(metrics, selectedTrendMetric, PERIODS);
  const incomeTrendValues = incomeMetrics
    ? buildIncomeTrend(incomeMetrics, selectedIncomeTrendMetric, PERIODS)
    : [];
  const combinedTrendValues = combinedMetrics
    ? buildCombinedTrend(combinedMetrics, selectedCombinedTrendMetric, PERIODS)
    : [];

  const hasIncomeMetrics = Boolean(incomeMetrics);
  const hasCombinedMetrics = Boolean(combinedMetrics);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <section className="dg-card p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dg-gray-400)]">
                DataGate Insight
              </p>
              <h1 className="dg-title mt-2 text-2xl md:text-3xl">
                {reportName || "Raport finansowy"}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={`Branża: ${industryLabel(industry)}`}
                tone="neutral"
              />
              <StatusBadge
                label={`Okres: ${getPeriodLabel(selectedPeriod)}`}
                tone="neutral"
              />
              <StatusBadge
                label={`Health Score: ${healthScore}/100`}
                tone={
                  getHealthTone(healthScore) === "green"
                    ? "good"
                    : getHealthTone(healthScore) === "yellow"
                    ? "mid"
                    : "bad"
                }
              />
            </div>

            <p className="max-w-3xl text-sm leading-6 text-[var(--dg-gray-500)]">
              Raport łączy analizę bilansu, RZiS oraz wskaźniki łączone. Zakładki
              pozwalają przechodzić między strukturą finansowania, wynikami oraz
              efektywnością wykorzystania aktywów i kapitału.
            </p>
          </div>

          <div className="w-full xl:max-w-xs">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Wybrany okres
            </label>
            <select
              className="dg-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {getPeriodLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <TabSwitch activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "balance" && (
        <>
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <HealthScoreCard
              score={healthScore}
              breakdown={healthDetails.breakdown}
            />

            <div className="space-y-6">
              <SectionCard
                title="Podsumowanie"
                subtitle="Najważniejsze wnioski dla wybranego okresu."
              >
                <div className="grid gap-3 xl:grid-cols-3">
                  {balanceInsights.map((insight, index) => (
                    <ExecutiveInsightCard
                      key={`${insight.title}-${index}`}
                      title={insight.title}
                      tone={insight.tone}
                    />
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  <SummaryMetricCard
                    title="Aktywa razem"
                    value={formatCurrency(current.aktywaRazem)}
                    helper={cmp.aktywaRazem.text}
                  />
                  <SummaryMetricCard
                    title="Kapitał własny"
                    value={formatCurrency(current.kapitalWlasny)}
                    helper={cmp.kapitalWlasny.text}
                  />
                  <SummaryMetricCard
                    title="Zadłużenie"
                    value={formatPercent(current.debtRatio)}
                    tone={getMetricTone("debtRatio", current.debtRatio)}
                    helper={benchDebt.line2 ?? cmp.debtRatio.text}
                  />
                  <SummaryMetricCard
                    title="Wypłacalność"
                    value={formatNumber(current.solvencyRatio)}
                    tone={getMetricTone("solvencyRatio", current.solvencyRatio)}
                    helper={benchSolv.line2 ?? cmp.solvencyRatio.text}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Kluczowe wskaźniki bilansowe"
                subtitle="Szczegółowy podgląd wartości dla wybranego okresu wraz ze zmianą względem poprzedniego."
              >
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  <MetricCard
                    title="Aktywa razem"
                    value={formatCurrency(current.aktywaRazem)}
                    change={cmp.aktywaRazem.text}
                    changeColor={cmp.aktywaRazem.color}
                    trend={buildTrend(metrics, "aktywaRazem", PERIODS)}
                  />

                  <MetricCard
                    title="Kapitał własny"
                    value={formatCurrency(current.kapitalWlasny)}
                    change={cmp.kapitalWlasny.text}
                    changeColor={cmp.kapitalWlasny.color}
                    trend={buildTrend(metrics, "kapitalWlasny", PERIODS)}
                  />

                  <MetricCard
                    title="Zobowiązania"
                    value={formatCurrency(current.zobowiazania)}
                    change={cmp.zobowiazania.text}
                    changeColor={cmp.zobowiazania.color}
                    trend={buildTrend(metrics, "zobowiazania", PERIODS)}
                  />

                  <MetricCard
                    title="Wskaźnik zadłużenia"
                    value={formatPercent(current.debtRatio)}
                    tone={getMetricTone("debtRatio", current.debtRatio)}
                    change={cmp.debtRatio.text}
                    changeColor={cmp.debtRatio.color}
                    trend={buildTrend(metrics, "debtRatio", PERIODS)}
                    benchmarkLine1={benchDebt.line1}
                    benchmarkLine2={benchDebt.line2}
                    benchmarkTone={benchDebt.tone}
                  />

                  <MetricCard
                    title="Wskaźnik kapitału własnego"
                    value={formatPercent(current.equityRatio)}
                    tone={getMetricTone("equityRatio", current.equityRatio)}
                    change={cmp.equityRatio.text}
                    changeColor={cmp.equityRatio.color}
                    trend={buildTrend(metrics, "equityRatio", PERIODS)}
                    benchmarkLine1={benchEquity.line1}
                    benchmarkLine2={benchEquity.line2}
                    benchmarkTone={benchEquity.tone}
                  />

                  <MetricCard
                    title="Dźwignia finansowa"
                    value={formatNumber(current.leverage)}
                    tone={getMetricTone("leverage", current.leverage)}
                    change={cmp.leverage.text}
                    changeColor={cmp.leverage.color}
                    trend={buildTrend(metrics, "leverage", PERIODS)}
                    benchmarkLine1={benchLev.line1}
                    benchmarkLine2={benchLev.line2}
                    benchmarkTone={benchLev.tone}
                  />

                  <MetricCard
                    title="Dług / Kapitał własny"
                    value={formatNumber(current.debtToEquity)}
                    tone={getMetricTone("debtToEquity", current.debtToEquity)}
                    change={cmp.debtToEquity.text}
                    changeColor={cmp.debtToEquity.color}
                    trend={buildTrend(metrics, "debtToEquity", PERIODS)}
                    benchmarkLine1={benchD2E.line1}
                    benchmarkLine2={benchD2E.line2}
                    benchmarkTone={benchD2E.tone}
                  />

                  <MetricCard
                    title="Wypłacalność"
                    value={formatNumber(current.solvencyRatio)}
                    tone={getMetricTone("solvencyRatio", current.solvencyRatio)}
                    change={cmp.solvencyRatio.text}
                    changeColor={cmp.solvencyRatio.color}
                    trend={buildTrend(metrics, "solvencyRatio", PERIODS)}
                    benchmarkLine1={benchSolv.line1}
                    benchmarkLine2={benchSolv.line2}
                    benchmarkTone={benchSolv.tone}
                  />
                </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title="Trend wskaźników w czasie"
            subtitle="Szybki podgląd zmian między okresami dla części bilansowej."
          >
            <div className="mb-5 flex flex-wrap gap-2">
              {TREND_METRIC_OPTIONS.map((item) => {
                const active = item.key === selectedTrendMetric;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedTrendMetric(item.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-sky-500 bg-gradient-to-br from-[var(--dg-teal)] to-[var(--dg-blue)] text-white"
                        : "border-[var(--dg-gray-200)] bg-white text-[var(--dg-gray-600)] hover:border-sky-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <TrendLineChart
              values={trendValues}
              periods={PERIODS}
              formatter={(value) => formatValueByType(value, trendMeta.type)}
            />
          </SectionCard>

          <SectionCard
            title="Porównanie z benchmarkiem"
            subtitle={benchMeta.subtitle}
            right={
              <StatusBadge
                label={benchMeta.title}
                tone={currentBenchmark?.unavailable ? "bad" : "neutral"}
              />
            }
          >
            <div className="grid gap-4 2xl:grid-cols-2">
              <BenchmarkRangeBar
                title="Wskaźnik zadłużenia"
                value={current.debtRatio}
                formatter={formatPercent}
                stat={getBenchmarkStat(currentBenchmark, "debtRatio")}
                tone={benchDebt.tone}
              />

              <BenchmarkRangeBar
                title="Wskaźnik kapitału własnego"
                value={current.equityRatio}
                formatter={formatPercent}
                stat={getBenchmarkStat(currentBenchmark, "equityRatio")}
                tone={benchEquity.tone}
              />

              <BenchmarkRangeBar
                title="Dźwignia finansowa"
                value={current.leverage}
                formatter={formatNumber}
                stat={getBenchmarkStat(currentBenchmark, "leverage")}
                tone={benchLev.tone}
              />

              <BenchmarkRangeBar
                title="Dług / Kapitał własny"
                value={current.debtToEquity}
                formatter={formatNumber}
                stat={getBenchmarkStat(currentBenchmark, "debtToEquity")}
                tone={benchD2E.tone}
              />

              <BenchmarkRangeBar
                title="Wypłacalność"
                value={current.solvencyRatio}
                formatter={formatNumber}
                stat={getBenchmarkStat(currentBenchmark, "solvencyRatio")}
                tone={benchSolv.tone}
              />
            </div>
          </SectionCard>
        </>
      )}

      {activeTab === "income" && (
        <>
          {!hasIncomeMetrics ? (
            <EmptyStateCard
              title="Brak danych RZiS"
              description="Ten raport nie zawiera jeszcze danych rachunku zysków i strat. Dodaj plik RZiS w imporcie, aby zobaczyć przychody, rentowność i trendy wynikowe."
            />
          ) : (
            <>
              <SectionCard
                title="Podsumowanie RZiS"
                subtitle="Najważniejsze wnioski z rachunku zysków i strat dla wybranego okresu."
              >
                <div className="grid gap-3 md:grid-cols-3">
                  {incomeInsights.map((insight, index) => (
                    <ExecutiveInsightCard
                      key={`${insight.title}-${index}`}
                      title={insight.title}
                      tone={insight.tone}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Trend wyników w czasie"
                subtitle="Zmiany przychodów, wyniku oraz rentowności między okresami."
              >
                <div className="mb-5 flex flex-wrap gap-2">
                  {INCOME_TREND_OPTIONS.map((item) => {
                    const active = item.key === selectedIncomeTrendMetric;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedIncomeTrendMetric(item.key)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "border-sky-500 bg-gradient-to-br from-[var(--dg-teal)] to-[var(--dg-blue)] text-white"
                            : "border-[var(--dg-gray-200)] bg-white text-[var(--dg-gray-600)] hover:border-sky-300"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <TrendLineChart
                  values={incomeTrendValues}
                  periods={PERIODS}
                  formatter={(value) =>
                    formatValueByType(value, incomeTrendMeta.type)
                  }
                />
              </SectionCard>

              <SectionCard
                title="Kluczowe wskaźniki RZiS"
                subtitle="Wyniki finansowe i rentowność dla wybranego okresu."
              >
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  <MetricCard
                    title="Przychody"
                    value={formatCurrency(currentIncome?.revenue)}
                    change={incomeCmp.revenue.text}
                    changeColor={incomeCmp.revenue.color}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "revenue",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Koszty operacyjne"
                    value={formatCurrency(currentIncome?.operatingCosts)}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "operatingCosts",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Wynik operacyjny"
                    value={formatCurrency(currentIncome?.operatingProfit)}
                    tone={
                      (currentIncome?.operatingProfit ?? 0) >= 0
                        ? "green"
                        : "red"
                    }
                    change={incomeCmp.operatingProfit.text}
                    changeColor={incomeCmp.operatingProfit.color}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "operatingProfit",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Wynik brutto"
                    value={formatCurrency(currentIncome?.grossProfit)}
                    tone={
                      (currentIncome?.grossProfit ?? 0) >= 0
                        ? "green"
                        : "red"
                    }
                    change={incomeCmp.grossProfit.text}
                    changeColor={incomeCmp.grossProfit.color}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "grossProfit",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Wynik netto"
                    value={formatCurrency(currentIncome?.netProfit)}
                    tone={
                      (currentIncome?.netProfit ?? 0) >= 0 ? "green" : "red"
                    }
                    change={incomeCmp.netProfit.text}
                    changeColor={incomeCmp.netProfit.color}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "netProfit",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Marża operacyjna"
                    value={formatPercent(currentIncome?.operatingMargin)}
                    tone={
                      (currentIncome?.operatingMargin ?? 0) >= 0.1
                        ? "green"
                        : (currentIncome?.operatingMargin ?? 0) >= 0.03
                        ? "yellow"
                        : "red"
                    }
                    change={incomeCmp.operatingMargin.text}
                    changeColor={incomeCmp.operatingMargin.color}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "operatingMargin",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Marża netto"
                    value={formatPercent(currentIncome?.netMargin)}
                    tone={
                      (currentIncome?.netMargin ?? 0) >= 0.08
                        ? "green"
                        : (currentIncome?.netMargin ?? 0) >= 0.03
                        ? "yellow"
                        : "red"
                    }
                    change={incomeCmp.netMargin.text}
                    changeColor={incomeCmp.netMargin.color}
                    trend={buildIncomeTrend(
                      incomeMetrics!,
                      "netMargin",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="ROS"
                    value={formatPercent(currentIncome?.ros)}
                    tone={
                      (currentIncome?.ros ?? 0) >= 0.08
                        ? "green"
                        : (currentIncome?.ros ?? 0) >= 0.03
                        ? "yellow"
                        : "red"
                    }
                    change={incomeCmp.ros.text}
                    changeColor={incomeCmp.ros.color}
                    trend={buildIncomeTrend(incomeMetrics!, "ros", PERIODS)}
                  />
                </div>
              </SectionCard>
            </>
          )}
        </>
      )}

      {activeTab === "combined" && (
        <>
          {!hasCombinedMetrics ? (
            <EmptyStateCard
              title="Brak analizy łącznej"
              description="Aby policzyć ROA, ROE i rotacje, raport musi zawierać jednocześnie dane bilansowe oraz dane RZiS."
            />
          ) : (
            <>
              <SectionCard
                title="Trend wskaźników łączonych"
                subtitle="Efektywność wykorzystania aktywów, kapitału oraz cykl kapitału obrotowego."
              >
                <div className="mb-5 flex flex-wrap gap-2">
                  {COMBINED_TREND_OPTIONS.map((item) => {
                    const active = item.key === selectedCombinedTrendMetric;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedCombinedTrendMetric(item.key)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "border-sky-500 bg-gradient-to-br from-[var(--dg-teal)] to-[var(--dg-blue)] text-white"
                            : "border-[var(--dg-gray-200)] bg-white text-[var(--dg-gray-600)] hover:border-sky-300"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <TrendLineChart
                  values={combinedTrendValues}
                  periods={PERIODS}
                  formatter={(value) =>
                    selectedCombinedTrendMetric ===
                      "receivablesTurnoverDays" ||
                    selectedCombinedTrendMetric === "inventoryTurnoverDays"
                      ? formatDays(value)
                      : formatValueByType(value, combinedTrendMeta.type)
                  }
                />
              </SectionCard>

              <SectionCard
                title="Kluczowe wskaźniki łączone"
                subtitle="Wskaźniki liczone z połączenia bilansu i rachunku wyników."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="ROA"
                    value={formatPercent(currentCombined?.roa)}
                    tone={
                      (currentCombined?.roa ?? 0) >= 0.08
                        ? "green"
                        : (currentCombined?.roa ?? 0) >= 0.03
                        ? "yellow"
                        : "red"
                    }
                    change={combinedCmp.roa.text}
                    changeColor={combinedCmp.roa.color}
                    trend={buildCombinedTrend(combinedMetrics!, "roa", PERIODS)}
                  />

                  <MetricCard
                    title="ROE"
                    value={formatPercent(currentCombined?.roe)}
                    tone={
                      (currentCombined?.roe ?? 0) >= 0.15
                        ? "green"
                        : (currentCombined?.roe ?? 0) >= 0.07
                        ? "yellow"
                        : "red"
                    }
                    change={combinedCmp.roe.text}
                    changeColor={combinedCmp.roe.color}
                    trend={buildCombinedTrend(combinedMetrics!, "roe", PERIODS)}
                  />

                  <MetricCard
                    title="Rotacja należności"
                    value={formatDays(currentCombined?.receivablesTurnoverDays)}
                    change={combinedCmp.receivablesTurnoverDays.text}
                    changeColor={combinedCmp.receivablesTurnoverDays.color}
                    trend={buildCombinedTrend(
                      combinedMetrics!,
                      "receivablesTurnoverDays",
                      PERIODS
                    )}
                  />

                  <MetricCard
                    title="Rotacja zapasów"
                    value={formatDays(currentCombined?.inventoryTurnoverDays)}
                    change={combinedCmp.inventoryTurnoverDays.text}
                    changeColor={combinedCmp.inventoryTurnoverDays.color}
                    trend={buildCombinedTrend(
                      combinedMetrics!,
                      "inventoryTurnoverDays",
                      PERIODS
                    )}
                  />
                </div>
              </SectionCard>
            </>
          )}
        </>
      )}
    </div>
  );
}
