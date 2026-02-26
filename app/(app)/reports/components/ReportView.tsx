"use client";

import { useMemo, useState } from "react";
import type { Metrics, SinglePeriodMetrics, PeriodKey } from "@/lib/types/metrics";
import { INDUSTRIES } from "@/lib/config/industries";

/* ================= BENCHMARK TYPES ================= */

type BenchmarkResponse = {
  industry: string;
  period: string; // np. "t0"
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

/* ================= MINI TREND ================= */

function MiniTrend({ values }: { values: number[] }) {
  const safe = values.map((v) => (Number.isFinite(v) ? v : 0));
  const max = Math.max(...safe, 1);

  return (
    <div className="mt-2 flex h-8 items-end gap-1">
      {safe.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded bg-gray-300"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

/* ================= METRIC CARD ================= */

type ChangeColor = "green" | "red" | "gray";
type BenchTone = "good" | "mid" | "bad" | "none";

type MetricCardProps = {
  title: string;
  value: string;
  color?: "green" | "yellow" | "red";
  change?: string;
  changeColor?: ChangeColor;
  trend?: number[];

  // benchmark (opcjonalnie)
  benchmarkLine1?: string;
  benchmarkLine2?: string;
  benchmarkTone?: BenchTone;
};

function MetricCard({
  title,
  value,
  color,
  change,
  changeColor,
  trend,
  benchmarkLine1,
  benchmarkLine2,
  benchmarkTone = "none",
}: MetricCardProps) {
  const valueColorClass =
    color === "green"
      ? "text-green-600"
      : color === "yellow"
      ? "text-yellow-600"
      : color === "red"
      ? "text-red-600"
      : "text-gray-900";

  const changeColorClass =
    changeColor === "green"
      ? "text-green-600"
      : changeColor === "red"
      ? "text-red-600"
      : "text-gray-500";

  const benchToneClass =
    benchmarkTone === "good"
      ? "text-green-700 bg-green-50 border-green-200"
      : benchmarkTone === "bad"
      ? "text-red-700 bg-red-50 border-red-200"
      : benchmarkTone === "mid"
      ? "text-gray-700 bg-gray-50 border-gray-200"
      : "text-gray-500 bg-gray-50 border-gray-200";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColorClass}`}>{value}</p>

      {change && <p className={`mt-1 text-sm ${changeColorClass}`}>{change}</p>}

      {(benchmarkLine1 || benchmarkLine2) && (
        <div className="mt-3 rounded-xl bg-gray-50 p-3">
          {benchmarkLine1 && <p className="text-xs text-gray-600">{benchmarkLine1}</p>}

          {benchmarkLine2 && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium ${benchToneClass}`}
              >
                {benchmarkLine2}
              </span>
            </div>
          )}
        </div>
      )}

      {trend && trend.length > 1 && <MiniTrend values={trend} />}
    </div>
  );
}

/* ================= HELPERS ================= */

function formatCurrency(value?: number) {
  return `${((value ?? 0) * 1000).toLocaleString("pl-PL")} zł`;
}

function formatPercent(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}

function formatNumber(value?: number) {
  return (value ?? 0).toFixed(2);
}

function buildTrend(metrics: Metrics, key: keyof SinglePeriodMetrics, periods: readonly PeriodKey[]) {
  return periods.map((p) => metrics[p]?.[key] ?? 0);
}

function comparePeriods(current?: number, prev?: number): { text: string; color: ChangeColor } {
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
    text: `${sign} ${(diff * 100).toFixed(1)}%`,
    color,
  };
}

function calculateHealthScore(m: SinglePeriodMetrics) {
  const debt = m.debtRatio ?? 0;
  const equity = m.equityRatio ?? 0;
  const leverage = m.leverage ?? 0;

  const debtScore = Math.max(0, 100 - debt * 100);
  const equityScore = Math.max(0, Math.min(100, equity * 100));
  const leverageScore = Math.max(0, 100 - (leverage - 1) * 40);

  return Math.round((debtScore + equityScore + leverageScore) / 3);
}

function getHealthLabel(score: number) {
  if (score >= 80) return "Bardzo dobra kondycja";
  if (score >= 60) return "Stabilna kondycja";
  if (score >= 40) return "Uwaga – średnia kondycja";
  return "Podwyższone ryzyko";
}

