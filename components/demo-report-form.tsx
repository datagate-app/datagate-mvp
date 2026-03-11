"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import type {
  CombinedMetrics,
  IncomeMetrics,
  IncomeStatementData,
  Metrics,
  PeriodKey,
} from "@/lib/types/metrics";
import {
  calculateCombinedMetrics,
  calculateIncomeMetrics,
} from "@/lib/parser/calculateMetrics";

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

const PERIOD_KEYS: PeriodKey[] = [
  "tMinus2",
  "tMinus1",
  "t0",
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
];

function emptyMetrics(): Metrics {
  return {
    tMinus2: {},
    tMinus1: {},
    t0: {},
    t1: {},
    t2: {},
    t3: {},
    t4: {},
    t5: {},
    t6: {},
  };
}

function emptyIncomeStatementData(): IncomeStatementData {
  return {
    tMinus2: {},
    tMinus1: {},
    t0: {},
    t1: {},
    t2: {},
    t3: {},
    t4: {},
    t5: {},
    t6: {},
  };
}

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

  const [revenue, setRevenue] = useState("");
  const [operatingCosts, setOperatingCosts] = useState("");
  const [operatingProfit, setOperatingProfit] = useState("");
  const [grossProfit, setGrossProfit] = useState("");
  const [netProfit, setNetProfit] = useState("");

  async function handleGenerate() {
    const user = auth.currentUser;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const assetsNumber = Number(assets);
    const equityNumber = Number(equity);
    const revenueNumber = Number(revenue);
    const operatingCostsNumber = Number(operatingCosts);
    const operatingProfitNumber = Number(operatingProfit);
    const grossProfitNumber = Number(grossProfit);
    const netProfitNumber = Number(netProfit);

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

    if (!revenueNumber || revenueNumber <= 0) {
      alert("Podaj poprawną wartość przychodów.");
      return;
    }

    if (!operatingCosts && operatingCostsNumber !== 0) {
      alert("Podaj poprawną wartość kosztów operacyjnych.");
      return;
    }

    if (!operatingProfit && operatingProfitNumber !== 0) {
      alert("Podaj poprawną wartość wyniku operacyjnego.");
      return;
    }

    if (!grossProfit && grossProfitNumber !== 0) {
      alert("Podaj poprawną wartość wyniku brutto.");
      return;
    }

    if (!netProfit && netProfitNumber !== 0) {
      alert("Podaj poprawną wartość wyniku netto.");
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
        liabilities === 0 ? undefined : assetsNumber / liabilities;

      const metrics: Metrics = emptyMetrics();
      metrics.t0 = {
        aktywaRazem: assetsNumber,
        kapitalWlasny: equityNumber,
        zobowiazania: liabilities,
        debtRatio,
        equityRatio,
        leverage,
        debtToEquity,
        solvencyRatio,
      };

      const incomeStatementData: IncomeStatementData =
        emptyIncomeStatementData();

      incomeStatementData.t0 = {
        przychodyNettoZeSprzedazy: revenueNumber,
        kosztyDzialalnosciOperacyjnej: operatingCostsNumber,
        zyskStrataZDzialalnosciOperacyjnej: operatingProfitNumber,
        zyskStrataBrutto: grossProfitNumber,
        zyskStrataNetto: netProfitNumber,
      };

      const incomeMetrics: IncomeMetrics =
        calculateIncomeMetrics(incomeStatementData);

      const combinedMetrics: CombinedMetrics = calculateCombinedMetrics({
        bilans: metrics,
        income: incomeMetrics,
      });

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
          incomeStatementData,
          incomeMetrics,
          combinedMetrics,
          inputMode: "demo",
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
          Szybka ścieżka do wygenerowania przykładowego raportu. Dodaj dane
          bilansu i uproszczone dane RZiS dla okresu t0.
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
            Na podstawie bilansu i uproszczonego RZiS policzymy podstawowe
            wskaźniki finansowe, rentowność oraz analizę łączną dla okresu t0.
          </p>
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">Bilans — t0</p>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
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
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">RZiS — t0</p>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Przychody netto ze sprzedaży (w tys. zł)
              </label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="np. 1500"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Koszty działalności operacyjnej (w tys. zł)
              </label>
              <input
                type="number"
                value={operatingCosts}
                onChange={(e) => setOperatingCosts(e.target.value)}
                placeholder="np. 1200"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Wynik operacyjny (w tys. zł)
              </label>
              <input
                type="number"
                value={operatingProfit}
                onChange={(e) => setOperatingProfit(e.target.value)}
                placeholder="np. 220"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Wynik brutto (w tys. zł)
              </label>
              <input
                type="number"
                value={grossProfit}
                onChange={(e) => setGrossProfit(e.target.value)}
                placeholder="np. 210"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Wynik netto (w tys. zł)
              </label>
              <input
                type="number"
                value={netProfit}
                onChange={(e) => setNetProfit(e.target.value)}
                placeholder="np. 170"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              />
            </div>
          </div>
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