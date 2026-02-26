export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await context.params;

    console.log("REPORT ID:", reportId);

    const url = new URL(req.url);
    const ownerId = url.searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { error: "Missing ownerId" },
        { status: 400 }
      );
    }

    if (!reportId) {
      return NextResponse.json(
        { error: "Missing reportId" },
        { status: 400 }
      );
    }

    const snap = await adminDb
      .collection("reports")
      .doc(reportId)
      .get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const data = snap.data() as any;

    if (data.ownerId !== ownerId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ id: snap.id, ...data });
  } catch (e: any) {
    console.error("GET report error:", e);
    return NextResponse.json(
      { error: "Failed to load report", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}