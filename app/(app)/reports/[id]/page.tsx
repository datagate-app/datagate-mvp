"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import ReportView from "../components/ReportView";

type Metrics = any;

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
  industry?: string;
};

export default function ReportPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // DEBUG: pokaże status i body odpowiedzi z API (np. 404/403/500)
  const [apiDebug, setApiDebug] = useState<any>(null);

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

        // 1) FULL REPORT
        const res = await fetch(`/api/reports/${reportId}?ownerId=${user.uid}`);
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

        // 2) BENCHMARK
        setBenchmarkLoading(true);

        const bRes = await fetch(
          `/api/reports/${reportId}/benchmark?period=t0&limit=200`
        );
        const bText = await bRes.text();

        if (!bRes.ok) {
          if (!cancelled) {
            setApiDebug((prev: any) => ({
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
      } catch (e: any) {
        if (cancelled) return;
        setApiDebug({
          step: "catch",
          error: e?.message ?? String(e),
        });
        setReport(null);
        setBenchmark(null);
        setLoading(false);
      } finally {
        if (!cancelled) setBenchmarkLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [reportId]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />;
  }

  // DEBUG VIEW (zawsze pokaże dlaczego nie ma reportu)
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
        <p className="font-semibold">Raport pobrany, ale brak pola metrics (debug)</p>
        <p>reportId: {String(reportId)}</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-gray-100 p-3 text-xs">
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <ReportView
      metrics={report.metrics}
      industry={report.industry}
      reportName={report.name}
      benchmark={benchmark}
      benchmarkLoading={benchmarkLoading}
    />
  );
}