import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

async function verifyAdminByUid(uid: string) {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return false;
  return snap.data()?.role === "admin";
}

function formatCreatedAt(value: any) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

/**
 * GET /api/admin/reports?uid=...
 * - lista raportów do panelu admina
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Brak UID" }, { status: 403 });
    }

    const isAdmin = await verifyAdminByUid(uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    const reportsSnap = await adminDb
      .collection("reports")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const reports = reportsSnap.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name ?? "Bez nazwy",
        ownerId: data.ownerId ?? "",
        industry: data.industry ?? "",
        status: data.status ?? "",
        inputMode: data.inputMode ?? "",
        createdAt: formatCreatedAt(data.createdAt),
      };
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("ADMIN REPORTS GET ERROR:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reports
 * body: { adminUid, reportId }
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { adminUid, reportId } = body ?? {};

    if (!adminUid || !reportId) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    const isAdmin = await verifyAdminByUid(adminUid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    const reportRef = adminDb.collection("reports").doc(reportId);
    const snap = await reportRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Raport nie istnieje" }, { status: 404 });
    }

    await reportRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN REPORTS DELETE ERROR:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}