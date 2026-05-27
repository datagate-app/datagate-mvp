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

const PERIOD_MULTIPLIERS: Record<PeriodKey, number> = {
  tMinus2: 0.78,
  tMinus1: 0.89,
  t0: 1,
  t1: 1.08,
  t2: 1.17,
  t3: 1.27,
  t4: 1.38,
  t5: 1.5,
  t6: 1.63,
};

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

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildDemoBalanceMetrics(
  assetsBase: number,
  equityBase: number
): Metrics {
  const metrics = emptyMetrics();
  const baseEquityRatio = clamp(equityBase / assetsBase, 0.2, 0.85);

  PERIOD_KEYS.forEach((period, index) => {
    const multiplier = PERIOD_MULTIPLIERS[period];
    const assetsValue = round2(assetsBase * multiplier);

    const equityRatioShift = (index - 2) * 0.01;
    const equityRatio = clamp(baseEquityRatio + equityRatioShift, 0.22, 0.82);

    const equityValue = round2(assetsValue * equityRatio);
    const liabilitiesValue = round2(assetsValue - equityValue);

    const debtRatio = liabilitiesValue / assetsValue;
    const leverage = equityValue === 0 ? 0 : assetsValue / equityValue;
    const debtToEquity = equityValue === 0 ? 0 : liabilitiesValue / equityValue;
    const solvencyRatio =
      liabilitiesValue === 0 ? 0 : assetsValue / liabilitiesValue;

    const receivables = round2(assetsValue * 0.16);
    const inventory = round2(assetsValue * 0.12);

    metrics[period] = {
      aktywaRazem: assetsValue,
      kapitalWlasny: equityValue,
      zobowiazania: liabilitiesValue,
      debtRatio: round2(debtRatio),
      equityRatio: round2(equityRatio),
      leverage: round2(leverage),
      debtToEquity: round2(debtToEquity),
      solvencyRatio: round2(solvencyRatio),
      naleznosciKrotkoterminowe: receivables,
      zapasy: inventory,
    };
  });

  return metrics;
}

