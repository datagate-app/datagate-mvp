import type { IncomeStatementData, PeriodKey } from "@/lib/types/metrics";

export type PeriodValues = Record<PeriodKey, number>;

export type RzisValues = {
  przychodyNettoZeSprzedazy: PeriodValues;
  kosztyDzialalnosciOperacyjnej: PeriodValues;
  zyskStrataZDzialalnosciOperacyjnej: PeriodValues;
  zyskStrataBrutto: PeriodValues;
  zyskStrataNetto: PeriodValues;
};

type MetricsPeriodKey = PeriodKey;

const PERIOD_ALIASES: Array<{
  key: MetricsPeriodKey;
  patterns: string[];
}> = [
  {
    key: "tMinus2",
    patterns: ["t-2", "t -2", "t - 2", "tminus2", "okres poprzedzajacy t -2"],
  },
  {
    key: "tMinus1",
    patterns: ["t-1", "t -1", "t - 1", "tminus1", "okres poprzedzajacy t -1"],
  },
  {
    key: "t0",
    patterns: ["t0", "t-0", "t 0", "okres biezacy t-0", "okres biezacy t0"],
  },
  {
    key: "t1",
    patterns: ["t+1", "t1", "t +1", "t + 1", "okres prognozowany t+1"],
  },
  {
    key: "t2",
    patterns: ["t+2", "t2", "t +2", "t + 2", "okres prognozowany t+2"],
  },
  {
    key: "t3",
    patterns: ["t+3", "t3", "t +3", "t + 3", "okres prognozowany t+3"],
  },
  {
    key: "t4",
    patterns: ["t+4", "t4", "t +4", "t + 4", "okres prognozowany t+4"],
  },
  {
    key: "t5",
    patterns: ["t+5", "t5", "t +5", "t + 5", "okres prognozowany t+5"],
  },
  {
    key: "t6",
    patterns: ["t+6", "t6", "t +6", "t + 6", "okres prognozowany t+6"],
  },
];

function emptyPeriods(): PeriodValues {
  return {
    tMinus2: 0,
    tMinus1: 0,
    t0: 0,
    t1: 0,
    t2: 0,
    t3: 0,
    t4: 0,
    t5: 0,
    t6: 0,
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toNumber(value: string): number {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  let normalized = raw
    .replace(/\u00A0/g, "")
    .replace(/\s/g, "")
    .replace(/"/g, "");

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function detectDelimiter(sample: string): string {
  const firstLines = sample.split(/\r?\n/).slice(0, 5).join("\n");
  const semicolons = (firstLines.match(/;/g) || []).length;
  const commas = (firstLines.match(/,/g) || []).length;

  return semicolons >= commas ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((cell) => cell.trim());
}

function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const joined = normalizeText(rows[i].join(" | "));

    const hasPeriods =
      joined.includes("t-2") ||
      joined.includes("t-1") ||
      joined.includes("t-0") ||
      joined.includes("t0") ||
      joined.includes("t+1");

    if (hasPeriods) {
      return i;
    }
  }

  return -1;
}

function findPeriodColumnMap(
  headerRow: string[]
): Partial<Record<MetricsPeriodKey, number>> {
  const map: Partial<Record<MetricsPeriodKey, number>> = {};

  headerRow.forEach((cell, index) => {
    const normalized = normalizeText(cell);

    for (const period of PERIOD_ALIASES) {
      if (period.patterns.some((pattern) => normalized.includes(pattern))) {
        map[period.key] = index;
      }
    }
  });

  return map;
}

function extractRowLabel(cols: string[], firstPeriodColumnIndex: number): string {
  const labelCells = cols
    .slice(0, firstPeriodColumnIndex)
    .filter((cell) => normalizeText(cell) !== "");

  return normalizeText(labelCells.join(" "));
}

function readPeriodsFromRow(
  cols: string[],
  columnMap: Partial<Record<MetricsPeriodKey, number>>
): PeriodValues {
  const result = emptyPeriods();

  (Object.keys(result) as MetricsPeriodKey[]).forEach((periodKey) => {
    const columnIndex = columnMap[periodKey];
    if (typeof columnIndex === "number") {
      result[periodKey] = toNumber(cols[columnIndex] || "");
    }
  });

  return result;
}

/* ================= ROW MATCHERS ================= */

function isRevenueRow(label: string): boolean {
  return (
    label.includes("przychody netto ze sprzedazy produktow i uslug") ||
    label.includes("przychody netto ze sprzedazy produktow, towarow i materialow") ||
    label.includes("przychody netto ze sprzedazy") ||
    label.includes("przychody ze sprzedazy")
  );
}

function isOperatingCostsRow(label: string): boolean {
  return (
    label.includes("koszty dzialalnosci operacyjnej") ||
    label.includes("koszty operacyjne podstawowej dzialalnosci")
  );
}

function isOperatingProfitRow(label: string): boolean {
  return (
    label.includes("zysk strata z dzialalnosci operacyjnej") ||
    label.includes("wynik z dzialalnosci operacyjnej")
  );
}

function isGrossProfitRow(label: string): boolean {
  return (
    label.includes("zysk strata brutto") ||
    label.includes("wynik brutto")
  );
}

function isNetProfitRow(label: string): boolean {
  return (
    label.includes("zysk strata netto") ||
    label.includes("wynik netto")
  );
}

/* ================= PARSER ================= */

export function parseRzisCsv(csv: string): RzisValues {
  const trimmed = csv.trim();

  if (!trimmed) {
    return {
      przychodyNettoZeSprzedazy: emptyPeriods(),
      kosztyDzialalnosciOperacyjnej: emptyPeriods(),
      zyskStrataZDzialalnosciOperacyjnej: emptyPeriods(),
      zyskStrataBrutto: emptyPeriods(),
      zyskStrataNetto: emptyPeriods(),
    };
  }

  const delimiter = detectDelimiter(trimmed);
  const rows = trimmed
    .split(/\r?\n/)
    .map((line) => splitCsvLine(line, delimiter));

  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error(
      "Nie znaleziono w pliku wiersza z okresami (t-2, t-1, t0, t1...)."
    );
  }

  const headerRow = rows[headerRowIndex];
  const columnMap = findPeriodColumnMap(headerRow);

  const firstPeriodColumnIndex = Math.min(
    ...Object.values(columnMap).filter(
      (value): value is number => typeof value === "number"
    )
  );

  if (!Number.isFinite(firstPeriodColumnIndex)) {
    throw new Error("Nie udało się rozpoznać kolumn okresów w pliku CSV.");
  }

  let przychodyNettoZeSprzedazy = emptyPeriods();
  let kosztyDzialalnosciOperacyjnej = emptyPeriods();
  let zyskStrataZDzialalnosciOperacyjnej = emptyPeriods();
  let zyskStrataBrutto = emptyPeriods();
  let zyskStrataNetto = emptyPeriods();

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const cols = rows[i];
    const label = extractRowLabel(cols, firstPeriodColumnIndex);

    if (!label) continue;

    if (isRevenueRow(label)) {
      przychodyNettoZeSprzedazy = readPeriodsFromRow(cols, columnMap);
      continue;
    }

    if (isOperatingCostsRow(label)) {
      kosztyDzialalnosciOperacyjnej = readPeriodsFromRow(cols, columnMap);
      continue;
    }

    if (isOperatingProfitRow(label)) {
      zyskStrataZDzialalnosciOperacyjnej = readPeriodsFromRow(cols, columnMap);
      continue;
    }

    if (isGrossProfitRow(label)) {
      zyskStrataBrutto = readPeriodsFromRow(cols, columnMap);
      continue;
    }

    if (isNetProfitRow(label)) {
      zyskStrataNetto = readPeriodsFromRow(cols, columnMap);
      continue;
    }
  }

  return {
    przychodyNettoZeSprzedazy,
    kosztyDzialalnosciOperacyjnej,
    zyskStrataZDzialalnosciOperacyjnej,
    zyskStrataBrutto,
    zyskStrataNetto,
  };
}

