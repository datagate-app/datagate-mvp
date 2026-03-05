import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

async function verifyAdminByUid(uid: string) {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return false;
  return snap.data()?.role === "admin";
}

/**
 * GET /api/admin/users?uid=...
 * - zwraca listę userów
 * - dodaje reportsCount
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

    // pobierz userów
    const usersSnap = await adminDb.collection("users").get();

    // pobierz wszystkie raporty
    const reportsSnap = await adminDb.collection("reports").get();

    // policz raporty per ownerId
    const reportsCountMap: Record<string, number> = {};

    for (const r of reportsSnap.docs) {
      const ownerId = r.data().ownerId;
      if (!ownerId) continue;

      reportsCountMap[ownerId] = (reportsCountMap[ownerId] || 0) + 1;
    }

    const users: any[] = [];

    for (const u of usersSnap.docs) {
      const data = u.data();

      users.push({
        uid: u.id,
        email: data.email ?? "",
        role: data.role ?? "user",
        disabled: !!data.disabled,
        reportsCount: reportsCountMap[u.id] ?? 0,
      });
    }

    return NextResponse.json(users);
  } catch (err) {
    console.error("ADMIN USERS GET ERROR:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * body: { adminUid, targetUid, action }
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { adminUid, targetUid, action } = body ?? {};

    if (!adminUid || !targetUid || !action) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    const isAdmin = await verifyAdminByUid(adminUid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    if (action === "toggle-disable") {
      const userRef = adminDb.collection("users").doc(targetUid);
      const snap = await userRef.get();

      if (!snap.exists) {
        return NextResponse.json({ error: "User nie istnieje" }, { status: 404 });
      }

      const curr = snap.data() as any;

      await userRef.update({
        disabled: !curr.disabled,
      });

      return NextResponse.json({ success: true });
    }

    if (action === "delete-user") {
      const reportsSnap = await adminDb
        .collection("reports")
        .where("ownerId", "==", targetUid)
        .get();

      for (const r of reportsSnap.docs) {
        await r.ref.delete();
      }

      await adminDb.collection("users").doc(targetUid).delete();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (err) {
    console.error("ADMIN USERS PATCH ERROR:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}