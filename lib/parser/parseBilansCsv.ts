export type PeriodValues = {
  tMinus2: number;
  tMinus1: number;
  t0: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
};

export type BilansValues = {
  aktywaRazem: PeriodValues;
  kapitalWlasny: PeriodValues;
  zobowiazania: PeriodValues;
};

type MetricsPeriodKey =
  | "tMinus2"
  | "tMinus1"
  | "t0"
  | "t1"
  | "t2"
  | "t3"
  | "t4"
  | "t5"
  | "t6";

const PERIOD_ALIASES: Array<{
  key: MetricsPeriodKey;
  patterns: string[];
}> = [
  { key: "tMinus2", patterns: ["t-2", "t -2", "t - 2", "tminus2", "okres poprzedzajacy t -2"] },
  { key: "tMinus1", patterns: ["t-1", "t -1", "t - 1", "tminus1", "okres poprzedzajacy t -1"] },
  { key: "t0", patterns: ["t0", "t-0", "t 0", "okres biezacy t-0", "okres biezacy t0"] },
  { key: "t1", patterns: ["t+1", "t1", "t +1", "t + 1", "okres prognozowany t+1"] },
  { key: "t2", patterns: ["t+2", "t2", "t +2", "t + 2", "okres prognozowany t+2"] },
  { key: "t3", patterns: ["t+3", "t3", "t +3", "t + 3", "okres prognozowany t+3"] },
  { key: "t4", patterns: ["t+4", "t4", "t +4", "t + 4", "okres prognozowany t+4"] },
  { key: "t5", patterns: ["t+5", "t5", "t +5", "t + 5", "okres prognozowany t+5"] },
  { key: "t6", patterns: ["t+6", "t6", "t +6", "t + 6", "okres prognozowany t+6"] },
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
      joined.includes("t+1");

    if (hasPeriods) {
      return i;
    }
  }

  return -1;
}

function findPeriodColumnMap(headerRow: string[]): Partial<Record<MetricsPeriodKey, number>> {
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

function isAssetsTotal(label: string): boolean {
  return (
    label.includes("razem aktywa") ||
    label.includes("aktywa razem") ||
    label.includes("suma aktywow")
  );
}

function isEquityTotal(label: string): boolean {
  return (
    label.includes("kapital (fundusz) wlasny") ||
    label.includes("kapital fundusz wlasny") ||
    label.includes("kapital wlasny")
  );
}

function isLiabilitiesTotal(label: string): boolean {
  return (
    label.includes("zobowiazania i rezerwy na zobowiazania") ||
    label.includes("zobowiazania i rezerwy")
  );
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

function fillMissingEquity(
  aktywaRazem: PeriodValues,
  kapitalWlasny: PeriodValues,
  zobowiazania: PeriodValues
): PeriodValues {
  const result = { ...kapitalWlasny };

  (Object.keys(result) as MetricsPeriodKey[]).forEach((periodKey) => {
    const assets = aktywaRazem[periodKey];
    const equity = kapitalWlasny[periodKey];
    const liabilities = zobowiazania[periodKey];

    if (equity === 0 && assets > 0) {
      const calculated = assets - liabilities;
      result[periodKey] = calculated > 0 ? calculated : 0;
    }
  });

  return result;
}

export function parseBilansCsv(csv: string): BilansValues {
  const trimmed = csv.trim();

  if (!trimmed) {
    return {
      aktywaRazem: emptyPeriods(),
      kapitalWlasny: emptyPeriods(),
      zobowiazania: emptyPeriods(),
    };
  }

  const delimiter = detectDelimiter(trimmed);
  const rows = trimmed
    .split(/\r?\n/)
    .map((line) => splitCsvLine(line, delimiter));

  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error("Nie znaleziono w pliku wiersza z okresami (t-2, t-1, t0, t1...).");
  }

  const headerRow = rows[headerRowIndex];
  const columnMap = findPeriodColumnMap(headerRow);

  const firstPeriodColumnIndex = Math.min(
    ...Object.values(columnMap).filter((value): value is number => typeof value === "number")
  );

  if (!Number.isFinite(firstPeriodColumnIndex)) {
    throw new Error("Nie udało się rozpoznać kolumn okresów w pliku CSV.");
  }

  let aktywaRazem = emptyPeriods();
  let kapitalWlasny = emptyPeriods();
  let zobowiazania = emptyPeriods();

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const cols = rows[i];
    const label = extractRowLabel(cols, firstPeriodColumnIndex);

    if (!label) continue;

    if (isAssetsTotal(label)) {
      aktywaRazem = readPeriodsFromRow(cols, columnMap);
      continue;
    }

    if (isEquityTotal(label)) {
      kapitalWlasny = readPeriodsFromRow(cols, columnMap);
      continue;
    }

    if (isLiabilitiesTotal(label)) {
      zobowiazania = readPeriodsFromRow(cols, columnMap);
      continue;
    }
  }

  kapitalWlasny = fillMissingEquity(
    aktywaRazem,
    kapitalWlasny,
    zobowiazania
  );

  return {
    aktywaRazem,
    kapitalWlasny,
    zobowiazania,
  };
}