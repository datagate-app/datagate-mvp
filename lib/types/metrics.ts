export type SinglePeriodMetrics = {
  aktywaRazem?: number;
  kapitalWlasny?: number;
  zobowiazania?: number;
  debtRatio?: number;
  equityRatio?: number;
  leverage?: number;
  debtToEquity?: number;
  solvencyRatio?: number;
};

export type PeriodKey =
  | "tMinus2"
  | "tMinus1"
  | "t0"
  | "t1"
  | "t2"
  | "t3"
  | "t4"
  | "t5"
  | "t6";

export type Metrics = Record<PeriodKey, SinglePeriodMetrics>;