function buildDemoIncomeStatementData(args: {
  revenueBase: number;
  operatingCostsBase: number;
  operatingProfitBase: number;
  grossProfitBase: number;
  netProfitBase: number;
}): IncomeStatementData {
  const {
    revenueBase,
    operatingCostsBase,
    operatingProfitBase,
    grossProfitBase,
    netProfitBase,
  } = args;

  const data = emptyIncomeStatementData();

  const baseOperatingMargin =
    revenueBase > 0
      ? operatingProfitBase / revenueBase
      : 0.12;

  const baseNetMargin =
    revenueBase > 0
      ? netProfitBase / revenueBase
      : 0.08;

  PERIOD_KEYS.forEach((period, index) => {
    const multiplier = PERIOD_MULTIPLIERS[period];
    const revenueValue = round2(revenueBase * multiplier);

    const operatingMargin = clamp(
      baseOperatingMargin + (index - 2) * 0.005,
      0.04,
      0.35
    );

    const netMargin = clamp(
      baseNetMargin + (index - 2) * 0.004,
      0.02,
      0.25
    );

    const operatingProfitValue = round2(revenueValue * operatingMargin);
    const operatingCostsValue = round2(revenueValue - operatingProfitValue);

    const grossProfitMargin = clamp(operatingMargin - 0.01, 0.03, 0.3);
    const grossProfitValue =
      grossProfitBase || grossProfitBase === 0
        ? round2(revenueValue * grossProfitMargin)
        : round2(operatingProfitValue * 0.96);

    const netProfitValue = round2(revenueValue * netMargin);

    data[period] = {
      przychodyNettoZeSprzedazy: revenueValue,
      kosztyDzialalnosciOperacyjnej: operatingCostsValue,
      zyskStrataZDzialalnosciOperacyjnej: operatingProfitValue,
      zyskStrataBrutto: grossProfitValue,
      zyskStrataNetto: netProfitValue,
    };
  });

  return data;
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

  function fillSampleData() {
    if (!reportName.trim()) {
      onReportNameChange("Raport demo DataGate");
    }

    if (!industry) {
      onIndustryChange("manufacturing");
    }

    onAssetsChange("2440");
    onEquityChange("1440");

    setRevenue("3200");
    setOperatingCosts("2780");
    setOperatingProfit("420");
    setGrossProfit("390");
    setNetProfit("310");
  }

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
      const metrics: Metrics = buildDemoBalanceMetrics(
        assetsNumber,
        equityNumber
      );

      const incomeStatementData: IncomeStatementData =
        buildDemoIncomeStatementData({
          revenueBase: revenueNumber,
          operatingCostsBase: operatingCostsNumber,
          operatingProfitBase: operatingProfitNumber,
          grossProfitBase: grossProfitNumber,
          netProfitBase: netProfitNumber,
        });

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
    <section className="dg-card">
      <div className="dg-card-body md:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--dg-navy)]">Demo danych</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--dg-gray-500)]">
          Szybka ścieżka do wygenerowania przykładowego raportu. Dodaj dane
          bilansu i uproszczone dane RZiS, a system zbuduje demo dla wszystkich
          okresów od t-2 do t+6.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="dg-label">
            Nazwa raportu
          </label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => onReportNameChange(e.target.value)}
            placeholder="np. Raport testowy Q4 2025"
            className="dg-input"
          />
          <p className="mt-1 text-xs text-[var(--dg-gray-400)]">
            Jeśli zostawisz puste, zapisze się jako „Raport demo”.
          </p>
        </div>

        <div>
          <label className="dg-label">Branża</label>
          <select
            value={industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="dg-select"
          >
            {INDUSTRIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[var(--dg-radius)] border border-dashed border-[var(--dg-gray-300)] bg-[var(--dg-gray-50)] p-4">
          <p className="text-sm font-medium text-[var(--dg-navy)]">Tryb demo</p>
          <p className="mt-1 text-sm leading-6 text-[var(--dg-gray-500)]">
            Na podstawie wartości bazowych dla t0 system wygeneruje przykładowe
            dane historyczne i prognozowane, aby raport był pełny także dla
            RZiS i analizy łącznej.
          </p>
        </div>

        <div className="md:col-span-2 rounded-[var(--dg-radius)] border border-[var(--dg-gray-200)] p-4">
          <p className="text-sm font-semibold text-[var(--dg-navy)]">Bilans — baza t0</p>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="dg-label">
                Aktywa razem (w tys. zł)
              </label>
              <input
                type="number"
                value={assets}
                onChange={(e) => onAssetsChange(e.target.value)}
                placeholder="np. 2440"
                className="dg-input"
              />
            </div>

            <div>
              <label className="dg-label">
                Kapitał własny (w tys. zł)
              </label>
              <input
                type="number"
                value={equity}
                onChange={(e) => onEquityChange(e.target.value)}
                placeholder="np. 1440"
                className="dg-input"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-[var(--dg-radius)] border border-[var(--dg-gray-200)] p-4">
          <p className="text-sm font-semibold text-[var(--dg-navy)]">RZiS — baza t0</p>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="dg-label">
                Przychody netto ze sprzedaży (w tys. zł)
              </label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="np. 3200"
                className="dg-input"
              />
            </div>

            <div>
              <label className="dg-label">
                Koszty działalności operacyjnej (w tys. zł)
              </label>
              <input
                type="number"
                value={operatingCosts}
                onChange={(e) => setOperatingCosts(e.target.value)}
                placeholder="np. 2780"
                className="dg-input"
              />
            </div>

            <div>
              <label className="dg-label">
                Wynik operacyjny (w tys. zł)
              </label>
              <input
                type="number"
                value={operatingProfit}
                onChange={(e) => setOperatingProfit(e.target.value)}
                placeholder="np. 420"
                className="dg-input"
              />
            </div>

            <div>
              <label className="dg-label">
                Wynik brutto (w tys. zł)
              </label>
              <input
                type="number"
                value={grossProfit}
                onChange={(e) => setGrossProfit(e.target.value)}
                placeholder="np. 390"
                className="dg-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="dg-label">
                Wynik netto (w tys. zł)
              </label>
              <input
                type="number"
                value={netProfit}
                onChange={(e) => setNetProfit(e.target.value)}
                placeholder="np. 310"
                className="dg-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={fillSampleData}
          disabled={loading}
          className="dg-btn dg-btn-secondary px-5 py-3"
        >
          Wstaw przykładowe dane
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="dg-btn dg-btn-primary px-5 py-3"
        >
          {loading ? "Generowanie..." : "Generuj raport"}
        </button>
      </div>
      </div>
    </section>
  );
}
