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

function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 0 1-8.66 3.42l-1.42 1.42A7 7 0 1 0 17.65 6.35z" />
    </svg>
  );
}

function initials(name: string) {
  const parts = name
    .replace(/\.[^/.]+$/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "DG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function statusBadge(status?: Report["status"]) {
  if (status === "processing") {
    return <span className="dg-badge dg-badge-yellow">W toku</span>;
  }

  if (status === "ready") {
    return <span className="dg-badge dg-badge-green">Gotowy</span>;
  }

  return <span className="dg-badge dg-badge-gray">Brak statusu</span>;
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const didFetchRef = useRef(false);
  const lastManualRefreshRef = useRef<number>(0);

  const fetchReports = useCallback(
    async (ownerId: string, signal?: AbortSignal) => {
      setError("");

      const user = auth.currentUser;
      if (!user) {
        setError("Brak autoryzacji.");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`/api/reports?ownerId=${ownerId}`, {
        cache: "no-store",
        signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    },
    []
  );

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

      if (didFetchRef.current) {
        setLoading(false);
        return;
      }

      didFetchRef.current = true;

      setLoading(true);
      try {
        await fetchReports(user.uid, controller.signal);
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
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

  const handleRefresh = async () => {
    if (!uid) return;

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

  const readyCount = reports.filter((report) => report.status === "ready").length;
  const processingCount = reports.filter(
    (report) => report.status === "processing"
  ).length;
  const latestReport = reports[0];
  const hasReports = reports.length > 0;

  const email = auth.currentUser?.email;
  const userName = email ? email.split("@")[0] : "DataGate";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-[var(--dg-radius)] bg-[var(--dg-gray-200)]" />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="h-28 animate-pulse rounded-[var(--dg-radius)] bg-[var(--dg-gray-200)]" />
          <div className="h-28 animate-pulse rounded-[var(--dg-radius)] bg-[var(--dg-gray-200)]" />
          <div className="h-28 animate-pulse rounded-[var(--dg-radius)] bg-[var(--dg-gray-200)]" />
          <div className="h-28 animate-pulse rounded-[var(--dg-radius)] bg-[var(--dg-gray-200)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="dg-welcome">
        <div className="relative z-10">
          <h1 className="text-lg font-bold">Dzień dobry, {userName}</h1>
          <p className="mt-1 text-[13px] text-white/60">
            Masz {reports.length} raportów w DataGate. {processingCount > 0
              ? `${processingCount} jest jeszcze w trakcie analizy.`
              : "Wszystkie pobrane raporty są gotowe do przeglądu."}
          </p>

          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <div className="text-xl font-bold">{reports.length}</div>
              <div className="text-[11px] text-white/40">Raporty łącznie</div>
            </div>
            <div>
              <div className="text-xl font-bold">{readyCount}</div>
              <div className="text-[11px] text-white/40">Gotowe</div>
            </div>
            <div>
              <div className="text-xl font-bold">{processingCount}</div>
              <div className="text-[11px] text-white/40">W toku</div>
            </div>
            <div>
              <div className="text-xl font-bold">
                {latestReport?.date ?? "—"}
              </div>
              <div className="text-[11px] text-white/40">Ostatnia analiza</div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[var(--dg-radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="dg-kpi-card dg-kpi-blue">
          <div className="dg-kpi-label">
            <span className="h-3.5 w-3.5">
              <IconFile />
            </span>
            Liczba raportów
          </div>
          <div className="dg-kpi-value">{reports.length}</div>
          <div className="dg-kpi-change">Wszystkie zapisane analizy</div>
        </div>

        <div className="dg-kpi-card dg-kpi-green">
          <div className="dg-kpi-label">Gotowe raporty</div>
          <div className="dg-kpi-value">{readyCount}</div>
          <div className="dg-kpi-change dg-kpi-change-up">
            Dostępne do otwarcia
          </div>
        </div>

        <div className="dg-kpi-card dg-kpi-yellow">
          <div className="dg-kpi-label">W toku</div>
          <div className="dg-kpi-value">{processingCount}</div>
          <div className="dg-kpi-change">Analizy przetwarzane</div>
        </div>

        <div className="dg-kpi-card dg-kpi-red">
          <div className="dg-kpi-label">Ostatni raport</div>
          <div className="truncate text-[22px] font-bold tracking-[-0.04em] text-[var(--dg-navy)]">
            {latestReport ? initials(latestReport.name) : "—"}
          </div>
          <div className="dg-kpi-change truncate">
            {latestReport?.name ?? "Brak raportów"}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="dg-card">
          <div className="dg-card-header flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--dg-navy)]">
                Ostatnie raporty
              </h2>
              <p className="mt-1 text-xs text-[var(--dg-gray-400)]">
                {reports.length} raportów w Twoim koncie
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!uid}
              className="dg-btn dg-btn-secondary"
              title="Odśwież listę raportów"
            >
              <span className="h-3.5 w-3.5">
                <IconRefresh />
              </span>
              Odśwież
            </button>
          </div>

          <div className="dg-card-body">
            {!hasReports && !error ? (
              <div className="rounded-[var(--dg-radius)] border border-dashed border-[var(--dg-gray-300)] bg-[var(--dg-gray-50)] p-8 text-center">
                <h3 className="text-base font-semibold text-[var(--dg-navy)]">
                  Brak raportów
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--dg-gray-500)]">
                  Utwórz pierwszy raport, wypełnij dane demo, ręczny bilans albo
                  zaimportuj pliki bilansu i RZiS.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/upload" className="dg-btn dg-btn-primary">
                    Utwórz raport
                  </Link>
                  <Link href="/reports/demo" className="dg-btn dg-btn-secondary">
                    Zobacz przykład
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="dg-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Raport</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Akcja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="dg-company-logo">
                              {initials(report.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold">
                                {report.name}
                              </div>
                              <div className="text-xs text-[var(--dg-gray-400)]">
                                DataGate Analyze
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{statusBadge(report.status)}</td>
                        <td className="text-[var(--dg-gray-500)]">
                          {report.date ?? "—"}
                        </td>
                        <td>
                          <Link
                            href={`/reports/${report.id}`}
                            className="dg-btn dg-btn-secondary px-3 py-2"
                          >
                            Otwórz
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="dg-card">
            <div className="dg-card-header">
              <h2 className="text-sm font-semibold text-[var(--dg-navy)]">
                Szybkie akcje
              </h2>
            </div>
            <div className="dg-card-body grid gap-3">
              <Link href="/upload" className="dg-card dg-card-hover p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--dg-radius-sm)] bg-sky-50 text-[var(--dg-teal)]">
                    <span className="h-5 w-5">
                      <IconPlus />
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--dg-navy)]">
                      Utwórz raport
                    </span>
                    <span className="mt-1 block text-xs text-[var(--dg-gray-400)]">
                      Demo, bilans online albo import CSV
                    </span>
                  </span>
                </div>
              </Link>

              <Link href="/upload" className="dg-card dg-card-hover p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--dg-radius-sm)] bg-blue-50 text-[var(--dg-blue)]">
                    <span className="h-5 w-5">
                      <IconCloud />
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--dg-navy)]">
                      Wgraj pliki
                    </span>
                    <span className="mt-1 block text-xs text-[var(--dg-gray-400)]">
                      Bilans i RZiS z szablonów DataGate
                    </span>
                  </span>
                </div>
              </Link>

              <Link href="/reports/demo" className="dg-card dg-card-hover p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--dg-radius-sm)] bg-emerald-50 text-[var(--dg-green)]">
                    <span className="h-5 w-5">
                      <IconFile />
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--dg-navy)]">
                      Przykładowy raport
                    </span>
                    <span className="mt-1 block text-xs text-[var(--dg-gray-400)]">
                      Zobacz pełny widok analizy
                    </span>
                  </span>
                </div>
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
