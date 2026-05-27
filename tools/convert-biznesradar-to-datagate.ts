/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");
const XLSX = require("xlsx") as typeof import("xlsx");

type WorkBook = import("xlsx").WorkBook;

type PeriodSlot = "tMinus2" | "tMinus1" | "t0";
type StatementKind = "bilans" | "rzis";

type PeriodAssignment = Record<PeriodSlot, string>;
type PeriodValues = Record<PeriodSlot, number | "">;

type SourceRow = {
  label: string;
  values: Record<string, number>;
};

type SheetData = {
  name: string;
  periods: string[];
  rows: SourceRow[];
  rawCells: string[];
};

type FieldResolution = {
  outputLabel: string;
  sourceLabels: string[];
  method: "direct" | "calculated" | "missing";
  requiresReview: boolean;
  values: PeriodValues;
};

type StatementResult = {
  created: boolean;
  fileName?: string;
  periods?: PeriodAssignment;
  fields: FieldResolution[];
  missingFields: string[];
  calculatedFields: string[];
  warnings: string[];
  requiresReview: boolean;
};

type ConversionLogEntry = {
  sourceFile: string;
  company: string;
  unitCertain: boolean;
  unitWarning?: string;
  bilans: StatementResult;
  rzis: StatementResult;
  requiresReview: boolean;
};

const DEFAULT_INPUT_DIR =
  "C:\\Users\\DataGate\\Desktop\\Sprawozdania\\Surowe";
const DEFAULT_OUTPUT_DIR =
  "C:\\Users\\DataGate\\Desktop\\Sprawozdania\\Do wgrania";

const EMPTY_PERIODS: PeriodValues = {
  tMinus2: "",
  tMinus1: "",
  t0: "",
};

const FORECAST_BLANKS = ["", "", "", "", "", ""];

function parseArgs(argv: string[]) {
  const args = {
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    limit: undefined as number | undefined,
    file: undefined as string | undefined,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg.startsWith("--input=")) {
      args.inputDir = arg.slice("--input=".length);
    } else if (arg.startsWith("--output=")) {
      args.outputDir = arg.slice("--output=".length);
    } else if (arg.startsWith("--limit=")) {
      const parsed = Number(arg.slice("--limit=".length));
      if (Number.isFinite(parsed) && parsed > 0) args.limit = parsed;
    } else if (arg.startsWith("--file=")) {
      args.file = arg.slice("--file=".length);
    } else if (arg === "--input" && next) {
      args.inputDir = next;
      i++;
    } else if (arg === "--output" && next) {
      args.outputDir = next;
      i++;
    } else if (arg === "--limit" && next) {
      const parsed = Number(next);
      if (Number.isFinite(parsed) && parsed > 0) args.limit = parsed;
      i++;
    } else if (arg === "--file" && next) {
      args.file = next;
      i++;
    }
  }

  return args;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  let normalized = raw
    .replace(/\u00a0/g, "")
    .replace(/\s/g, "")
    .replace(/"/g, "");

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function csvEscape(value: unknown): string {
  const raw = String(value ?? "");
  if (/[;"\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

function buildCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvEscape).join(";")).join("\r\n") + "\r\n";
}

function findSheetName(
  workbook: WorkBook,
  kind: StatementKind
): string | undefined {
  const expected = kind === "bilans" ? "bilans" : "rzis";
  return workbook.SheetNames.find((name: string) =>
    normalizeText(name).includes(expected)
  );
}

function parseSheet(workbook: WorkBook, sheetName: string): SheetData {
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: "",
  }) as unknown[][];

  const headerRow = rows.find((row) =>
    row.slice(1).some((cell) => /\d{4}/.test(String(cell ?? "")))
  );

  if (!headerRow) {
    throw new Error(`Nie znaleziono wiersza okresów w arkuszu ${sheetName}.`);
  }

  const periods = headerRow
    .slice(1)
    .map((cell) => String(cell ?? "").trim())
    .filter(Boolean);

  const sourceRows: SourceRow[] = [];

  for (const row of rows) {
    const label = String(row[0] ?? "").trim();
    if (!label || normalizeText(label) === "data publikacji") continue;

    const values: Record<string, number> = {};
    periods.forEach((period, index) => {
      const parsed = toNumber(row[index + 1]);
      if (typeof parsed === "number") values[period] = parsed;
    });

    if (Object.keys(values).length > 0) {
      sourceRows.push({ label, values });
    }
  }

  const rawCells = rows.flat().map((cell) => String(cell ?? ""));

  return {
    name: sheetName,
    periods,
    rows: sourceRows,
    rawCells,
  };
}

