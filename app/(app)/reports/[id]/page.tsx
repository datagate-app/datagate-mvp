"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import ReportView from "../components/ReportView";
import { downloadReportPdf } from "@/lib/pdf/downloadReportPdf";
import type {
  CombinedMetrics,
  IncomeMetrics,
  Metrics,
} from "@/lib/types/metrics";

type BenchmarkResponse = {
  industry: string;
  period: string;
  n: number;
  stats: Record<
    string,
    { n: number; p25: number | null; p50: number | null; p75: number | null }
  >;
  unavailable?: boolean;
  reason?: string;
};

type Report = {
  id: string;
  name: string;
  metrics?: Metrics;
  incomeMetrics?: IncomeMetrics;
  combinedMetrics?: CombinedMetrics;
  incomeStatementData?: Record<string, unknown>;
  rawBalanceData?: Record<string, unknown>;
  industry?: string;
  inputMode?: string;
};

export default function ReportPage() {
  const params = useParams();
  const reportIdRaw = params?.id;
  const reportId =
    typeof reportIdRaw === "string"
      ? reportIdRaw
      : Array.isArray(reportIdRaw)
      ? reportIdRaw[0]
      : undefined;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string>("");

  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  const [apiDebug, setApiDebug] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!reportId) return;

    let cancelled = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          if (!cancelled) {
            setLoading(false);
            setReport(null);
            setBenchmark(null);
            setApiDebug({ info: "No user (not logged in)" });
          }
          return;
        }

        setLoading(true);
        setApiDebug(null);

        const token = await user.getIdToken();

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
            setBenchmark(null);
            setLoading(false);
          }
          return;
        }

        const full = JSON.parse(text) as Report;

        if (cancelled) return;

        setReport(full);
        setLoading(false);

        setBenchmarkLoading(true);

        const bRes = await fetch(
          `/api/reports/${reportId}/benchmark?period=t0&limit=200`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const bText = await bRes.text();

        if (!bRes.ok) {
          if (!cancelled) {
            setApiDebug((prev) => ({
              ...(prev ?? {}),
              benchmark: {
                step: "GET /api/reports/[id]/benchmark",
                status: bRes.status,
                body: bText,
              },
            }));
            setBenchmark(null);
          }
          return;
        }

        const bData = JSON.parse(bText) as BenchmarkResponse;

        if (cancelled) return;

        setBenchmark(bData ?? null);
      } catch (e: unknown) {
        if (cancelled) return;

        setApiDebug({
          step: "catch",
          error: e instanceof Error ? e.message : String(e),
        });

        setReport(null);
        setBenchmark(null);
        setLoading(false);
      } finally {
        if (!cancelled) {
          setBenchmarkLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [reportId]);

  async function handleDownloadPdf() {
    const currentReportId = reportId;

    if (!currentReportId || !report?.metrics) return;

    try {
      setDownloadingPdf(true);
      setPdfError("");

      await downloadReportPdf({
        reportId: currentReportId,
        reportName: report.name,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udało się pobrać PDF.";

      console.error("Błąd generowania PDF:", error);
      setPdfError(message);
      alert(message);
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />;
  }

  if (!report) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-semibold">Brak danych raportu (debug)</p>
        <p>reportId: {String(reportId)}</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-gray-100 p-3 text-xs">
          {JSON.stringify(apiDebug, null, 2)}
        </pre>
      </div>
    );
  }

  if (!report.metrics) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-semibold">
          Raport pobrany, ale brak pola metrics (debug)
        </p>
        <p>reportId: {String(reportId)}</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-gray-100 p-3 text-xs">
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="dg-btn dg-btn-primary"
        >
          {downloadingPdf ? "Generowanie PDF..." : "Pobierz PDF"}
        </button>

        {pdfError ? (
          <p className="max-w-xl text-right text-sm text-red-600">{pdfError}</p>
        ) : null}
      </div>

      <div className="bg-white">
        <ReportView
          metrics={report.metrics}
          incomeMetrics={report.incomeMetrics}
          combinedMetrics={report.combinedMetrics}
          industry={report.industry}
          reportName={report.name}
          benchmark={benchmark}
          benchmarkLoading={benchmarkLoading}
        />
      </div>
    </div>
  );
}
