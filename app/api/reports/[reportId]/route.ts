export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/verifyAuth";

export async function GET(
  req: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    const uid = await verifyAuth(req);

    const { reportId } = await context.params;

    console.log("REPORT ID:", reportId);
    console.log("USER UID:", uid);

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

    // sprawdzamy czy raport należy do użytkownika
    if (data.ownerId !== uid) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: snap.id,
      ...data,
    });

  } catch (e: any) {
    console.error("GET report error:", e);

    if (e?.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to load report",
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}