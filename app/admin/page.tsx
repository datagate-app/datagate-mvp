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
  createdAt: string | null;
};

type IndustryStat = {
  key: string;
  label: string;
  count: number;
};

type AdminReportRow = {
  id: string;
  name: string;
  ownerId: string;
  industry: string;
  status: string;
  inputMode: string;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStat[]>([]);
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [meUid, setMeUid] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      cache: "no-store",
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
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    setIndustryStats(data);
  };

  const loadReports = async (uid: string) => {
    const headers = await getAuthHeaders();

    const res = await fetch(`/api/admin/reports?uid=${uid}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    setReports(data);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDenied(true);
        setLoading(false);
        return;
      }

      setMeUid(user.uid);

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data()?.role !== "admin") {
        setDenied(true);
        setLoading(false);
        return;
      }

      await Promise.all([
        loadUsers(user.uid),
        loadIndustryStats(),
        loadReports(user.uid),
      ]);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const refreshAll = async () => {
    if (!meUid) return;

    await Promise.all([
      loadUsers(meUid),
      loadIndustryStats(),
      loadReports(meUid),
    ]);
  };

  const handleUserAction = async (
    targetUid: string,
    action: "toggle-disable" | "delete-user"
  ) => {
    if (!meUid) return;

    const confirmText =
      action === "delete-user"
        ? "Na pewno usunąć użytkownika wraz z jego raportami i kontem Firebase Auth?"
        : "Na pewno zmienić status blokady użytkownika?";

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(`${action}:${targetUid}`);

      const headers = await getAuthHeaders();

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          adminUid: meUid,
          targetUid,
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Operacja nie powiodła się.");
      }

      await refreshAll();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Wystąpił błąd.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!meUid) return;
    if (!window.confirm("Na pewno usunąć ten raport?")) return;

    try {
      setActionLoading(`delete-report:${reportId}`);

      const headers = await getAuthHeaders();

      const res = await fetch("/api/admin/reports", {
        method: "DELETE",
        headers,
        body: JSON.stringify({
          adminUid: meUid,
          reportId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Nie udało się usunąć raportu.");
      }

      await refreshAll();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Wystąpił błąd.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p className="p-6">Ładowanie...</p>;
  if (denied) return <p className="p-6">Brak dostępu.</p>;

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Panel admina</h1>
        <p className="mt-1 text-sm text-gray-500">
          Zarządzanie użytkownikami, raportami i statystykami systemu.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Raporty według branży</h2>

        {industryStats.length === 0 ? (
          <p className="text-sm text-gray-500">Brak danych branżowych.</p>
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Użytkownicy</h2>
          <span className="text-sm text-gray-500">Łącznie: {users.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">UID</th>
                <th className="px-3 py-3">Rola</th>
                <th className="px-3 py-3">Utworzono</th>
                <th className="px-3 py-3">Raporty</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isBusy =
                  actionLoading === `toggle-disable:${u.uid}` ||
                  actionLoading === `delete-user:${u.uid}`;

                return (
                  <tr key={u.uid} className="border-b align-top">
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {u.email || "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{u.uid}</td>
                    <td className="px-3 py-3">{u.role}</td>
                    <td className="px-3 py-3">{formatDate(u.createdAt)}</td>
                    <td className="px-3 py-3">{u.reportsCount}</td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          u.disabled ? "text-red-600 font-medium" : "text-green-600 font-medium"
                        }
                      >
                        {u.disabled ? "Zablokowany" : "Aktywny"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUserAction(u.uid, "toggle-disable")}
                          disabled={isBusy}
                          className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          {u.disabled ? "Odblokuj" : "Zablokuj"}
                        </button>

                        <button
                          onClick={() => handleUserAction(u.uid, "delete-user")}
                          disabled={isBusy || meUid === u.uid}
                          className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Raporty</h2>
          <span className="text-sm text-gray-500">Łącznie: {reports.length}</span>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">Brak raportów.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-3 py-3">Nazwa</th>
                  <th className="px-3 py-3">Owner UID</th>
                  <th className="px-3 py-3">Branża</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Tryb</th>
                  <th className="px-3 py-3">Utworzono</th>
                  <th className="px-3 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const isBusy = actionLoading === `delete-report:${report.id}`;

                  return (
                    <tr key={report.id} className="border-b align-top">
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {report.name || "Bez nazwy"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {report.ownerId || "—"}
                      </td>
                      <td className="px-3 py-3">{report.industry || "—"}</td>
                      <td className="px-3 py-3">{report.status || "—"}</td>
                      <td className="px-3 py-3">{report.inputMode || "—"}</td>
                      <td className="px-3 py-3">{formatDate(report.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            disabled={isBusy}
                            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Usuń raport
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}