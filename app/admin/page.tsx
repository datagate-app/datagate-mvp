"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type AdminUserRow = {
  uid: string;
  email: string;
  role: string;
  disabled: boolean;
  reportsCount: number;
};

type IndustryStat = {
  key: string;
  label: string;
  count: number;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStat[]>([]);
  const [meUid, setMeUid] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadUsers = async (uid: string) => {
    const headers = await getAuthHeaders();

    const res = await fetch(`/api/admin/users?uid=${uid}`, {
      headers,
    });

    if (!res.ok) {
      setDenied(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setUsers(data);
  };

  const loadIndustryStats = async () => {
    const headers = await getAuthHeaders();

    const res = await fetch("/api/admin/industry-stats", {
      headers,
    });

    if (!res.ok) return;

    const data = await res.json();
    setIndustryStats(data);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDenied(true);
        setLoading(false);
        return;
      }

      setMeUid(user.uid);

      // szybki check roli (UX)
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data()?.role !== "admin") {
        setDenied(true);
        setLoading(false);
        return;
      }

      await Promise.all([
        loadUsers(user.uid),
        loadIndustryStats()
      ]);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAction = async (
    targetUid: string,
    action: "toggle-disable" | "delete-user"
  ) => {
    if (!meUid) return;

    const headers = await getAuthHeaders();

    await fetch("/api/admin/users", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        adminUid: meUid,
        targetUid,
        action,
      }),
    });

    await loadUsers(meUid);
    await loadIndustryStats();
  };

  if (loading) return <p className="p-6">Ładowanie...</p>;
  if (denied) return <p className="p-6">Brak dostępu.</p>;

  return (
    <div className="space-y-6 p-6">

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Panel admina</h1>
        <p className="mt-1 text-sm text-gray-500">
          Zarządzanie userami i raportami (MVP)
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Raporty według branży
        </h2>

        {industryStats.length === 0 ? (
          <p className="text-sm text-gray-500">
            Brak danych branżowych.
          </p>
        ) : (
          <div className="space-y-2">
            {industryStats.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
              >
                <span>{item.label}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="divide-y">
          {users.map((u) => (
            <div key={u.uid} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-gray-900">{u.email}</p>
                <p className="text-xs text-gray-500">UID: {u.uid}</p>
                <p className="text-xs text-gray-500">Rola: {u.role}</p>
                <p className="text-xs text-gray-500">
                  Raporty: {u.reportsCount}
                </p>
                <p className="text-xs">
                  Status:{" "}
                  <span className={u.disabled ? "text-red-600" : "text-green-600"}>
                    {u.disabled ? "Zablokowany (flag)" : "Aktywny"}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(u.uid, "toggle-disable")}
                  className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  {u.disabled ? "Odblokuj" : "Zablokuj"}
                </button>

                <button
                  onClick={() => handleAction(u.uid, "delete-user")}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}