import type { PeriodKey } from "@/lib/types/metrics";

export type MetricKey =
  | "debtRatio"
  | "equityRatio"
  | "leverage"
  | "debtToEquity"
  | "solvencyRatio";

export type Percentiles = {
  n: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
};

export type BenchmarkResponse = {
  industry: string;
  period: PeriodKey;
  n: number;
  stats: Record<MetricKey, Percentiles>;
  unavailable?: boolean;
  reason?: string;
};