/* ================= MAPPER DO TYPÓW APPKI ================= */

export function mapRzisValuesToIncomeStatementData(
  data: RzisValues
): IncomeStatementData {
  return {
    tMinus2: {
      przychodyNettoZeSprzedazy:
        data.przychodyNettoZeSprzedazy.tMinus2,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.tMinus2,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.tMinus2,
      zyskStrataBrutto: data.zyskStrataBrutto.tMinus2,
      zyskStrataNetto: data.zyskStrataNetto.tMinus2,
    },
    tMinus1: {
      przychodyNettoZeSprzedazy:
        data.przychodyNettoZeSprzedazy.tMinus1,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.tMinus1,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.tMinus1,
      zyskStrataBrutto: data.zyskStrataBrutto.tMinus1,
      zyskStrataNetto: data.zyskStrataNetto.tMinus1,
    },
    t0: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t0,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t0,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t0,
      zyskStrataBrutto: data.zyskStrataBrutto.t0,
      zyskStrataNetto: data.zyskStrataNetto.t0,
    },
    t1: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t1,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t1,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t1,
      zyskStrataBrutto: data.zyskStrataBrutto.t1,
      zyskStrataNetto: data.zyskStrataNetto.t1,
    },
    t2: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t2,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t2,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t2,
      zyskStrataBrutto: data.zyskStrataBrutto.t2,
      zyskStrataNetto: data.zyskStrataNetto.t2,
    },
    t3: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t3,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t3,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t3,
      zyskStrataBrutto: data.zyskStrataBrutto.t3,
      zyskStrataNetto: data.zyskStrataNetto.t3,
    },
    t4: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t4,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t4,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t4,
      zyskStrataBrutto: data.zyskStrataBrutto.t4,
      zyskStrataNetto: data.zyskStrataNetto.t4,
    },
    t5: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t5,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t5,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t5,
      zyskStrataBrutto: data.zyskStrataBrutto.t5,
      zyskStrataNetto: data.zyskStrataNetto.t5,
    },
    t6: {
      przychodyNettoZeSprzedazy: data.przychodyNettoZeSprzedazy.t6,
      kosztyDzialalnosciOperacyjnej:
        data.kosztyDzialalnosciOperacyjnej.t6,
      zyskStrataZDzialalnosciOperacyjnej:
        data.zyskStrataZDzialalnosciOperacyjnej.t6,
      zyskStrataBrutto: data.zyskStrataBrutto.t6,
      zyskStrataNetto: data.zyskStrataNetto.t6,
    },
  };
}