function detectUnit(workbook: WorkBook): {
  certain: boolean;
  warning?: string;
} {
  const cells: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];
    cells.push(...rows.flat().map((cell) => String(cell ?? "")));
  }

  const joined = normalizeText(cells.join(" "));
  const hasThousands =
    joined.includes("tys. zl") ||
    joined.includes("tys zl") ||
    joined.includes("tys. pln") ||
    joined.includes("tys pln");

  if (hasThousands) return { certain: true };

  return {
    certain: false,
    warning: "niepewna jednostka danych",
  };
}

function pickLastThreePeriods(periods: string[]): PeriodAssignment {
  if (periods.length < 3) {
    throw new Error("Arkusz ma mniej niż 3 okresy historyczne.");
  }

  const lastThree = periods.slice(-3);

  return {
    tMinus2: lastThree[0],
    tMinus1: lastThree[1],
    t0: lastThree[2],
  };
}

function findRow(sheet: SheetData, patterns: string[]): SourceRow | undefined {
  return sheet.rows.find((row) => {
    const label = normalizeText(row.label);
    return patterns.some((pattern) => label === normalizeText(pattern));
  });
}

function findRowContains(
  sheet: SheetData,
  patterns: string[]
): SourceRow | undefined {
  return sheet.rows.find((row) => {
    const label = normalizeText(row.label);
    return patterns.some((pattern) => label.includes(normalizeText(pattern)));
  });
}

function valuesFromRow(
  row: SourceRow | undefined,
  periods: PeriodAssignment
): PeriodValues {
  if (!row) return { ...EMPTY_PERIODS };

  return {
    tMinus2: row.values[periods.tMinus2] ?? "",
    tMinus1: row.values[periods.tMinus1] ?? "",
    t0: row.values[periods.t0] ?? "",
  };
}

function calculateValues(
  periods: PeriodAssignment,
  calculator: (period: string) => number | undefined
): PeriodValues {
  return {
    tMinus2: calculator(periods.tMinus2) ?? "",
    tMinus1: calculator(periods.tMinus1) ?? "",
    t0: calculator(periods.t0) ?? "",
  };
}

function hasAnyValue(values: PeriodValues): boolean {
  return Object.values(values).some((value) => value !== "");
}

function addField(
  fields: FieldResolution[],
  outputLabel: string,
  row: SourceRow | undefined,
  periods: PeriodAssignment,
  options?: { calculated?: boolean; requiresReview?: boolean }
): PeriodValues {
  const values = valuesFromRow(row, periods);
  const found = hasAnyValue(values);

  fields.push({
    outputLabel,
    sourceLabels: row ? [row.label] : [],
    method: found ? (options?.calculated ? "calculated" : "direct") : "missing",
    requiresReview: Boolean(options?.requiresReview || !found),
    values,
  });

  return values;
}

function addCalculatedField(
  fields: FieldResolution[],
  outputLabel: string,
  sourceLabels: string[],
  values: PeriodValues,
  requiresReview: boolean
): PeriodValues {
  fields.push({
    outputLabel,
    sourceLabels,
    method: hasAnyValue(values) ? "calculated" : "missing",
    requiresReview,
    values,
  });

  return values;
}

function valueOf(values: PeriodValues, slot: PeriodSlot): number | undefined {
  const value = values[slot];
  return typeof value === "number" ? value : undefined;
}

function approximatelyEqual(a: number, b: number): boolean {
  const tolerance = Math.max(1, Math.abs(a) * 0.005);
  return Math.abs(a - b) <= tolerance;
}

function summarizeStatement(
  result: Omit<StatementResult, "missingFields" | "calculatedFields">
): StatementResult {
  return {
    ...result,
    missingFields: result.fields
      .filter((field) => field.method === "missing")
      .map((field) => field.outputLabel),
    calculatedFields: result.fields
      .filter((field) => field.method === "calculated")
      .map((field) => field.outputLabel),
  };
}

