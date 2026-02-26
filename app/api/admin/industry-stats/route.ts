export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const INDUSTRY_LABELS: Record<string, string> = {
  manufacturing: "Produkcja",
  it: "Technologie / IT",
  retail: "Handel",
  services: "Usługi",
  construction: "Budownictwo",
};

export async function GET() {
  try {
    const snap = await adminDb
      .collection("reports")
      .where("status", "==", "ready")
      .get();

    const counts: Record<string, number> = {};

    snap.forEach((doc) => {
      const data = doc.data() as any;
      const industry = data.industry ?? "unknown";

      if (!counts[industry]) {
        counts[industry] = 0;
      }

      counts[industry]++;
    });

    const result = Object.entries(counts).map(([key, value]) => ({
      key,
      label: INDUSTRY_LABELS[key] ?? key,
      count: value,
    }));

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Industry stats error:", e);
    return NextResponse.json(
      { error: "Failed to load industry stats" },
      { status: 500 }
    );
  }
}