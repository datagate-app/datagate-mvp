import { BilansValues, PeriodValues } from "./parseBilansCsv";

export type SingleMetrics = {
  aktywaRazem: number;
  kapitalWlasny: number;
  zobowiazania: number;
  debtRatio: number;
  equityRatio: number;
  leverage: number;
  debtToEquity: number;
  solvencyRatio: number;
};

export type BilansMetrics = {
  tMinus2: SingleMetrics;
  tMinus1: SingleMetrics;
  t0: SingleMetrics;
  t1: SingleMetrics;
  t2: SingleMetrics;
  t3: SingleMetrics;
  t4: SingleMetrics;
  t5: SingleMetrics;
  t6: SingleMetrics;
};

function calculateSingle(
  aktywaRazem: number,
  kapitalWlasny: number,
  zobowiazania: number
): SingleMetrics {
  const debtRatio =
    aktywaRazem > 0 ? zobowiazania / aktywaRazem : 0;

  const equityRatio =
    aktywaRazem > 0 ? kapitalWlasny / aktywaRazem : 0;

  const leverage =
    kapitalWlasny > 0 ? aktywaRazem / kapitalWlasny : 0;

  const debtToEquity =
    kapitalWlasny > 0 ? zobowiazania / kapitalWlasny : 0;

  const solvencyRatio =
    zobowiazania > 0 ? aktywaRazem / zobowiazania : 0;

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
    data.aktywaRazem[key],
    data.kapitalWlasny[key],
    data.zobowiazania[key]
  );
}

export function calculateMetrics(
  data: BilansValues
): BilansMetrics {
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