function buildBilans(
  sheet: SheetData,
  companySlug: string,
  outputDir: string
): StatementResult {
  const periods = pickLastThreePeriods(sheet.periods);
  const fields: FieldResolution[] = [];
  const warnings: string[] = [];

  const assetsFixed = addField(
    fields,
    "AKTYWA TRWAŁE",
    findRow(sheet, ["Aktywa trwałe"]),
    periods
  );
  const intangible = addField(
    fields,
    "Wartości niematerialne i prawne",
    findRow(sheet, ["Wartości niematerialne i prawne"]),
    periods
  );
  const tangible = addField(
    fields,
    "Rzeczowe aktywa trwałe",
    findRow(sheet, ["Rzeczowe składniki majątku trwałego"]),
    periods
  );
  const longReceivables = addField(
    fields,
    "Należności długoterminowe",
    findRow(sheet, ["Należności długoterminowe"]),
    periods
  );
  const longInvestments = addField(
    fields,
    "Inwestycje długoterminowe",
    findRow(sheet, ["Inwestycje długoterminowe"]),
    periods
  );
  const currentAssets = addField(
    fields,
    "AKTYWA OBROTOWE",
    findRow(sheet, ["Aktywa obrotowe"]),
    periods
  );
  const inventory = addField(
    fields,
    "Zapasy",
    findRow(sheet, ["Zapasy"]),
    periods
  );
  const shortReceivables = addField(
    fields,
    "Należności krótkoterminowe",
    findRow(sheet, ["Należności krótkoterminowe"]),
    periods
  );
  const shortInvestments = addField(
    fields,
    "Inwestycje krótkoterminowe",
    findRow(sheet, ["Inwestycje krótkoterminowe"]),
    periods,
    { requiresReview: true }
  );
  const otherCurrentAssets = addField(
    fields,
    "Krótkoterminowe rozliczenia międzyokresowe",
    findRow(sheet, ["Pozostałe aktywa obrotowe"]),
    periods,
    { requiresReview: true }
  );
  const assetsTotal = addField(
    fields,
    "RAZEM AKTYWA",
    findRow(sheet, ["Aktywa razem"]),
    periods
  );

  const equityDirect = findRowContains(sheet, [
    "kapitał własny razem",
    "kapital wlasny razem",
  ]);
  const parentEquity = findRow(sheet, [
    "Kapitał własny akcjonariuszy jednostki dominującej",
  ]);
  const nonControlling = findRow(sheet, ["Udziały niekontrolujące"]);

  const equity = equityDirect
    ? addField(fields, "KAPITAŁ (FUNDUSZ) WŁASNY", equityDirect, periods)
    : addCalculatedField(
        fields,
        "KAPITAŁ (FUNDUSZ) WŁASNY",
        [parentEquity?.label, nonControlling?.label].filter(Boolean) as string[],
        calculateValues(periods, (period) => {
          const parent = parentEquity?.values[period];
          if (typeof parent !== "number") return undefined;
          return parent + (nonControlling?.values[period] ?? 0);
        }),
        true
      );

  const longLiabilities = addField(
    fields,
    "Zobowiązania długoterminowe",
    findRow(sheet, ["Zobowiązania długoterminowe"]),
    periods
  );
  const shortLiabilities = addField(
    fields,
    "Zobowiązania krótkoterminowe",
    findRow(sheet, ["Zobowiązania krótkoterminowe"]),
    periods
  );

  const liabilitiesDirect = findRowContains(sheet, [
    "zobowiązania i rezerwy na zobowiązania",
    "zobowiazania i rezerwy na zobowiazania",
    "zobowiązania razem",
    "zobowiazania razem",
  ]);
  const liabilities = liabilitiesDirect
    ? addField(
        fields,
        "ZOBOWIĄZANIA I REZERWY NA ZOBOWIĄZANIA",
        liabilitiesDirect,
        periods
      )
    : addCalculatedField(
        fields,
        "ZOBOWIĄZANIA I REZERWY NA ZOBOWIĄZANIA",
        ["Pasywa razem", "KAPITAŁ (FUNDUSZ) WŁASNY"],
        calculateValues(periods, (period) => {
          const total = findRow(sheet, ["Pasywa razem"])?.values[period];
          const slot = Object.entries(periods).find(
            ([, sourcePeriod]) => sourcePeriod === period
          )?.[0] as PeriodSlot | undefined;
          const equityValue = slot ? valueOf(equity, slot) : undefined;
          if (typeof total !== "number" || typeof equityValue !== "number") {
            return undefined;
          }
          return total - equityValue;
        }),
        true
      );

  const passivesTotal = addField(
    fields,
    "RAZEM PASYWA",
    findRow(sheet, ["Pasywa razem"]),
    periods
  );

  (Object.keys(periods) as PeriodSlot[]).forEach((slot) => {
    const assets = valueOf(assetsTotal, slot);
    const passives = valueOf(passivesTotal, slot);
    const equityValue = valueOf(equity, slot);
    const liabilitiesValue = valueOf(liabilities, slot);

    if (
      typeof assets === "number" &&
      typeof passives === "number" &&
      !approximatelyEqual(assets, passives)
    ) {
      warnings.push(
        `Bilans ${slot}: aktywa razem (${assets}) różnią się od pasywów razem (${passives}).`
      );
    }

    if (
      typeof assets === "number" &&
      typeof equityValue === "number" &&
      typeof liabilitiesValue === "number" &&
      !approximatelyEqual(assets, equityValue + liabilitiesValue)
    ) {
      warnings.push(
        `Bilans ${slot}: aktywa razem nie zgadzają się z kapitałem własnym + zobowiązaniami.`
      );
    }
  });

  const csvRows = [
    ["", "Bilans", "", "", "", "", "", "", "", "", "", "", "(w tys. zł)"],
    [],
    [
      "Lp.",
      "Wyszczególnienie",
      "Nr wiersza",
      "Okres poprzedzający T -2",
      "Okres poprzedzający T -1",
      "Okres bieżący T-0",
      "Okres prognozowany T+1",
      "Okres prognozowany T+2",
      "Okres prognozowany T+3",
      "Okres prognozowany T+4",
      "Okres prognozowany T+5",
      "Okres prognozowany T+6",
    ],
    ["", "", "Data:", periods.tMinus2, periods.tMinus1, periods.t0, ...FORECAST_BLANKS],
    ["A.", "AKTYWA TRWAŁE (w 02+03+04+05+10)", "1", assetsFixed.tMinus2, assetsFixed.tMinus1, assetsFixed.t0, ...FORECAST_BLANKS],
    ["I.", "Wartości niematerialne i prawne", "2", intangible.tMinus2, intangible.tMinus1, intangible.t0, ...FORECAST_BLANKS],
    ["II.", "Rzeczowe aktywa trwałe", "3", tangible.tMinus2, tangible.tMinus1, tangible.t0, ...FORECAST_BLANKS],
    ["III.", "Należności długoterminowe", "4", longReceivables.tMinus2, longReceivables.tMinus1, longReceivables.t0, ...FORECAST_BLANKS],
    ["IV.", "Inwestycje długoterminowe", "5", longInvestments.tMinus2, longInvestments.tMinus1, longInvestments.t0, ...FORECAST_BLANKS],
    ["B.", "AKTYWA OBROTOWE (w 14+15+21+22)", "13", currentAssets.tMinus2, currentAssets.tMinus1, currentAssets.t0, ...FORECAST_BLANKS],
    ["I.", "Zapasy", "14", inventory.tMinus2, inventory.tMinus1, inventory.t0, ...FORECAST_BLANKS],
    ["II.", "Należności krótkoterminowe", "15", shortReceivables.tMinus2, shortReceivables.tMinus1, shortReceivables.t0, ...FORECAST_BLANKS],
    ["III.", "Inwestycje krótkoterminowe", "21", shortInvestments.tMinus2, shortInvestments.tMinus1, shortInvestments.t0, ...FORECAST_BLANKS],
    ["IV.", "Krótkoterminowe rozliczenia międzyokresowe", "22", otherCurrentAssets.tMinus2, otherCurrentAssets.tMinus1, otherCurrentAssets.t0, ...FORECAST_BLANKS],
    ["", "RAZEM AKTYWA (w 01+13)", "23", assetsTotal.tMinus2, assetsTotal.tMinus1, assetsTotal.t0, ...FORECAST_BLANKS],
    ["A.", "KAPITAŁ (FUNDUSZ) WŁASNY (w 02 do 10)", "1", equity.tMinus2, equity.tMinus1, equity.t0, ...FORECAST_BLANKS],
    ["B.", "ZOBOWIĄZANIA I REZERWY NA ZOBOWIĄZANIA (w 12+13+14+23)", "11", liabilities.tMinus2, liabilities.tMinus1, liabilities.t0, ...FORECAST_BLANKS],
    ["II.", "Zobowiązania długoterminowe", "13", longLiabilities.tMinus2, longLiabilities.tMinus1, longLiabilities.t0, ...FORECAST_BLANKS],
    ["III.", "Zobowiązania krótkoterminowe", "14", shortLiabilities.tMinus2, shortLiabilities.tMinus1, shortLiabilities.t0, ...FORECAST_BLANKS],
    ["", "RAZEM PASYWA (w 01+11)", "24", passivesTotal.tMinus2, passivesTotal.tMinus1, passivesTotal.t0, ...FORECAST_BLANKS],
  ];

  const fileName = `${companySlug}_bilans.csv`;
  fs.writeFileSync(
    path.join(outputDir, fileName),
    buildCsv(csvRows),
    "utf8"
  );

  return summarizeStatement({
    created: true,
    fileName,
    periods,
    fields,
    warnings,
    requiresReview:
      warnings.length > 0 ||
      fields.some((field) => field.requiresReview || field.method !== "direct"),
  });
}

