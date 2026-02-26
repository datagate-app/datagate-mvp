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

function toNumber(value: string) {
  return (
    Number(
      value
        .replace(/\s/g, "")
        .replace(",", ".")
    ) || 0
  );
}

function detectDelimiter(firstLine: string) {
  if (firstLine.includes(";")) return ";";
  if (firstLine.includes(",")) return ",";
  return ";";
}

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

function readPeriods(cols: string[]): PeriodValues {
  return {
    tMinus2: toNumber(cols[3] || ""),
    tMinus1: toNumber(cols[4] || ""),
    t0: toNumber(cols[5] || ""),
    t1: toNumber(cols[6] || ""),
    t2: toNumber(cols[7] || ""),
    t3: toNumber(cols[8] || ""),
    t4: toNumber(cols[9] || ""),
    t5: toNumber(cols[10] || ""),
    t6: toNumber(cols[11] || ""),
  };
}

export function parseBilansCsv(csv: string): BilansValues {
  const lines = csv.trim().split(/\r?\n/);

  const delimiter = detectDelimiter(lines[0]);

  let aktywaRazem = emptyPeriods();
  let kapitalWlasny = emptyPeriods();
  let zobowiazania = emptyPeriods();

  for (const line of lines) {
    const cols = line.split(delimiter);

    const label = cols[1]?.trim() || "";

    if (label.includes("RAZEM AKTYWA")) {
      aktywaRazem = readPeriods(cols);
    }

    if (label.includes("KAPITAŁ")) {
      kapitalWlasny = readPeriods(cols);
    }

    if (label.includes("ZOBOWIĄZANIA I REZERWY")) {
      zobowiazania = readPeriods(cols);
    }
  }

  return {
    aktywaRazem,
    kapitalWlasny,
    zobowiazania,
  };
}