function getDebtColor(value?: number): "green" | "yellow" | "red" {
  const v = value ?? 0;
  if (v < 0.5) return "green";
  if (v < 0.7) return "yellow";
  return "red";
}

function getEquityColor(value?: number): "green" | "yellow" | "red" {
  const v = value ?? 0;
  if (v > 0.5) return "green";
  if (v > 0.3) return "yellow";
  return "red";
}

function getLeverageColor(value?: number): "green" | "yellow" | "red" {
  const v = value ?? 0;
  if (v <= 2) return "green";
  if (v <= 3) return "yellow";
  return "red";
}

/* ===== benchmark helpers ===== */

type BenchKey = "debtRatio" | "equityRatio" | "leverage" | "debtToEquity" | "solvencyRatio";

const BENCH_DIRECTION: Record<BenchKey, "higherIsBetter" | "lowerIsBetter"> = {
  debtRatio: "lowerIsBetter",
  equityRatio: "higherIsBetter",
  leverage: "lowerIsBetter",
  debtToEquity: "lowerIsBetter",
  solvencyRatio: "higherIsBetter",
};

function getBenchmarkStat(benchmark: BenchmarkResponse | null | undefined, key: string) {
  const s = benchmark?.stats?.[key];
  if (!s) return null;
  return s;
}

function inRangeLabel(value?: number, p25?: number | null, p75?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (p25 == null || p75 == null) return null;

  if (value < p25) return "poniżej typowego zakresu";
  if (value > p75) return "powyżej typowego zakresu";
  return "w typowym zakresie";
}