function buildRzis(
  sheet: SheetData,
  companySlug: string,
  outputDir: string
): StatementResult {
  const periods = pickLastThreePeriods(sheet.periods);
  const fields: FieldResolution[] = [];
  const warnings: string[] = [];

  const revenue = addField(
    fields,
    "PRZYCHODY NETTO ZE SPRZEDAŻY I ZRÓWNANE Z NIMI",
    findRow(sheet, ["Przychody ze sprzedaży"]),
    periods
  );
  const productionCost = findRow(sheet, [
    "Techniczny koszt wytworzenia produkcji sprzedanej",
  ]);
  const sellingCosts = findRow(sheet, ["Koszty sprzedaży"]);
  const adminCosts = findRow(sheet, ["Koszty ogólnego zarządu"]);
  const operatingCosts = addCalculatedField(
    fields,
    "KOSZTY DZIAŁALNOŚCI OPERACYJNEJ",
    [productionCost?.label, sellingCosts?.label, adminCosts?.label].filter(
      Boolean
    ) as string[],
    calculateValues(periods, (period) => {
      const values = [
        productionCost?.values[period],
        sellingCosts?.values[period],
        adminCosts?.values[period],
      ];
      const numericValues = values.filter(
        (value): value is number => typeof value === "number"
      );
      if (numericValues.length !== values.length) return undefined;
      return numericValues.reduce((sum, value) => sum + value, 0);
    }),
    true
  );
  const salesProfit = addField(
    fields,
    "ZYSK (STRATA) ZE SPRZEDAŻY",
    findRow(sheet, ["Zysk ze sprzedaży"]),
    periods
  );
  const otherOperatingRevenue = addField(
    fields,
    "Pozostałe przychody operacyjne",
    findRow(sheet, ["Pozostałe przychody operacyjne"]),
    periods
  );
  const otherOperatingCosts = addField(
    fields,
    "Pozostałe koszty operacyjne",
    findRow(sheet, ["Pozostałe koszty operacyjne"]),
    periods
  );
  const ebit = addField(
    fields,
    "ZYSK (STRATA) Z DZIAŁALNOŚCI OPERACYJNEJ",
    findRow(sheet, ["Zysk operacyjny (EBIT)"]),
    periods
  );
  const financialRevenue = addField(
    fields,
    "Przychody finansowe",
    findRow(sheet, ["Przychody finansowe"]),
    periods
  );
  const financialCosts = addField(
    fields,
    "Koszty finansowe",
    findRow(sheet, ["Koszty finansowe"]),
    periods
  );
  const economicProfit = addField(
    fields,
    "ZYSK (STRATA) Z DZIAŁALNOŚCI GOSPODARCZEJ",
    findRow(sheet, ["Zysk z działalności gospodarczej"]),
    periods
  );
  const extraordinary = addField(
    fields,
    "Wynik zdarzeń nadzwyczajnych",
    findRow(sheet, ["Wynik zdarzeń nadzwyczajnych"]),
    periods
  );
  const grossProfit = addField(
    fields,
    "ZYSK (STRATA) BRUTTO",
    findRow(sheet, ["Zysk przed opodatkowaniem"]),
    periods
  );
  const netProfitRow = findRow(sheet, ["Zysk netto"]);
  const netProfit = addField(
    fields,
    "ZYSK (STRATA) NETTO",
    netProfitRow,
    periods
  );
  const incomeTax = addCalculatedField(
    fields,
    "Podatek dochodowy i inne obowiązkowe obciążenia",
    ["Zysk przed opodatkowaniem", "Zysk netto"],
    calculateValues(periods, (period) => {
      const gross = findRow(sheet, ["Zysk przed opodatkowaniem"])?.values[
        period
      ];
      const net = netProfitRow?.values[period];
      if (typeof gross !== "number" || typeof net !== "number") return undefined;
      return gross - net;
    }),
    true
  );

  if (!hasAnyValue(revenue)) warnings.push("RZiS: brak przychodów.");
  if (!hasAnyValue(ebit)) warnings.push("RZiS: brak wyniku operacyjnego.");
  if (!hasAnyValue(netProfit)) warnings.push("RZiS: brak zysku netto.");

  const csvRows = [
    ["", "Rachunek zysków i strat", "", "", "", "", "", "", "", "", "", "", "(w tys. zł)"],
    [],
    [
      "Lp.",
      "Wyszczególnienie",
      "Nr wiersza",
      "Okres poprzedzający T -2",
      "Okres poprzedzający T -1",
      "Okres bieżący T-0",
      "Okres prognozowany T+1",
      "Okres prognozowany T+2",
      "Okres prognozowany T+3",
      "Okres prognozowany T+4",
      "Okres prognozowany T+5",
      "Okres prognozowany T+6",
    ],
    ["", "", "Data:", periods.tMinus2, periods.tMinus1, periods.t0, ...FORECAST_BLANKS],
    ["A.", "PRZYCHODY NETTO ZE SPRZEDAŻY I ZRÓWNANE Z NIMI (w 02+03+04+05)", "1", revenue.tMinus2, revenue.tMinus1, revenue.t0, ...FORECAST_BLANKS],
    ["B.", "KOSZTY DZIAŁALNOŚCI OPERACYJNEJ (w 07 do 13)", "6", operatingCosts.tMinus2, operatingCosts.tMinus1, operatingCosts.t0, ...FORECAST_BLANKS],
    ["C.", "ZYSK STRATA ZE SPRZEDAŻY (w 01-06)", "15", salesProfit.tMinus2, salesProfit.tMinus1, salesProfit.t0, ...FORECAST_BLANKS],
    ["", "1. Pozostałe przychody operacyjne", "16", otherOperatingRevenue.tMinus2, otherOperatingRevenue.tMinus1, otherOperatingRevenue.t0, ...FORECAST_BLANKS],
    ["", "2. Pozostałe koszty operacyjne", "17", otherOperatingCosts.tMinus2, otherOperatingCosts.tMinus1, otherOperatingCosts.t0, ...FORECAST_BLANKS],
    ["D.", "ZYSK STRATA Z DZIAŁALNOŚCI OPERACYJNEJ (w 15+16-17)", "18", ebit.tMinus2, ebit.tMinus1, ebit.t0, ...FORECAST_BLANKS],
    ["E.", "Przychody finansowe (w 20+21)", "19", financialRevenue.tMinus2, financialRevenue.tMinus1, financialRevenue.t0, ...FORECAST_BLANKS],
    ["F.", "Koszty finansowe (w 23+24)", "22", financialCosts.tMinus2, financialCosts.tMinus1, financialCosts.t0, ...FORECAST_BLANKS],
    ["G.", "ZYSK STRATA Z DZIAŁALNOŚCI GOSPODARCZEJ (w 18+19-22)", "25", economicProfit.tMinus2, economicProfit.tMinus1, economicProfit.t0, ...FORECAST_BLANKS],
    ["", "1. Wynik zdarzeń nadzwyczajnych", "26", extraordinary.tMinus2, extraordinary.tMinus1, extraordinary.t0, ...FORECAST_BLANKS],
    ["H.", "ZYSK STRATA BRUTTO (w 25+26)", "27", grossProfit.tMinus2, grossProfit.tMinus1, grossProfit.t0, ...FORECAST_BLANKS],
    ["", "1. Podatek dochodowy i inne obowiązkowe obciążenia", "28", incomeTax.tMinus2, incomeTax.tMinus1, incomeTax.t0, ...FORECAST_BLANKS],
    ["I.", "ZYSK STRATA NETTO (w 27-28)", "29", netProfit.tMinus2, netProfit.tMinus1, netProfit.t0, ...FORECAST_BLANKS],
  ];

  const fileName = `${companySlug}_rzis.csv`;
  fs.writeFileSync(
    path.join(outputDir, fileName),
    buildCsv(csvRows),
    "utf8"
  );

  return summarizeStatement({
    created: true,
    fileName,
    periods,
    fields,
    warnings,
    requiresReview:
      warnings.length > 0 ||
      fields.some((field) => field.requiresReview || field.method !== "direct"),
  });
}

