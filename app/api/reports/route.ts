export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { parseBilansCsv, type BilansValues } from "@/lib/parser/parseBilansCsv";
import {
  mapRzisValuesToIncomeStatementData,
  parseRzisCsv,
} from "@/lib/parser/parseRzisCsv";
import {
  calculateCombinedMetrics,
  calculateIncomeMetrics,
  calculateMetrics,
} from "@/lib/parser/calculateMetrics";

/* =====================================================
   AUTH HELPER
===================================================== */

async function verifyAuth(req: Request): Promise<string> {
  const authHeader =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  console.log("AUTH HEADER:", authHeader ? "present" : "missing");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Authorization header missing or invalid");
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    console.log("Token verified UID:", decoded.uid);

    return decoded.uid;
  } catch (err) {
    console.error("verifyIdToken failed:", err);
    throw new Error("Unauthorized");
  }
}

/* =====================================================
   SIMPLE CACHE (MVP SHIELD)
===================================================== */

type CacheEntry = {
  ts: number;
  data: any;
};

const __reportsCache: Map<string, CacheEntry> =
  (globalThis as any).__reportsCache ??
  ((globalThis as any).__reportsCache = new Map());

const CACHE_TTL_MS = 15000;

/* =====================================================
   QUOTA COOLDOWN
===================================================== */

const __quotaCooldown: { until: number; lastDetails?: string } =
  (globalThis as any).__quotaCooldown ??
  ((globalThis as any).__quotaCooldown = { until: 0 });

const QUOTA_COOLDOWN_MS = 60000;

function isQuotaError(err: any) {
  const msg = String(err?.details || err?.message || "").toLowerCase();
  return msg.includes("quota") || msg.includes("resource_exhausted");
}

function quotaResponse(extra?: { details?: string }) {
  const retryAfterMs = Math.max(0, __quotaCooldown.until - Date.now());

  return NextResponse.json(
    {
      error: "Quota exceeded",
      retryAfterMs,
      details: extra?.details ?? __quotaCooldown.lastDetails ?? null,
    },
    { status: 429 }
  );
}

/* =====================================================
   HELPERS
===================================================== */

const BALANCE_PERIOD_KEYS = [
  "tMinus2",
  "tMinus1",
  "t0",
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
] as const;

type BalancePeriodKey = (typeof BALANCE_PERIOD_KEYS)[number];

const BALANCE_PERIOD_LABELS: Record<BalancePeriodKey, string> = {
  tMinus2: "t-2",
  tMinus1: "t-1",
  t0: "t0",
  t1: "t+1",
  t2: "t+2",
  t3: "t+3",
  t4: "t+4",
  t5: "t+5",
  t6: "t+6",
};

const BALANCE_EPSILON = 0.01;

function normalizeReportName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  return trimmed || fallback;
}

