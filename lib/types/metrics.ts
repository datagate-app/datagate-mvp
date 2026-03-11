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

/* ================= BILANS ================= */

export type SinglePeriodMetrics = {
  aktywaRazem?: number;
  kapitalWlasny?: number;
  zobowiazania?: number;

  debtRatio?: number;
  equityRatio?: number;
  leverage?: number;
  debtToEquity?: number;
  solvencyRatio?: number;

  /* pola źródłowe pod analizę łączoną */
  naleznosciKrotkoterminowe?: number;
  zapasy?: number;
};

export type Metrics = Record<PeriodKey, SinglePeriodMetrics>;

/* ================= RZiS – dane źródłowe ================= */

export type SinglePeriodIncomeStatementData = {
  przychodyNettoZeSprzedazy?: number;
  zmianaStanuProduktow?: number;
  kosztWytworzeniaProduktowNaWlasnePotrzeby?: number;
  przychodyNettoZeSprzedazyTowarowIMaterialow?: number;

  amortyzacja?: number;
  zuzycieMaterialowIEnergii?: number;
  uslugiObce?: number;
  podatkiIOplaty?: number;
  wynagrodzenia?: number;
  ubezpieczeniaSpoleczneIInneSwiadczenia?: number;
  pozostaleKosztyRodzajowe?: number;
  wartoscSprzedanychTowarowIMaterialow?: number;

  kosztyDzialalnosciOperacyjnej?: number;
  zyskStrataZeSprzedazy?: number;

  pozostalePrzychodyOperacyjne?: number;
  pozostaleKosztyOperacyjne?: number;
  zyskStrataZDzialalnosciOperacyjnej?: number;

  przychodyFinansowe?: number;
  odsetki?: number;
  pozostalePrzychodyFinansowe?: number;

  kosztyFinansowe?: number;
  pozostaleKosztyFinansowe?: number;

  zyskStrataBrutto?: number;
  podatekDochodowy?: number;
  zyskStrataNetto?: number;
};

export type IncomeStatementData = Record<
  PeriodKey,
  SinglePeriodIncomeStatementData
>;

/* ================= RZiS – metryki ================= */

export type SinglePeriodIncomeMetrics = {
  revenue?: number;
  operatingCosts?: number;
  operatingProfit?: number;
  grossProfit?: number;
  netProfit?: number;

  operatingMargin?: number;
  netMargin?: number;
  ros?: number;

  revenueGrowth?: number;
  netProfitGrowth?: number;
};

export type IncomeMetrics = Record<PeriodKey, SinglePeriodIncomeMetrics>;

/* ================= ANALIZA ŁĄCZONA ================= */

export type SinglePeriodCombinedMetrics = {
  roa?: number;
  roe?: number;
  receivablesTurnoverDays?: number;
  inventoryTurnoverDays?: number;
};

export type CombinedMetrics = Record<PeriodKey, SinglePeriodCombinedMetrics>;

/* ================= JEDEN RAPORT – PEŁNY ZESTAW ================= */

export type FinancialMetrics = {
  balance: Metrics;
  income?: IncomeMetrics;
  combined?: CombinedMetrics;
};