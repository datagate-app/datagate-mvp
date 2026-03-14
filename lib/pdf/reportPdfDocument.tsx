import React from "react";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  CombinedMetrics,
  IncomeMetrics,
  Metrics,
  PeriodKey,
} from "@/lib/types/metrics";

export type BenchmarkResponse = {
  industry: string;
  period: string;
  n: number;
  stats: Record<
    string,
    { n: number; p25: number | null; p50: number | null; p75: number | null }
  >;
  unavailable?: boolean;
  reason?: string;
};

export type ReportPdfDocumentProps = {
  reportName?: string;
  industry?: string;
  logoUrl?: string;
  metrics: Metrics;
  incomeMetrics?: IncomeMetrics;
  combinedMetrics?: CombinedMetrics;
  benchmark?: BenchmarkResponse | null;
};

Font.registerHyphenationCallback((word: string) => [word]);

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
  tMinus2: "T-2",
  tMinus1: "T-1",
  t0: "T0",
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
  t5: "T5",
  t6: "T6",
};

const EPSILON = 0.000001;
const MAX_PERIODS = 3;

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingRight: 28,
    paddingBottom: 42,
    paddingLeft: 28,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },

  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dbe3ee",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 34,
    objectFit: "contain",
  },
  fallbackBrand: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  pill: {
    fontSize: 8,
    color: "#1e3a8a",
    backgroundColor: "#dbeafe",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 999,
  },
  title: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  meta: {
    marginTop: 4,
    fontSize: 9,
    color: "#475569",
  },

  hero: {
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 14,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  heroText: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#334155",
  },

  topGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  topCard: {
    width: "31.5%",
    marginRight: "2.75%",
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  topCardThird: {
    marginRight: 0,
  },
  topCardLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  topCardValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  topCardSub: {
    fontSize: 8,
    color: "#475569",
  },

  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: "#64748b",
  },

  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  metricCard: {
    width: "31.5%",
    marginRight: "2.75%",
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  metricCardThird: {
    marginRight: 0,
  },
  metricCardLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  metricCardValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },

  tableWrap: {
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeader: {
    backgroundColor: "#eff6ff",
  },
  tableAlt: {
    backgroundColor: "#f8fafc",
  },
  cellLabel: {
    flex: 1.9,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 8,
    textAlign: "left",
  },
  cellValue: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 6,
    paddingRight: 6,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 8,
    textAlign: "right",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  cellHeader: {
    fontWeight: "bold",
    color: "#0f172a",
  },

  benchmarkBox: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  benchmarkTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  benchmarkText: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.45,
    marginBottom: 8,
  },

  emptyBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  emptyText: {
    fontSize: 9,
    color: "#64748b",
  },

  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 14,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#64748b",
  },
});