function isCsvFile(file: File | null) {
  if (!file) return false;

  const fileName = file.name || "";

  return (
    file.type === "text/csv" ||
    fileName.toLowerCase().endsWith(".csv")
  );
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isPeriodRecord(value: unknown): value is Record<BalancePeriodKey, number> {
  if (!value || typeof value !== "object") return false;

  return BALANCE_PERIOD_KEYS.every((key) => key in (value as Record<string, unknown>));
}

function isBilansValues(value: unknown): value is BilansValues {
  if (!value || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;

  return (
    isPeriodRecord(obj.aktywaRazem) &&
    isPeriodRecord(obj.kapitalWlasny) &&
    isPeriodRecord(obj.zobowiazania)
  );
}

function validateBalancedSheet(data: BilansValues) {
  const invalidPeriods: Array<{
    period: BalancePeriodKey;
    assets: number;
    equity: number;
    liabilities: number;
    expectedLiabilitiesAndEquity: number;
    difference: number;
  }> = [];

  for (const period of BALANCE_PERIOD_KEYS) {
    const assets = safeNumber(data.aktywaRazem?.[period]);
    const equity = safeNumber(data.kapitalWlasny?.[period]);
    const liabilities = safeNumber(data.zobowiazania?.[period]);
    const liabilitiesAndEquity = equity + liabilities;
    const difference = assets - liabilitiesAndEquity;

    if (Math.abs(difference) > BALANCE_EPSILON) {
      invalidPeriods.push({
        period,
        assets,
        equity,
        liabilities,
        expectedLiabilitiesAndEquity: liabilitiesAndEquity,
        difference,
      });
    }
  }

  return {
    isValid: invalidPeriods.length === 0,
    invalidPeriods,
  };
}

function buildBalanceValidationError(data: BilansValues) {
  const validation = validateBalancedSheet(data);

  if (validation.isValid) {
    return null;
  }

  const details = validation.invalidPeriods
    .map((item) => {
      const label = BALANCE_PERIOD_LABELS[item.period];
      return `${label}: aktywa=${item.assets}, pasywa=${item.expectedLiabilitiesAndEquity}, różnica=${item.difference}`;
    })
    .join(" | ");

  return {
    error: "Bilans nie jest zbilansowany. Aktywa muszą być równe sumie kapitału własnego i zobowiązań.",
    details,
    invalidPeriods: validation.invalidPeriods.map((item) => ({
      period: item.period,
      periodLabel: BALANCE_PERIOD_LABELS[item.period],
      assets: item.assets,
      equity: item.equity,
      liabilities: item.liabilities,
      liabilitiesAndEquity: item.expectedLiabilitiesAndEquity,
      difference: item.difference,
    })),
  };
}

/* =====================================================
   POST → CREATE REPORT
===================================================== */

export async function POST(req: Request) {
  try {
    const uid = await verifyAuth(req);

    const contentType = req.headers.get("content-type") || "";

    /* ---------------- JSON MODE (DEMO / MANUAL ONLINE) ---------------- */

    if (contentType.includes("application/json")) {
      const body = await req.json();

      const {
        name,
        industry,
        metrics,
        rawBalanceData,
        incomeStatementData,
        incomeMetrics,
        combinedMetrics,
        inputMode,
      } = body ?? {};

      if (!metrics || typeof metrics !== "object") {
        return NextResponse.json(
          { error: "Brak poprawnych danych metrics." },
          { status: 400 }
        );
      }

      if (rawBalanceData !== undefined) {
        if (!isBilansValues(rawBalanceData)) {
          return NextResponse.json(
            {
              error:
                "Nieprawidłowe rawBalanceData. Oczekiwano aktywaRazem, kapitalWlasny i zobowiazania dla wszystkich okresów.",
            },
            { status: 400 }
          );
        }

        const balanceError = buildBalanceValidationError(rawBalanceData);

        if (balanceError) {
          return NextResponse.json(balanceError, { status: 400 });
        }
      }

      const finalName = normalizeReportName(name, "Raport");

      const payload: Record<string, any> = {
        name: finalName,
        ownerId: uid,
        industry: industry || null,
        status: "ready",
        createdAt: new Date(),
        metrics,
      };

      if (rawBalanceData && typeof rawBalanceData === "object") {
        payload.rawBalanceData = rawBalanceData;
      }

      if (incomeStatementData && typeof incomeStatementData === "object") {
        payload.incomeStatementData = incomeStatementData;
      }

      if (incomeMetrics && typeof incomeMetrics === "object") {
        payload.incomeMetrics = incomeMetrics;
      }

      if (combinedMetrics && typeof combinedMetrics === "object") {
        payload.combinedMetrics = combinedMetrics;
      }

      if (typeof inputMode === "string" && inputMode.trim()) {
        payload.inputMode = inputMode.trim();
      }

      const docRef = await adminDb.collection("reports").add(payload);

      __reportsCache.delete(uid);

      return NextResponse.json({
        id: docRef.id,
        name: finalName,
        status: "ready",
      });
    }

    /* ---------------- FILE IMPORT MODE ---------------- */

    const formData = await req.formData();

    const balanceFile = (formData.get("balanceFile") as File | null) ??
      (formData.get("file") as File | null);

    const incomeStatementFile =
      (formData.get("incomeStatementFile") as File | null) ??
      (formData.get("rzisFile") as File | null);

    const industry = formData.get("industry") as string | null;
    const customName = formData.get("name");
    const inputMode = formData.get("inputMode");

    if (!balanceFile && !incomeStatementFile) {
      return NextResponse.json(
        { error: "Brak plików do importu." },
        { status: 400 }
      );
    }

    if (balanceFile && !isCsvFile(balanceFile)) {
      return NextResponse.json(
        { error: "Nieprawidłowy format pliku bilansu. Wgraj CSV." },
        { status: 400 }
      );
    }

    if (incomeStatementFile && !isCsvFile(incomeStatementFile)) {
      return NextResponse.json(
        { error: "Nieprawidłowy format pliku RZiS. Wgraj CSV." },
        { status: 400 }
      );
    }

    const baseFileName =
      balanceFile?.name ||
      incomeStatementFile?.name ||
      "Nowy raport";

    const finalName = normalizeReportName(
      customName,
      baseFileName.replace(/\.[^/.]+$/, "")
    );

    const payload: Record<string, any> = {
      name: finalName,
      ownerId: uid,
      industry: industry || null,
      status: "ready",
      createdAt: new Date(),
    };

    let balanceMetrics: ReturnType<typeof calculateMetrics> | null = null;
    let incomeMetricsResult: ReturnType<typeof calculateIncomeMetrics> | null =
      null;

    /* -------- bilans -------- */

    if (balanceFile) {
      const balanceCsvText = await balanceFile.text();
      console.log("UPLOADED BALANCE FILE NAME:", balanceFile.name);
console.log("UPLOADED BALANCE CSV PREVIEW:", balanceCsvText.slice(0, 1200));

      if (!balanceCsvText.trim()) {
        return NextResponse.json(
          { error: "Plik bilansu jest pusty." },
          { status: 400 }
        );
      }

      const bilansValues = parseBilansCsv(balanceCsvText);
      console.log("PARSED BILANS VALUES:", JSON.stringify(bilansValues, null, 2));
      const balanceError = buildBalanceValidationError(bilansValues);
      console.log("BALANCE VALIDATION RESULT:", balanceError);

      if (balanceError) {
        return NextResponse.json(balanceError, { status: 400 });
      }

      balanceMetrics = calculateMetrics(bilansValues);

      payload.metrics = balanceMetrics;
      payload.rawBalanceData = bilansValues;
    }

    /* -------- RZiS -------- */

    if (incomeStatementFile) {
      const incomeCsvText = await incomeStatementFile.text();

      if (!incomeCsvText.trim()) {
        return NextResponse.json(
          { error: "Plik RZiS jest pusty." },
          { status: 400 }
        );
      }

      const rzisValues = parseRzisCsv(incomeCsvText);
      const incomeStatementData =
        mapRzisValuesToIncomeStatementData(rzisValues);

      incomeMetricsResult = calculateIncomeMetrics(incomeStatementData);

      payload.incomeStatementData = incomeStatementData;
      payload.incomeMetrics = incomeMetricsResult;
    }

    /* -------- analiza łączona -------- */

    if (balanceMetrics && incomeMetricsResult) {
      payload.combinedMetrics = calculateCombinedMetrics({
        bilans: balanceMetrics,
        income: incomeMetricsResult,
      });
    }

    if (typeof inputMode === "string" && inputMode.trim()) {
      payload.inputMode = inputMode.trim();
    } else if (balanceFile && incomeStatementFile) {
      payload.inputMode = "import_csv_balance_rzis";
    } else if (balanceFile) {
      payload.inputMode = "import_csv_balance";
    } else {
      payload.inputMode = "import_csv_rzis";
    }

    const docRef = await adminDb.collection("reports").add(payload);

    __reportsCache.delete(uid);

    return NextResponse.json({
      id: docRef.id,
      name: finalName,
      status: "ready",
      hasBalance: Boolean(balanceFile),
      hasIncomeStatement: Boolean(incomeStatementFile),
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("POST reports error:", err);

    if (isQuotaError(err)) {
      __quotaCooldown.until = Date.now() + QUOTA_COOLDOWN_MS;

      __quotaCooldown.lastDetails =
        err?.details || err?.message || String(err);

      return quotaResponse({
        details: __quotaCooldown.lastDetails,
      });
    }

    return NextResponse.json(
      {
        error: "Błąd zapisu raportu",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

/* =====================================================
   GET → FETCH REPORTS
===================================================== */

export async function GET(req: Request) {
  try {
    const uid = await verifyAuth(req);

    if (Date.now() < __quotaCooldown.until) {
      return quotaResponse();
    }

    const cached = __reportsCache.get(uid);

    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const snap = await adminDb
      .collection("reports")
      .where("ownerId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const reports = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    __reportsCache.set(uid, {
      ts: Date.now(),
      data: reports,
    });

    return NextResponse.json(reports);
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("GET reports error:", err);

    return NextResponse.json(
      {
        error: "GET reports failed",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}