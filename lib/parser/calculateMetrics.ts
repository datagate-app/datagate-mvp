import type {
  CombinedMetrics,
  IncomeMetrics,
  PeriodKey,
  SinglePeriodCombinedMetrics,
  SinglePeriodIncomeMetrics,
  SinglePeriodMetrics,
} from "@/lib/types/metrics";
import { BilansValues, PeriodValues } from "./parseBilansCsv";

export type SingleMetrics = SinglePeriodMetrics;
export type BilansMetrics = Record<PeriodKey, SingleMetrics>;

export type SingleIncomeInput = {
  przychodyNettoZeSprzedazy?: number;
  kosztyDzialalnosciOperacyjnej?: number;
  zyskStrataZDzialalnosciOperacyjnej?: number;
  zyskStrataBrutto?: number;
  zyskStrataNetto?: number;
};

export type IncomeStatementInput = Record<PeriodKey, SingleIncomeInput>;

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

/* ================= COMMON HELPERS ================= */

function safeNumber(value?: number) {
  return Number.isFinite(value) ? (value as number) : 0;
}

function divideOrZero(numerator?: number, denominator?: number) {
  const n = safeNumber(numerator);
  const d = safeNumber(denominator);

  if (d === 0) return 0;
  return n / d;
}

function growthOrZero(current?: number, previous?: number) {
  const curr = safeNumber(current);
  const prev = safeNumber(previous);

  if (prev === 0) return 0;
  return (curr - prev) / prev;
}

/* ================= BILANS ================= */

function calculateSingle(
  aktywaRazem: number,
  kapitalWlasny: number,
  zobowiazania: number
): SingleMetrics {
  const debtRatio = divideOrZero(zobowiazania, aktywaRazem);
  const equityRatio = divideOrZero(kapitalWlasny, aktywaRazem);
  const leverage = divideOrZero(aktywaRazem, kapitalWlasny);
  const debtToEquity = divideOrZero(zobowiazania, kapitalWlasny);
  const solvencyRatio = divideOrZero(aktywaRazem, zobowiazania);

  return {
    aktywaRazem,
    kapitalWlasny,
    zobowiazania,
    debtRatio,
    equityRatio,
    leverage,
    debtToEquity,
    solvencyRatio,
  };
}

function fromPeriod(
  data: BilansValues,
  key: keyof PeriodValues
): SingleMetrics {
  return calculateSingle(
    safeNumber(data.aktywaRazem[key]),
    safeNumber(data.kapitalWlasny[key]),
    safeNumber(data.zobowiazania[key])
  );
}

export function calculateMetrics(data: BilansValues): BilansMetrics {
  return {
    tMinus2: fromPeriod(data, "tMinus2"),
    tMinus1: fromPeriod(data, "tMinus1"),
    t0: fromPeriod(data, "t0"),
    t1: fromPeriod(data, "t1"),
    t2: fromPeriod(data, "t2"),
    t3: fromPeriod(data, "t3"),
    t4: fromPeriod(data, "t4"),
    t5: fromPeriod(data, "t5"),
    t6: fromPeriod(data, "t6"),
  };
}

/* ================= RZiS ================= */

function calculateIncomeMetricsSingle(
  current: SingleIncomeInput,
  previous?: SingleIncomeInput
): SinglePeriodIncomeMetrics {
  const revenue = safeNumber(current.przychodyNettoZeSprzedazy);
  const operatingCosts = safeNumber(current.kosztyDzialalnosciOperacyjnej);
  const operatingProfit = safeNumber(current.zyskStrataZDzialalnosciOperacyjnej);
  const grossProfit = safeNumber(current.zyskStrataBrutto);
  const netProfit = safeNumber(current.zyskStrataNetto);

  return {
    revenue,
    operatingCosts,
    operatingProfit,
    grossProfit,
    netProfit,
    operatingMargin: divideOrZero(operatingProfit, revenue),
    netMargin: divideOrZero(netProfit, revenue),
    ros: divideOrZero(netProfit, revenue),
    revenueGrowth: growthOrZero(
      revenue,
      previous?.przychodyNettoZeSprzedazy
    ),
    netProfitGrowth: growthOrZero(
      netProfit,
      previous?.zyskStrataNetto
    ),
  };
}

export function calculateIncomeMetrics(
  data: IncomeStatementInput
): IncomeMetrics {
  const result = {} as IncomeMetrics;

  PERIOD_KEYS.forEach((period, index) => {
    const previousPeriod = index > 0 ? PERIOD_KEYS[index - 1] : undefined;

    result[period] = calculateIncomeMetricsSingle(
      data[period] ?? {},
      previousPeriod ? data[previousPeriod] : undefined
    );
  });

  return result;
}

/* ================= ANALIZA ŁĄCZONA ================= */

type CombinedInputOptions = {
  bilans: BilansMetrics;
  income: IncomeMetrics;
};

function calculateCombinedSingle(
  balance: SinglePeriodMetrics,
  income: SinglePeriodIncomeMetrics
): SinglePeriodCombinedMetrics {
  const receivables = safeNumber(balance.naleznosciKrotkoterminowe);
  const inventory = safeNumber(balance.zapasy);
  const assets = safeNumber(balance.aktywaRazem);
  const equity = safeNumber(balance.kapitalWlasny);
  const revenue = safeNumber(income.revenue);

  return {
    roa: divideOrZero(income.netProfit, assets),
    roe: divideOrZero(income.netProfit, equity),
    receivablesTurnoverDays:
      revenue > 0 ? (receivables / revenue) * 365 : 0,
    inventoryTurnoverDays:
      revenue > 0 ? (inventory / revenue) * 365 : 0,
  };
}

export function calculateCombinedMetrics({
  bilans,
  income,
}: CombinedInputOptions): CombinedMetrics {
  const result = {} as CombinedMetrics;

  PERIOD_KEYS.forEach((period) => {
    result[period] = calculateCombinedSingle(
      bilans[period] ?? {},
      income[period] ?? {}
    );
  });

  return result;
}