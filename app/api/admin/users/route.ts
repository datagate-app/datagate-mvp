import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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
 * GET /api/admin/users?uid=...
 * - zwraca listę userów
 * - dodaje reportsCount
 * - dodaje createdAt
 * - bierze disabled z Firebase Auth jako źródło prawdy
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

    const usersSnap = await adminDb.collection("users").get();
    const reportsSnap = await adminDb.collection("reports").get();

    const reportsCountMap: Record<string, number> = {};

    for (const r of reportsSnap.docs) {
      const ownerId = r.data().ownerId;
      if (!ownerId) continue;
      reportsCountMap[ownerId] = (reportsCountMap[ownerId] || 0) + 1;
    }

    const users = await Promise.all(
      usersSnap.docs.map(async (u) => {
        const data = u.data();

        let authDisabled = !!data.disabled;
        let authCreatedAt: string | null = null;

        try {
          const authUser = await adminAuth.getUser(u.id);
          authDisabled = !!authUser.disabled;
          authCreatedAt = authUser.metadata.creationTime || null;
        } catch (error) {
          console.warn(`Nie udało się pobrać usera z Auth: ${u.id}`, error);
        }

        return {
          uid: u.id,
          email: data.email ?? "",
          role: data.role ?? "user",
          disabled: authDisabled,
          createdAt:
            formatCreatedAt(data.createdAt) ??
            authCreatedAt,
          reportsCount: reportsCountMap[u.id] ?? 0,
        };
      })
    );

    users.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

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

    if (adminUid === targetUid && action === "delete-user") {
      return NextResponse.json(
        { error: "Nie możesz usunąć własnego konta z poziomu panelu admina." },
        { status: 400 }
      );
    }

    if (action === "toggle-disable") {
      const userRef = adminDb.collection("users").doc(targetUid);
      const snap = await userRef.get();

      if (!snap.exists) {
        return NextResponse.json(
          { error: "User nie istnieje w Firestore." },
          { status: 404 }
        );
      }

      const authUser = await adminAuth.getUser(targetUid);
      const nextDisabled = !authUser.disabled;

      await adminAuth.updateUser(targetUid, {
        disabled: nextDisabled,
      });

      await userRef.set(
        {
          disabled: nextDisabled,
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        disabled: nextDisabled,
      });
    }

    if (action === "delete-user") {
      const reportsSnap = await adminDb
        .collection("reports")
        .where("ownerId", "==", targetUid)
        .get();

      const batch = adminDb.batch();

      for (const r of reportsSnap.docs) {
        batch.delete(r.ref);
      }

      await batch.commit();

      await adminDb.collection("users").doc(targetUid).delete();

      try {
        await adminAuth.deleteUser(targetUid);
      } catch (error) {
        console.error("Błąd usuwania usera z Firebase Auth:", error);
        return NextResponse.json(
          {
            error:
              "Usunięto dane w Firestore, ale nie udało się usunąć konta z Firebase Auth.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (err) {
    console.error("ADMIN USERS PATCH ERROR:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}