function benchToneFor(key: BenchKey, value?: number, p25?: number | null, p75?: number | null): BenchTone {
  if (typeof value !== "number" || !Number.isFinite(value)) return "none";
  if (p25 == null || p75 == null) return "none";

  // w typowym zakresie
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

function industryLabel(industry?: string) {
  if (!industry) return "—";
  return (INDUSTRIES as Record<string, string>)[industry] ?? industry;
}

/* ================= COMPONENT ================= */

interface ReportViewProps {
  metrics: Metrics;
  reportName?: string;
  industry?: string;

  benchmark?: BenchmarkResponse | null;
  benchmarkLoading?: boolean;
}

export default function ReportView({
  metrics,
  reportName,
  industry,
  benchmark,
  benchmarkLoading,
}: ReportViewProps) {
  const periods: PeriodKey[] = ["tMinus2", "tMinus1", "t0", "t1", "t2", "t3", "t4", "t5", "t6"];

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("t0");

  const currentIndex = periods.indexOf(selectedPeriod);
  const prevKey = currentIndex > 0 ? periods[currentIndex - 1] : undefined;

  const current = metrics[selectedPeriod];
  const prev = prevKey ? metrics[prevKey] : undefined;

  const healthScore = calculateHealthScore(current);

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
  }, [selectedPeriod, metrics]); // eslint-disable-line react-hooks/exhaustive-deps

  const benchMeta = useMemo(() => {
    if (benchmarkLoading) return { title: "Benchmark branży", subtitle: "Ładowanie…" };
    if (!benchmark) return { title: "Benchmark branży", subtitle: "Brak danych benchmarku." };
    if (benchmark.unavailable) return { title: "Benchmark branży", subtitle: benchmark.reason ?? "Niedostępny." };

    return {
      title: `Benchmark branży (${industryLabel(benchmark.industry)})`,
      subtitle: `N: ${benchmark.n} • okres: ${benchmark.period}`,
    };
  }, [benchmark, benchmarkLoading]);

  function benchLinesFor(key: BenchKey, currentValue?: number, formatter: (v?: number) => string = formatNumber) {
    const s = getBenchmarkStat(benchmark, key);
    if (!s || benchmark?.unavailable) {
      return { line1: undefined, line2: undefined, tone: "none" as BenchTone };
    }

    const label = inRangeLabel(currentValue, s.p25, s.p75);
    const tone = benchToneFor(key, currentValue, s.p25, s.p75);

    const line1 = `Branża: mediana ${formatter(s.p50 ?? undefined)} (p25–p75: ${formatter(
      s.p25 ?? undefined
    )} – ${formatter(s.p75 ?? undefined)})`;

    const line2 = label ? `Twoja firma: ${label}` : undefined;

    return { line1, line2, tone };
  }

  const benchDebt = benchLinesFor("debtRatio", current.debtRatio, formatPercent);
  const benchEquity = benchLinesFor("equityRatio", current.equityRatio, formatPercent);
  const benchLev = benchLinesFor("leverage", current.leverage, formatNumber);
  const benchD2E = benchLinesFor("debtToEquity", current.debtToEquity, formatNumber);
  const benchSolv = benchLinesFor("solvencyRatio", current.solvencyRatio, formatNumber);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{reportName ?? "Raport finansowy"}</h1>
        <p className="mt-1 text-sm text-gray-500">Branża: {industryLabel(industry)}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-500">Okres:</label>
          <select
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-medium">{benchMeta.title}</span>
            <span className="ml-2 text-gray-500">{benchMeta.subtitle}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Health Score</p>
        <p className="mt-2 text-3xl font-bold text-green-600">{healthScore}/100</p>
        <p className="mt-1 text-sm text-gray-600">{getHealthLabel(healthScore)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Aktywa razem"
          value={formatCurrency(current.aktywaRazem)}
          change={cmp.aktywaRazem.text}
          changeColor={cmp.aktywaRazem.color}
          trend={buildTrend(metrics, "aktywaRazem", periods)}
        />

        <MetricCard
          title="Kapitał własny"
          value={formatCurrency(current.kapitalWlasny)}
          change={cmp.kapitalWlasny.text}
          changeColor={cmp.kapitalWlasny.color}
          trend={buildTrend(metrics, "kapitalWlasny", periods)}
        />

        <MetricCard
          title="Zobowiązania"
          value={formatCurrency(current.zobowiazania)}
          change={cmp.zobowiazania.text}
          changeColor={cmp.zobowiazania.color}
          trend={buildTrend(metrics, "zobowiazania", periods)}
        />

        <MetricCard
          title="Wskaźnik zadłużenia"
          value={formatPercent(current.debtRatio)}
          color={getDebtColor(current.debtRatio)}
          change={cmp.debtRatio.text}
          changeColor={cmp.debtRatio.color}
          trend={buildTrend(metrics, "debtRatio", periods)}
          benchmarkLine1={benchDebt.line1}
          benchmarkLine2={benchDebt.line2}
          benchmarkTone={benchDebt.tone}
        />

        <MetricCard
          title="Wskaźnik kapitału własnego"
          value={formatPercent(current.equityRatio)}
          color={getEquityColor(current.equityRatio)}
          change={cmp.equityRatio.text}
          changeColor={cmp.equityRatio.color}
          trend={buildTrend(metrics, "equityRatio", periods)}
          benchmarkLine1={benchEquity.line1}
          benchmarkLine2={benchEquity.line2}
          benchmarkTone={benchEquity.tone}
        />

        <MetricCard
          title="Dźwignia finansowa"
          value={formatNumber(current.leverage)}
          color={getLeverageColor(current.leverage)}
          change={cmp.leverage.text}
          changeColor={cmp.leverage.color}
          trend={buildTrend(metrics, "leverage", periods)}
          benchmarkLine1={benchLev.line1}
          benchmarkLine2={benchLev.line2}
          benchmarkTone={benchLev.tone}
        />

        <MetricCard
          title="Dług / Kapitał własny"
          value={formatNumber(current.debtToEquity)}
          change={cmp.debtToEquity.text}
          changeColor={cmp.debtToEquity.color}
          trend={buildTrend(metrics, "debtToEquity", periods)}
          benchmarkLine1={benchD2E.line1}
          benchmarkLine2={benchD2E.line2}
          benchmarkTone={benchD2E.tone}
        />

        <MetricCard
          title="Wypłacalność"
          value={formatNumber(current.solvencyRatio)}
          change={cmp.solvencyRatio.text}
          changeColor={cmp.solvencyRatio.color}
          trend={buildTrend(metrics, "solvencyRatio", periods)}
          benchmarkLine1={benchSolv.line1}
          benchmarkLine2={benchSolv.line2}
          benchmarkTone={benchSolv.tone}
        />
      </div>
    </div>
  );
}