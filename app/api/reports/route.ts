export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseBilansCsv } from "@/lib/parser/parseBilansCsv";
import { calculateMetrics } from "@/lib/parser/calculateMetrics";

/** =======================
 *  Simple in-memory cache
 *  ======================= */
type CacheEntry = { ts: number; data: any };
const __reportsCache: Map<string, CacheEntry> =
  (globalThis as any).__reportsCache ??
  ((globalThis as any).__reportsCache = new Map<string, CacheEntry>());

const CACHE_TTL_MS = 15_000; // 15s MVP shield

/** =======================
 *  Quota cooldown (MVP shield)
 *  ======================= */
const __quotaCooldown: { until: number; lastDetails?: string } =
  (globalThis as any).__quotaCooldown ??
  ((globalThis as any).__quotaCooldown = { until: 0, lastDetails: "" });

const QUOTA_COOLDOWN_MS = 60_000; // 60s

function isQuotaError(err: any) {
  const msg = String(err?.details || err?.message || "").toLowerCase();
  return msg.includes("quota") || msg.includes("resource_exhausted");
}

function quotaResponse(extra?: { details?: string }) {
  const retryAfterMs = Math.max(0, __quotaCooldown.until - Date.now());
  return NextResponse.json(
    {
      error: "Quota exceeded",
      hint:
        "Przekroczono limit Firestore (plan darmowy / zbyt dużo odczytów). Spróbuj ponownie za chwilę.",
      retryAfterMs,
      details: extra?.details ?? __quotaCooldown.lastDetails ?? null,
    },
    { status: 429 }
  );
}

//
// POST → create report
//
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type");

    // 🔹 DEMO JSON MODE
    if (contentType?.includes("application/json")) {
      const body = await req.json();
      const { ownerId, name, industry, metrics } = body;

      if (!ownerId || !metrics) {
        return NextResponse.json({ error: "Brak danych" }, { status: 400 });
      }

      const docRef = await adminDb.collection("reports").add({
        name: name || "Raport z demo",
        ownerId,
        industry: industry || null,
        status: "ready",
        createdAt: new Date(),
        metrics,
      });

      // invalidate cache for this user
      __reportsCache.delete(ownerId);

      return NextResponse.json({
        id: docRef.id,
        name: name || "Raport z demo",
        status: "ready",
      });
    }

    // 🔹 CSV MODE
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ownerId = formData.get("ownerId") as string | null;
    const industry = formData.get("industry") as string | null;

    if (!file || !ownerId) {
      return NextResponse.json(
        { error: "Brak pliku lub ownerId" },
        { status: 400 }
      );
    }

    // MVP: wymagamy csv
    const fileName = file.name || "Nowy raport";
    const isCsv =
      file.type === "text/csv" || fileName.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      return NextResponse.json(
        { error: "Nieprawidłowy format. Wgraj plik CSV." },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const bilansValues = parseBilansCsv(csvText);
    const metrics = calculateMetrics(bilansValues);

    const docRef = await adminDb.collection("reports").add({
      name: fileName,
      ownerId,
      industry: industry || null,
      status: "ready",
      createdAt: new Date(),
      metrics,
    });

    // invalidate cache for this user
    __reportsCache.delete(ownerId);

    return NextResponse.json({
      id: docRef.id,
      name: fileName,
      status: "ready",
    });
  } catch (err: any) {
    console.error("POST reports error:", err);

    if (isQuotaError(err)) {
      __quotaCooldown.until = Date.now() + QUOTA_COOLDOWN_MS;
      __quotaCooldown.lastDetails =
        err?.details || err?.message || String(err);

      return quotaResponse({ details: __quotaCooldown.lastDetails });
    }

    return NextResponse.json(
      {
        error: "Błąd zapisu raportu",
        details: err?.details || err?.message || String(err),
        code: err?.code ?? null,
      },
      { status: 500 }
    );
  }
}

//
// GET → fetch reports for user
//
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json([]);
    }

    // ✅ jeśli quota trzyma → nie dotykamy Firestore
    if (Date.now() < __quotaCooldown.until) {
      return quotaResponse();
    }

    // ✅ cache hit (MVP shield)
    const cached = __reportsCache.get(ownerId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const snap = await adminDb
      .collection("reports")
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const reports = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ set cache
    __reportsCache.set(ownerId, { ts: Date.now(), data: reports });

    return NextResponse.json(reports);
  } catch (err: any) {
    console.error("GET reports error:", err);

    if (isQuotaError(err)) {
      __quotaCooldown.until = Date.now() + QUOTA_COOLDOWN_MS;
      __quotaCooldown.lastDetails =
        err?.details || err?.message || String(err);

      return quotaResponse({ details: __quotaCooldown.lastDetails });
    }

    return NextResponse.json(
      {
        error: "GET reports failed",
        details: err?.details || err?.message || String(err),
        code: err?.code ?? null,
      },
      { status: 500 }
    );
  }
}