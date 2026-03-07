"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import type { Metrics } from "@/lib/types/metrics";

const INDUSTRIES = [
  { value: "manufacturing", label: "Produkcja" },
  { value: "it", label: "IT" },
  { value: "retail", label: "Handel" },
  { value: "services", label: "Usługi" },
  { value: "construction", label: "Budownictwo" },
] as const;

type DemoReportFormProps = {
  reportName: string;
  onReportNameChange: (value: string) => void;
  industry: string;
  onIndustryChange: (value: string) => void;
  assets: string;
  onAssetsChange: (value: string) => void;
  equity: string;
  onEquityChange: (value: string) => void;
};

export default function DemoReportForm({
  reportName,
  onReportNameChange,
  industry,
  onIndustryChange,
  assets,
  onAssetsChange,
  equity,
  onEquityChange,
}: DemoReportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    const user = auth.currentUser;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const assetsNumber = Number(assets);
    const equityNumber = Number(equity);

    if (!assetsNumber || assetsNumber <= 0) {
      alert("Podaj poprawną wartość aktywów.");
      return;
    }

    if (!equityNumber || equityNumber <= 0) {
      alert("Podaj poprawną wartość kapitału własnego.");
      return;
    }

    if (equityNumber > assetsNumber) {
      alert("Kapitał własny nie może być większy niż aktywa.");
      return;
    }

    setLoading(true);

    try {
      const liabilities = assetsNumber - equityNumber;

      const debtRatio = liabilities / assetsNumber;
      const equityRatio = equityNumber / assetsNumber;
      const leverage = assetsNumber / equityNumber;
      const debtToEquity = liabilities / equityNumber;
      const solvencyRatio =
        liabilities === 0 ? null : assetsNumber / liabilities;

      const metrics: Metrics = {
        tMinus2: {},
        tMinus1: {},
        t0: {
          aktywaRazem: assetsNumber,
          kapitalWlasny: equityNumber,
          zobowiazania: liabilities,
          debtRatio,
          equityRatio,
          leverage,
          debtToEquity,
          solvencyRatio: solvencyRatio ?? undefined,
        },
        t1: {},
        t2: {},
        t3: {},
        t4: {},
        t5: {},
        t6: {},
      };

      const token = await user.getIdToken(true);

      const finalReportName = reportName.trim() || "Raport demo";

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: finalReportName,
          industry,
          metrics,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Błąd zapisu raportu.");
      }

      router.push(`/reports/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Wystąpił błąd podczas zapisu raportu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Demo danych</h2>
        <p className="mt-2 text-sm text-gray-600">
          Szybka ścieżka do wygenerowania przykładowego raportu. Dodaj nazwę,
          wybierz branżę i wpisz podstawowe dane.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Nazwa raportu
          </label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => onReportNameChange(e.target.value)}
            placeholder="np. Raport testowy Q4 2025"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
          />
          <p className="mt-1 text-xs text-gray-400">
            Jeśli zostawisz puste, zapisze się jako „Raport demo”.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Branża</label>
          <select
            value={industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
          >
            {INDUSTRIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-dashed bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Tryb demo</p>
          <p className="mt-1 text-sm text-gray-600">
            Na podstawie aktywów i kapitału własnego wyliczymy zobowiązania i
            podstawowe wskaźniki finansowe dla okresu t0.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Aktywa razem (w tys. zł)
          </label>
          <input
            type="number"
            value={assets}
            onChange={(e) => onAssetsChange(e.target.value)}
            placeholder="np. 1000"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Kapitał własny (w tys. zł)
          </label>
          <input
            type="number"
            value={equity}
            onChange={(e) => onEquityChange(e.target.value)}
            placeholder="np. 500"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className={`rounded-lg px-5 py-2.5 font-medium text-white ${
            loading ? "bg-gray-400" : "bg-black hover:bg-gray-800"
          }`}
        >
          {loading ? "Generowanie..." : "Generuj raport"}
        </button>
      </div>
    </section>
  );
}