type MetricRow = {
  label: string;
  values: string[];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMeaningfulNumber(value: unknown): value is number {
  return isFiniteNumber(value) && Math.abs(value) > EPSILON;
}

function takeLast<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

function formatCurrency(value?: number): string {
  if (!isFiniteNumber(value)) return "-";
  return `${new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(value)} PLN`;
}

function formatNumber(value?: number, digits = 2): string {
  if (!isFiniteNumber(value)) return "-";
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value?: number): string {
  if (!isFiniteNumber(value)) return "-";
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 2,
  }).format(normalized)}%`;
}

function formatDays(value?: number): string {
  if (!isFiniteNumber(value)) return "-";
  return `${new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 1,
  }).format(value)} dni`;
}

function hasRealBalancePeriod(metrics: Metrics | undefined, period: PeriodKey): boolean {
  const item = metrics?.[period];
  return (
    isMeaningfulNumber(item?.aktywaRazem) ||
    isMeaningfulNumber(item?.kapitalWlasny) ||
    isMeaningfulNumber(item?.zobowiazania)
  );
}

function hasRealIncomePeriod(
  metrics: IncomeMetrics | undefined,
  period: PeriodKey
): boolean {
  const item = metrics?.[period];
  return (
    isMeaningfulNumber(item?.revenue) ||
    isMeaningfulNumber(item?.operatingProfit) ||
    isMeaningfulNumber(item?.grossProfit) ||
    isMeaningfulNumber(item?.netProfit)
  );
}

function hasRealCombinedPeriod(
  metrics: CombinedMetrics | undefined,
  period: PeriodKey
): boolean {
  const item = metrics?.[period];
  return (
    isMeaningfulNumber(item?.roa) ||
    isMeaningfulNumber(item?.roe) ||
    isMeaningfulNumber(item?.receivablesTurnoverDays) ||
    isMeaningfulNumber(item?.inventoryTurnoverDays)
  );
}

function getBalancePeriods(metrics: Metrics): PeriodKey[] {
  return takeLast(
    PERIODS.filter((period) => hasRealBalancePeriod(metrics, period)),
    MAX_PERIODS
  );
}

function getIncomePeriods(metrics?: IncomeMetrics): PeriodKey[] {
  return takeLast(
    PERIODS.filter((period) => hasRealIncomePeriod(metrics, period)),
    MAX_PERIODS
  );
}

function getCombinedPeriods(metrics?: CombinedMetrics): PeriodKey[] {
  return takeLast(
    PERIODS.filter((period) => hasRealCombinedPeriod(metrics, period)),
    MAX_PERIODS
  );
}

function getLatestPeriod(periods: PeriodKey[]): PeriodKey | undefined {
  return periods.length ? periods[periods.length - 1] : undefined;
}

function Header({
  reportName,
  industry,
  logoUrl,
}: {
  reportName?: string;
  industry?: string;
  logoUrl?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.brandWrap}>
          {logoUrl ? (
            <Image src={logoUrl} style={styles.logo} />
          ) : (
            <Text style={styles.fallbackBrand}>DataGate</Text>
          )}
        </View>

        <Text style={styles.pill}>PDF Report</Text>
      </View>

      <Text style={styles.title}>{reportName || "Raport finansowy"}</Text>
      <Text style={styles.meta}>
        {industry ? `Branza: ${industry}` : "Branza: -"}
      </Text>
    </View>
  );
}

function Footer() {
  return (
    <View fixed style={styles.footer}>
      <Text style={styles.footerText}>DataGate</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Strona ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

function TopCard({
  label,
  value,
  sub,
  third,
}: {
  label: string;
  value: string;
  sub?: string;
  third?: boolean;
}) {
  return (
    <View style={[styles.topCard, ...(third ? [styles.topCardThird] : [])]}>
      <Text style={styles.topCardLabel}>{label}</Text>
      <Text style={styles.topCardValue}>{value}</Text>
      {sub ? <Text style={styles.topCardSub}>{sub}</Text> : null}
    </View>
  );
}

function MetricCard({
  label,
  value,
  third,
}: {
  label: string;
  value: string;
  third?: boolean;
}) {
  return (
    <View
      style={[styles.metricCard, ...(third ? [styles.metricCardThird] : [])]}
    >
      <Text style={styles.metricCardLabel}>{label}</Text>
      <Text style={styles.metricCardValue}>{value}</Text>
    </View>
  );
}

function MetricsTable({
  periods,
  rows,
  emptyMessage,
}: {
  periods: PeriodKey[];
  rows: MetricRow[];
  emptyMessage: string;
}) {
  if (!periods.length || !rows.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tableWrap} wrap={false}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.cellLabel, styles.cellHeader]}>Wskaznik</Text>

        {periods.map((period, index) => (
          <Text
            key={period}
            style={[
              styles.cellValue,
              styles.cellHeader,
              ...(index === periods.length - 1 ? [styles.cellLast] : []),
            ]}
          >
            {PERIOD_LABELS[period]}
          </Text>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View
          key={row.label}
          style={[
            styles.tableRow,
            ...(rowIndex % 2 === 1 ? [styles.tableAlt] : []),
            ...(rowIndex === rows.length - 1 ? [styles.tableRowLast] : []),
          ]}
        >
          <Text style={styles.cellLabel}>{row.label}</Text>

          {row.values.map((value, index) => (
            <Text
              key={`${row.label}-${index}`}
              style={[
                styles.cellValue,
                ...(index === row.values.length - 1 ? [styles.cellLast] : []),
              ]}
            >
              {value}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function buildBenchmarkRows(benchmark?: BenchmarkResponse | null): MetricRow[] {
  if (!benchmark || benchmark.unavailable) return [];

  const candidates: Array<{ key: string; label: string }> = [
    { key: "debtRatio", label: "Debt ratio" },
    { key: "equityRatio", label: "Equity ratio" },
    { key: "roa", label: "ROA" },
    { key: "roe", label: "ROE" },
    { key: "netMargin", label: "Net margin" },
  ];

  return candidates
    .filter(({ key }) => benchmark.stats[key])
    .map(({ key, label }) => {
      const item = benchmark.stats[key];
      return {
        label,
        values: [
          formatPercent(item?.p25 ?? undefined),
          formatPercent(item?.p50 ?? undefined),
          formatPercent(item?.p75 ?? undefined),
        ],
      };
    });
}

export default function ReportPdfDocument({
  reportName,
  industry,
  logoUrl,
  metrics,
  incomeMetrics,
  combinedMetrics,
  benchmark,
}: ReportPdfDocumentProps) {
  const balancePeriods = getBalancePeriods(metrics);
  const incomePeriods = getIncomePeriods(incomeMetrics);
  const combinedPeriods = getCombinedPeriods(combinedMetrics);

  const latestBalancePeriod = getLatestPeriod(balancePeriods);
  const latestIncomePeriod = getLatestPeriod(incomePeriods);
  const latestCombinedPeriod = getLatestPeriod(combinedPeriods);

  const latestBalance = latestBalancePeriod ? metrics[latestBalancePeriod] : undefined;
  const latestIncome = latestIncomePeriod
    ? incomeMetrics?.[latestIncomePeriod]
    : undefined;
  const latestCombined = latestCombinedPeriod
    ? combinedMetrics?.[latestCombinedPeriod]
    : undefined;

  const balanceRows: MetricRow[] = [
    {
      label: "Aktywa razem",
      values: balancePeriods.map((p) => formatCurrency(metrics[p]?.aktywaRazem)),
    },
    {
      label: "Kapital wlasny",
      values: balancePeriods.map((p) => formatCurrency(metrics[p]?.kapitalWlasny)),
    },
    {
      label: "Zobowiazania",
      values: balancePeriods.map((p) => formatCurrency(metrics[p]?.zobowiazania)),
    },
    {
      label: "Debt ratio",
      values: balancePeriods.map((p) => formatPercent(metrics[p]?.debtRatio)),
    },
    {
      label: "Equity ratio",
      values: balancePeriods.map((p) => formatPercent(metrics[p]?.equityRatio)),
    },
    {
      label: "Leverage",
      values: balancePeriods.map((p) => formatNumber(metrics[p]?.leverage)),
    },
    {
      label: "Debt / Equity",
      values: balancePeriods.map((p) => formatNumber(metrics[p]?.debtToEquity)),
    },
    {
      label: "Solvency ratio",
      values: balancePeriods.map((p) => formatPercent(metrics[p]?.solvencyRatio)),
    },
  ];

  const incomeRows: MetricRow[] = [
    {
      label: "Revenue",
      values: incomePeriods.map((p) => formatCurrency(incomeMetrics?.[p]?.revenue)),
    },
    {
      label: "Operating profit",
      values: incomePeriods.map((p) =>
        formatCurrency(incomeMetrics?.[p]?.operatingProfit)
      ),
    },
    {
      label: "Gross profit",
      values: incomePeriods.map((p) =>
        formatCurrency(incomeMetrics?.[p]?.grossProfit)
      ),
    },
    {
      label: "Net profit",
      values: incomePeriods.map((p) =>
        formatCurrency(incomeMetrics?.[p]?.netProfit)
      ),
    },
    {
      label: "Operating margin",
      values: incomePeriods.map((p) =>
        formatPercent(incomeMetrics?.[p]?.operatingMargin)
      ),
    },
    {
      label: "Net margin",
      values: incomePeriods.map((p) =>
        formatPercent(incomeMetrics?.[p]?.netMargin)
      ),
    },
    {
      label: "ROS",
      values: incomePeriods.map((p) => formatPercent(incomeMetrics?.[p]?.ros)),
    },
  ];

  const combinedRows: MetricRow[] = [
    {
      label: "ROA",
      values: combinedPeriods.map((p) => formatPercent(combinedMetrics?.[p]?.roa)),
    },
    {
      label: "ROE",
      values: combinedPeriods.map((p) => formatPercent(combinedMetrics?.[p]?.roe)),
    },
    {
      label: "Receivables turnover",
      values: combinedPeriods.map((p) =>
        formatDays(combinedMetrics?.[p]?.receivablesTurnoverDays)
      ),
    },
    {
      label: "Inventory turnover",
      values: combinedPeriods.map((p) =>
        formatDays(combinedMetrics?.[p]?.inventoryTurnoverDays)
      ),
    },
  ];

  const benchmarkRows = buildBenchmarkRows(benchmark);

  return (
    <Document
      title={reportName || "Raport finansowy DataGate"}
      author="DataGate"
      creator="DataGate"
      producer="DataGate"
    >
      <Page size="A4" style={styles.page}>
        <Header reportName={reportName} industry={industry} logoUrl={logoUrl} />

        <View style={styles.hero} wrap={false}>
          <Text style={styles.heroTitle}>Executive summary</Text>
          <Text style={styles.heroText}>
            Ta wersja PDF pokazuje osobno ostatni realny okres dla Bilansu, RZiS
            i Analizy lacznej. Nie bierze technicznego T1 z samymi zerami jako
            glownego okresu raportu.
          </Text>
        </View>

        <View style={styles.topGrid} wrap={false}>
          <TopCard
            label="Bilans - ostatni okres"
            value={latestBalancePeriod ? PERIOD_LABELS[latestBalancePeriod] : "-"}
            sub="sekcja bilansowa"
          />
          <TopCard
            label="RZiS - ostatni okres"
            value={latestIncomePeriod ? PERIOD_LABELS[latestIncomePeriod] : "-"}
            sub="sekcja wynikowa"
          />
          <TopCard
            label="Analiza laczna - ostatni okres"
            value={latestCombinedPeriod ? PERIOD_LABELS[latestCombinedPeriod] : "-"}
            sub="bilans + RZiS"
            third
          />

          <TopCard
            label="Aktywa razem"
            value={formatCurrency(latestBalance?.aktywaRazem)}
          />
          <TopCard
            label="Przychody"
            value={formatCurrency(latestIncome?.revenue)}
          />
          <TopCard
            label="ROE"
            value={formatPercent(latestCombined?.roe)}
            third
          />
        </View>

        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>KPI snapshot</Text>
            <Text style={styles.sectionSubtitle}>
              Najwazniejsze liczby z ostatnich realnych okresow.
            </Text>
          </View>

          <View style={styles.cardRow}>
            <MetricCard
              label="Kapital wlasny"
              value={formatCurrency(latestBalance?.kapitalWlasny)}
            />
            <MetricCard
              label="Zobowiazania"
              value={formatCurrency(latestBalance?.zobowiazania)}
            />
            <MetricCard
              label="Debt ratio"
              value={formatPercent(latestBalance?.debtRatio)}
              third
            />

            <MetricCard
              label="Net profit"
              value={formatCurrency(latestIncome?.netProfit)}
            />
            <MetricCard
              label="Net margin"
              value={formatPercent(latestIncome?.netMargin)}
            />
            <MetricCard
              label="ROA"
              value={formatPercent(latestCombined?.roa)}
              third
            />
          </View>
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header reportName={reportName} industry={industry} logoUrl={logoUrl} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bilans</Text>
            <Text style={styles.sectionSubtitle}>
              Ostatnie realne okresy danych bilansowych.
            </Text>
          </View>

          <MetricsTable
            periods={balancePeriods}
            rows={balanceRows}
            emptyMessage="Brak sensownych danych bilansowych."
          />
        </View>

        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RZiS</Text>
            <Text style={styles.sectionSubtitle}>
              Ostatnie realne okresy danych wynikowych.
            </Text>
          </View>

          <MetricsTable
            periods={incomePeriods}
            rows={incomeRows}
            emptyMessage="Brak sensownych danych RZiS."
          />
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header reportName={reportName} industry={industry} logoUrl={logoUrl} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analiza laczna</Text>
            <Text style={styles.sectionSubtitle}>
              Wskazniki laczace Bilans i RZiS.
            </Text>
          </View>

          <MetricsTable
            periods={combinedPeriods}
            rows={combinedRows}
            emptyMessage="Brak sensownych danych analizy lacznej."
          />
        </View>

        <View style={styles.benchmarkBox} wrap={false}>
          <Text style={styles.benchmarkTitle}>Benchmark</Text>
          <Text style={styles.benchmarkText}>
            {benchmark
              ? benchmark.unavailable
                ? `Benchmark niedostepny${benchmark.reason ? `: ${benchmark.reason}` : "."}`
                : `Benchmark dla branzy ${benchmark.industry}, okres ${benchmark.period}, proba ${benchmark.n}.`
              : "Brak danych benchmarkowych."}
          </Text>

          <MetricsTable
            periods={["tMinus2", "tMinus1", "t0"].slice(0, benchmarkRows.length ? 3 : 0) as PeriodKey[]}
            rows={
              benchmarkRows.length
                ? benchmarkRows.map((row) => ({
                    ...row,
                    values: row.values,
                  }))
                : []
            }
            emptyMessage="Brak sensownych statystyk benchmarkowych."
          />
        </View>

        <Footer />
      </Page>
    </Document>
  );
}