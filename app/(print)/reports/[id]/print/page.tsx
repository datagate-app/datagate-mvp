"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useSearchParams } from "next/navigation";
import type {
  CombinedMetrics,
  IncomeMetrics,
  Metrics,
} from "@/lib/types/metrics";
import ReportPrintView from "@/app/(app)/reports/components/ReportPrintView";

type Report = {
  id: string;
  name: string;
  metrics?: Metrics;
  incomeMetrics?: IncomeMetrics;
  combinedMetrics?: CombinedMetrics;
  industry?: string;
};

declare global {
  interface Window {
    __PRINT_READY__?: boolean;
  }
}

export default function PrintReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const reportIdRaw = params?.id;
  const reportId = Array.isArray(reportIdRaw) ? reportIdRaw[0] : reportIdRaw;

  const tokenFromQuery = searchParams.get("token") ?? "";
  const hideToolbar =
    searchParams.get("hideToolbar") === "1" ||
    searchParams.get("pdf") === "1";
  const autoPrint = searchParams.get("autoprint") === "1";

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDebug, setApiDebug] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    window.__PRINT_READY__ = false;
  }, []);

  useEffect(() => {
    if (!reportId) return;

    let cancelled = false;
    let unsub: (() => void) | undefined;

    async function loadReport(token: string) {
      try {
        setLoading(true);
        setApiDebug(null);

        const res = await fetch(`/api/reports/${reportId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const text = await res.text();

        if (!res.ok) {
          if (!cancelled) {
            setApiDebug({
              step: "GET /api/reports/[id]",
              status: res.status,
              body: text,
            });
            setReport(null);
            setLoading(false);
          }
          return;
        }

        const data = JSON.parse(text) as Report;

        if (!cancelled) {
          setReport(data);
          setLoading(false);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setApiDebug({
            step: "catch",
            error: error instanceof Error ? error.message : String(error),
          });
          setReport(null);
          setLoading(false);
        }
      }
    }

    if (tokenFromQuery) {
      loadReport(tokenFromQuery);
    } else {
      unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          if (!cancelled) {
            setLoading(false);
            setReport(null);
            setApiDebug({ info: "No user (not logged in)" });
          }
          return;
        }

        const token = await user.getIdToken();
        await loadReport(token);
      });
    }

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [reportId, tokenFromQuery]);

  useEffect(() => {
    if (!loading && report?.metrics) {
      window.__PRINT_READY__ = true;

      if (autoPrint) {
        const timeout = window.setTimeout(() => {
          window.print();
        }, 300);

        return () => window.clearTimeout(timeout);
      }
    }

    return;
  }, [loading, report, autoPrint]);

  if (loading) {
    return <div className="p-6 text-sm">Ładowanie wersji do druku...</div>;
  }

  if (!report || !report.metrics) {
    return (
      <div className="space-y-2 p-6 text-sm">
        <p className="font-semibold">Brak danych raportu (print debug)</p>
        <p>reportId: {String(reportId)}</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-gray-100 p-3 text-xs">
          {JSON.stringify(apiDebug ?? report, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {!hideToolbar ? (
        <div className="no-print sticky top-0 z-10 border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Wersja do druku / PDF
              </h1>
              <p className="text-sm text-slate-500">
                Użyj Ctrl+P i wybierz „Zapisz jako PDF”.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Drukuj / Zapisz jako PDF
            </button>
          </div>
        </div>
      ) : null}

      <ReportPrintView
        reportName={report.name}
        industry={report.industry}
        metrics={report.metrics}
        incomeMetrics={report.incomeMetrics}
        combinedMetrics={report.combinedMetrics}
      />
    </div>
  );
}