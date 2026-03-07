export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { parseBilansCsv } from "@/lib/parser/parseBilansCsv";
import { calculateMetrics } from "@/lib/parser/calculateMetrics";

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

function normalizeReportName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  return trimmed || fallback;
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
        inputMode,
      } = body ?? {};

      if (!metrics || typeof metrics !== "object") {
        return NextResponse.json(
          { error: "Brak poprawnych danych metrics." },
          { status: 400 }
        );
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

    const file = formData.get("file") as File | null;
    const industry = formData.get("industry") as string | null;
    const customName = formData.get("name");
    const inputMode = formData.get("inputMode");

    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku" },
        { status: 400 }
      );
    }

    const fileName = file.name || "Nowy raport";
    const finalName = normalizeReportName(
      customName,
      fileName.replace(/\.[^/.]+$/, "")
    );

    const isCsv =
      file.type === "text/csv" ||
      fileName.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      return NextResponse.json(
        { error: "Nieprawidłowy format. Wgraj CSV." },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "Plik jest pusty." },
        { status: 400 }
      );
    }

    const bilansValues = parseBilansCsv(csvText);
    const metrics = calculateMetrics(bilansValues);

    const payload: Record<string, any> = {
      name: finalName,
      ownerId: uid,
      industry: industry || null,
      status: "ready",
      createdAt: new Date(),
      metrics,
    };

    if (typeof inputMode === "string" && inputMode.trim()) {
      payload.inputMode = inputMode.trim();
    } else {
      payload.inputMode = "import_csv";
    }

    const docRef = await adminDb.collection("reports").add(payload);

    __reportsCache.delete(uid);

    return NextResponse.json({
      id: docRef.id,
      name: finalName,
      status: "ready",
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