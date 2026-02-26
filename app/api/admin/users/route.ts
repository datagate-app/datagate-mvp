import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

async function verifyAdminByUid(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  return snap.data()?.role === "admin";
}

/**
 * GET /api/admin/users?uid=...
 * - zwraca listę userów z kolekcji "users"
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

    const usersSnap = await getDocs(collection(db, "users"));
    const users = [];

    for (const u of usersSnap.docs) {
      const reportsSnap = await getDocs(
        query(collection(db, "reports"), where("ownerId", "==", u.id))
      );

      const data = u.data() as any;

      users.push({
        uid: u.id,
        email: data.email ?? "",
        role: data.role ?? "user",
        disabled: !!data.disabled,
        reportsCount: reportsSnap.size,
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
      const userRef = doc(db, "users", targetUid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        return NextResponse.json({ error: "User nie istnieje" }, { status: 404 });
      }

      const curr = snap.data() as any;
      await updateDoc(userRef, { disabled: !curr.disabled });

      return NextResponse.json({ success: true });
    }

    if (action === "delete-user") {
      // usuń raporty usera
      const reportsSnap = await getDocs(
        query(collection(db, "reports"), where("ownerId", "==", targetUid))
      );

      for (const r of reportsSnap.docs) {
        await deleteDoc(r.ref);
      }

      // usuń doc usera
      await deleteDoc(doc(db, "users", targetUid));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (err) {
    console.error("ADMIN USERS PATCH ERROR:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}