function emptyStatement(error: string): StatementResult {
  return {
    created: false,
    fields: [],
    missingFields: [],
    calculatedFields: [],
    warnings: [error],
    requiresReview: true,
  };
}

function convertFile(sourcePath: string, outputDir: string): ConversionLogEntry {
  const workbook = XLSX.readFile(sourcePath, { cellDates: false });
  const company = path.basename(sourcePath, path.extname(sourcePath));
  const companySlug = slugify(company) || "spolka";
  const unit = detectUnit(workbook);

  fs.mkdirSync(outputDir, { recursive: true });

  let bilans: StatementResult;
  let rzis: StatementResult;

  try {
    const sheetName = findSheetName(workbook, "bilans");
    bilans = sheetName
      ? buildBilans(parseSheet(workbook, sheetName), companySlug, outputDir)
      : emptyStatement("Nie znaleziono arkusza BILANS.");
  } catch (error) {
    bilans = emptyStatement(
      error instanceof Error ? error.message : "Nie udało się przetworzyć bilansu."
    );
  }

  try {
    const sheetName = findSheetName(workbook, "rzis");
    rzis = sheetName
      ? buildRzis(parseSheet(workbook, sheetName), companySlug, outputDir)
      : emptyStatement("Nie znaleziono arkusza RZIS.");
  } catch (error) {
    rzis = emptyStatement(
      error instanceof Error ? error.message : "Nie udało się przetworzyć RZiS."
    );
  }

  if (!unit.certain) {
    bilans.warnings.push(unit.warning ?? "niepewna jednostka danych");
    rzis.warnings.push(unit.warning ?? "niepewna jednostka danych");
    bilans.requiresReview = true;
    rzis.requiresReview = true;
  }

  return {
    sourceFile: sourcePath,
    company,
    unitCertain: unit.certain,
    unitWarning: unit.warning,
    bilans,
    rzis,
    requiresReview:
      !unit.certain || bilans.requiresReview || rzis.requiresReview,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.inputDir)) {
    throw new Error(`Nie istnieje folder wejściowy: ${args.inputDir}`);
  }

  fs.mkdirSync(args.outputDir, { recursive: true });

  let files = fs
    .readdirSync(args.inputDir)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"))
    .sort((a, b) => a.localeCompare(b, "pl"));

  if (args.file) {
    const wanted = normalizeText(args.file);
    files = files.filter((file) => normalizeText(file).includes(wanted));
  }

  if (args.limit) {
    files = files.slice(0, args.limit);
  }

  const logs = files.map((file) =>
    convertFile(path.join(args.inputDir, file), args.outputDir)
  );

  const logPath = path.join(args.outputDir, "conversion-log.json");
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), "utf8");

  const reportPath = path.join(args.outputDir, "conversion-report.txt");
  const report = logs
    .map((entry) => {
      const lines = [
        `Plik: ${path.basename(entry.sourceFile)}`,
        `Spółka: ${entry.company}`,
        `Bilans: ${entry.bilans.created ? entry.bilans.fileName : "nie utworzono"}`,
        `RZiS: ${entry.rzis.created ? entry.rzis.fileName : "nie utworzono"}`,
        `Jednostka pewna: ${entry.unitCertain ? "tak" : "nie"}`,
        `Wymaga kontroli: ${entry.requiresReview ? "tak" : "nie"}`,
      ];

      if (entry.bilans.periods) {
        lines.push(
          `Okresy bilansu: T-2=${entry.bilans.periods.tMinus2}, T-1=${entry.bilans.periods.tMinus1}, T-0=${entry.bilans.periods.t0}`
        );
      }

      if (entry.rzis.periods) {
        lines.push(
          `Okresy RZiS: T-2=${entry.rzis.periods.tMinus2}, T-1=${entry.rzis.periods.tMinus1}, T-0=${entry.rzis.periods.t0}`
        );
      }

      return lines.join("\n");
    })
    .join("\n\n");

  fs.writeFileSync(reportPath, report + "\n", "utf8");

  console.log(`Przetworzono plików: ${logs.length}`);
  console.log(`Log JSON: ${logPath}`);
  console.log(`Raport TXT: ${reportPath}`);
}

main();
