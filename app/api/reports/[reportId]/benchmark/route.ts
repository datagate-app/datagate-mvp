export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { PeriodKey, Metrics } from "@/lib/types/metrics";
import type { BenchmarkResponse, MetricKey } from "@/lib/types/benchmark";
import { summarize } from "@/lib/utils/benchmark";

const METRIC_KEYS: MetricKey[] = [
  "debtRatio",
  "equityRatio",
  "leverage",
  "debtToEquity",
  "solvencyRatio",
];

function isPeriodKey(x: string): x is PeriodKey {
  return [
    "tMinus2",
    "tMinus1",
    "t0",
    "t1",
    "t2",
    "t3",
    "t4",
    "t5",
    "t6",
  ].includes(x);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await context.params;

    if (!reportId) {
      return NextResponse.json(
        { error: "Missing reportId" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const periodParam = url.searchParams.get("period") ?? "t0";
    const limitParam = Number(url.searchParams.get("limit") ?? "200");

    if (!isPeriodKey(periodParam)) {
      return NextResponse.json(
        { error: "Invalid period" },
        { status: 400 }
      );
    }

    const period: PeriodKey = periodParam;
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 20), 500)
      : 200;

    // 1️⃣ raport bazowy
    const reportSnap = await adminDb
      .collection("reports")
      .doc(reportId)
      .get();

    if (!reportSnap.exists) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const base = reportSnap.data() as any;
    const industry = base.industry as string | undefined;
    const baseOwnerId = base.ownerId as string | undefined;

    if (!industry) {
      return NextResponse.json(
        { error: "Report has no industry" },
        { status: 400 }
      );
    }

    // 🔎 sprawdzamy rolę właściciela raportu
    let requesterRole = "user";

    if (baseOwnerId) {
      const ownerSnap = await adminDb
        .collection("users")
        .doc(baseOwnerId)
        .get();

      requesterRole = ownerSnap.data()?.role ?? "user";
    }

    console.log("🧠 requesterRole:", requesterRole);

    // 2️⃣ raporty tej samej branży
    const qSnap = await adminDb
      .collection("reports")
      .where("industry", "==", industry)
      .where("status", "==", "ready")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    console.log("📊 TOTAL REPORTS IN QUERY:", qSnap.size);

    const buckets: Record<MetricKey, number[]> = {
      debtRatio: [],
      equityRatio: [],
      leverage: [],
      debtToEquity: [],
      solvencyRatio: [],
    };

    let skippedSameOwner = 0;
    let skippedNoMetrics = 0;

    qSnap.forEach((doc) => {
      const d = doc.data() as any;

      // 👇 tylko jeśli NIE admin, wykluczamy własne raporty
      if (
        requesterRole !== "admin" &&
        baseOwnerId &&
        d.ownerId === baseOwnerId
      ) {
        skippedSameOwner++;
        return;
      }

      const metrics = d.metrics as Metrics | undefined;

      if (!metrics?.[period]) {
        skippedNoMetrics++;
        return;
      }

      for (const key of METRIC_KEYS) {
        const v = metrics[period]?.[key];
        if (typeof v === "number" && Number.isFinite(v)) {
          buckets[key].push(v);
        }
      }
    });

    console.log("⛔ skippedSameOwner:", skippedSameOwner);
    console.log("⛔ skippedNoMetrics:", skippedNoMetrics);

    console.log("📦 BUCKET SIZES:", {
      debtRatio: buckets.debtRatio.length,
      equityRatio: buckets.equityRatio.length,
      leverage: buckets.leverage.length,
      debtToEquity: buckets.debtToEquity.length,
      solvencyRatio: buckets.solvencyRatio.length,
    });

    const stats: BenchmarkResponse["stats"] = {
      debtRatio: summarize(buckets.debtRatio),
      equityRatio: summarize(buckets.equityRatio),
      leverage: summarize(buckets.leverage),
      debtToEquity: summarize(buckets.debtToEquity),
      solvencyRatio: summarize(buckets.solvencyRatio),
    };

    const n = Math.min(
      stats.debtRatio.n,
      stats.equityRatio.n,
      stats.leverage.n,
      stats.debtToEquity.n,
      stats.solvencyRatio.n
    );

    console.log("📉 FINAL N:", n);

    const MIN_N = 10;

    const res: BenchmarkResponse = {
      industry,
      period,
      n,
      stats,
      unavailable: n < MIN_N,
      reason:
        n < MIN_N
          ? "Za mało danych w branży do benchmarku"
          : undefined,
    };

    return NextResponse.json(res);
  } catch (e: any) {
    console.error("Benchmark error:", e);
    return NextResponse.json(
      { error: "Benchmark failed", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}