"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type Report = {
  id: string;
  name: string;
  date?: string;
  status?: "processing" | "ready";
};

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // ✅ blokuje podwójny fetch w dev / strict mode
  const didFetchRef = useRef(false);

  // ✅ antyspam na ręczne odświeżanie
  const lastManualRefreshRef = useRef<number>(0);

  const fetchReports = useCallback(async (ownerId: string, signal?: AbortSignal) => {
    setError("");

    const res = await fetch(`/api/reports?ownerId=${ownerId}`, {
      cache: "no-store",
      signal,
    });

    // quota / throttling
    if (res.status === 429) {
      const data = await res.json().catch(() => null);
      setError(
        data?.hint ||
          "Przekroczono limit zapytań (quota). Odśwież za chwilę."
      );
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        data?.details ||
          data?.error ||
          "Nie udało się pobrać raportów. Spróbuj odświeżyć."
      );
      return;
    }

    const data = await res.json().catch(() => []);
    setReports(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid(null);
        setReports([]);
        setLoading(false);
        return;
      }

      setUid(user.uid);

      // ✅ ważne: tylko 1 fetch na mount (dev strict mode potrafi odpalić callback 2x)
      if (didFetchRef.current) {
        setLoading(false);
        return;
      }
      didFetchRef.current = true;

      setLoading(true);
      try {
        await fetchReports(user.uid, controller.signal);
      } catch (e: any) {
        // jeśli abort – ignorujemy
        if (e?.name !== "AbortError") {
          setError("Błąd połączenia. Spróbuj ponownie.");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      controller.abort();
      unsub();
    };
  }, [fetchReports]);

  const hasReports = reports.length > 0;

  const handleRefresh = async () => {
    if (!uid) return;

    // ✅ blokada: nie pozwól klikać 20x/sek
    const now = Date.now();
    if (now - lastManualRefreshRef.current < 2000) return;
    lastManualRefreshRef.current = now;

    setLoading(true);
    try {
      await fetchReports(uid);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-2 text-gray-600">Twoje wygenerowane raporty</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Wygeneruj raport z własnych danych
            </Link>

            <Link
              href="/reports/demo"
              className="rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Zobacz przykładowy raport
            </Link>

            <Link
              href="/upload"
              className="rounded-lg px-4 py-2 text-white"
              style={{ backgroundColor: "#0d1a34" }}
            >
              Dodaj raport
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg border px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
              disabled={!uid}
              title="Odśwież listę raportów"
            >
              Odśwież
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {!hasReports && !error && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold">Brak raportów</h2>
          <p className="mt-2 text-gray-600">
            Możesz wygenerować raport z własnych danych,
            <br />
            sprawdzić demo lub wgrać plik CSV.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Wygeneruj raport
            </Link>

            <Link
              href="/reports/demo"
              className="rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Zobacz demo
            </Link>

            <Link
              href="/upload"
              className="rounded-lg px-4 py-2 text-white"
              style={{ backgroundColor: "#0d1a34" }}
            >
              Dodaj raport
            </Link>
          </div>
        </div>
      )}

      {/* REPORT LIST */}
      {hasReports && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="divide-y">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center justify-between px-2 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>

                  {report.status === "processing" && (
                    <p className="text-xs text-orange-500">Analiza w toku...</p>
                  )}

                  {report.status === "ready" && (
                    <p className="text-xs text-green-600">Gotowy</p>
                  )}
                </div>

                <span className="text-sm text-gray-500">{report.date}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}