"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import type { Metrics } from "@/lib/types/metrics";

const PERIODS = ["t-2", "t-1", "t0", "t1", "t2", "t3", "t4", "t5", "t6"] as const;

type PeriodKey = (typeof PERIODS)[number];

type MetricsPeriodKey =
  | "tMinus2"
  | "tMinus1"
  | "t0"
  | "t1"
  | "t2"
  | "t3"
  | "t4"
  | "t5"
  | "t6";

type BalanceRow = {
  key: string;
  label: string;
  section: "assets" | "equity" | "liabilities";
};

const BALANCE_ROWS: BalanceRow[] = [
  {
    key: "wartosci_niematerialne_i_prawne",
    label: "Wartości niematerialne i prawne",
    section: "assets",
  },
  {
    key: "rzeczowe_aktywa_trwale",
    label: "Rzeczowe aktywa trwałe",
    section: "assets",
  },
  {
    key: "naleznosci_dlugo_terminowe",
    label: "Należności długoterminowe",
    section: "assets",
  },
  {
    key: "inwestycje_dlugo_terminowe",
    label: "Inwestycje długoterminowe",
    section: "assets",
  },
  {
    key: "zapasy",
    label: "Zapasy",
    section: "assets",
  },
  {
    key: "naleznosci_krotko_terminowe",
    label: "Należności krótkoterminowe",
    section: "assets",
  },
  {
    key: "inwestycje_krotko_terminowe",
    label: "Inwestycje krótkoterminowe",
    section: "assets",
  },
  {
    key: "krotko_terminowe_rozliczenia_miedzyokresowe",
    label: "Krótkoterminowe rozliczenia międzyokresowe",
    section: "assets",
  },

  {
    key: "kapital_podstawowy",
    label: "Kapitał podstawowy",
    section: "equity",
  },
  {
    key: "kapital_zapasowy",
    label: "Kapitał zapasowy",
    section: "equity",
  },
  {
    key: "kapital_z_aktualizacji_wyceny",
    label: "Kapitał z aktualizacji wyceny",
    section: "equity",
  },
  {
    key: "pozostale_kapitaly_rezerwowe",
    label: "Pozostałe kapitały rezerwowe",
    section: "equity",
  },
  {
    key: "zysk_strata_z_lat_ubieglych",
    label: "Zysk / strata z lat ubiegłych",
    section: "equity",
  },
  {
    key: "zysk_strata_netto",
    label: "Zysk / strata netto",
    section: "equity",
  },

  {
    key: "rezerwy_na_zobowiazania",
    label: "Rezerwy na zobowiązania",
    section: "liabilities",
  },
  {
    key: "zobowiazania_dlugo_terminowe",
    label: "Zobowiązania długoterminowe",
    section: "liabilities",
  },
  {
    key: "zobowiazania_krotko_terminowe",
    label: "Zobowiązania krótkoterminowe",
    section: "liabilities",
  },
  {
    key: "rozliczenia_miedzyokresowe",
    label: "Rozliczenia międzyokresowe",
    section: "liabilities",
  },
];

type ManualBalanceFormProps = {
  reportName: string;
  onReportNameChange: (value: string) => void;
  industry: string;
  onIndustryChange: (value: string) => void;
};

type BalanceValues = Record<string, Record<PeriodKey, string>>;

function createInitialValues(): BalanceValues {
  const result: BalanceValues = {};

  for (const row of BALANCE_ROWS) {
    result[row.key] = {} as Record<PeriodKey, string>;

    for (const period of PERIODS) {
      result[row.key][period] = "";
    }
  }

  return result;
}

function parseNumericValue(value: string): number {
  if (!value.trim()) return 0;

  const normalized = value.replace(/\s/g, "").replace(/,/g, ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function hasAnyValue(value: string): boolean {
  return value.trim() !== "";
}

const PERIOD_TO_METRICS_KEY: Record<PeriodKey, MetricsPeriodKey> = {
  "t-2": "tMinus2",
  "t-1": "tMinus1",
  t0: "t0",
  t1: "t1",
  t2: "t2",
  t3: "t3",
  t4: "t4",
  t5: "t5",
  t6: "t6",
};

export default function ManualBalanceForm({
  reportName,
  onReportNameChange,
  industry,
  onIndustryChange,
}: ManualBalanceFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<BalanceValues>(() => createInitialValues());
  const [loading, setLoading] = useState(false);

  function updateCell(rowKey: string, period: PeriodKey, value: string) {
    setValues((prev) => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        [period]: value,
      },
    }));
  }

  const totals = useMemo(() => {
    const assets = {} as Record<PeriodKey, number>;
    const equity = {} as Record<PeriodKey, number>;
    const liabilities = {} as Record<PeriodKey, number>;
    const equityLiabilities = {} as Record<PeriodKey, number>;

    for (const period of PERIODS) {
      assets[period] = BALANCE_ROWS.filter((row) => row.section === "assets").reduce(
        (sum, row) => sum + parseNumericValue(values[row.key][period]),
        0
      );

      equity[period] = BALANCE_ROWS.filter((row) => row.section === "equity").reduce(
        (sum, row) => sum + parseNumericValue(values[row.key][period]),
        0
      );

      liabilities[period] = BALANCE_ROWS.filter((row) => row.section === "liabilities").reduce(
        (sum, row) => sum + parseNumericValue(values[row.key][period]),
        0
      );

      equityLiabilities[period] = equity[period] + liabilities[period];
    }

    return { assets, equity, liabilities, equityLiabilities };
  }, [values]);

  async function handleSubmit() {
    const user = auth.currentUser;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const filledPeriods = PERIODS.filter((period) =>
      BALANCE_ROWS.some((row) => hasAnyValue(values[row.key][period]))
    );

    if (filledPeriods.length === 0) {
      alert("Uzupełnij dane przynajmniej dla jednego okresu.");
      return;
    }

    if (!filledPeriods.includes("t0")) {
      alert("Na ten moment uzupełnij przynajmniej okres t0.");
      return;
    }

    for (const period of filledPeriods) {
      const assetsTotal = totals.assets[period];
      const equityTotal = totals.equity[period];
      const liabilitiesTotal = totals.liabilities[period];
      const equityLiabilitiesTotal = totals.equityLiabilities[period];

      if (assetsTotal <= 0) {
        alert(`Okres ${period}: aktywa razem muszą być większe od zera.`);
        return;
      }

      if (equityTotal < 0) {
        alert(`Okres ${period}: kapitał własny nie może być ujemny.`);
        return;
      }

      if (liabilitiesTotal < 0) {
        alert(`Okres ${period}: zobowiązania nie mogą być ujemne.`);
        return;
      }

      const difference = Math.abs(assetsTotal - equityLiabilitiesTotal);

      if (difference > 0.01) {
        alert(
          `Okres ${period}: bilans się nie zgadza. Aktywa razem (${assetsTotal.toLocaleString(
            "pl-PL"
          )}) muszą być równe kapitałowi własnemu i zobowiązaniom razem (${equityLiabilitiesTotal.toLocaleString(
            "pl-PL"
          )}).`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const metrics: Metrics = {
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

      for (const period of filledPeriods) {
        const metricsKey = PERIOD_TO_METRICS_KEY[period];

        const assetsTotal = totals.assets[period];
        const equityTotal = totals.equity[period];
        const liabilitiesTotal = totals.liabilities[period];

        const debtRatio = assetsTotal === 0 ? undefined : liabilitiesTotal / assetsTotal;
        const equityRatio = assetsTotal === 0 ? undefined : equityTotal / assetsTotal;
        const leverage = equityTotal === 0 ? undefined : assetsTotal / equityTotal;
        const debtToEquity = equityTotal === 0 ? undefined : liabilitiesTotal / equityTotal;
        const solvencyRatio = liabilitiesTotal === 0 ? undefined : assetsTotal / liabilitiesTotal;

        metrics[metricsKey] = {
          aktywaRazem: assetsTotal,
          kapitalWlasny: equityTotal,
          zobowiazania: liabilitiesTotal,
          debtRatio,
          equityRatio,
          leverage,
          debtToEquity,
          solvencyRatio,
        };
      }

      const token = await user.getIdToken(true);

      const finalReportName = reportName.trim() || "Bilans ręczny";

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

  const assetsRows = BALANCE_ROWS.filter((row) => row.section === "assets");
  const equityRows = BALANCE_ROWS.filter((row) => row.section === "equity");
  const liabilitiesRows = BALANCE_ROWS.filter((row) => row.section === "liabilities");

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Pełny bilans online</h2>
        <p className="mt-2 text-sm text-gray-600">
          Uzupełnij wielookresowy bilans bezpośrednio w przeglądarce. DataGate
          policzy sumy i wygeneruje raport na podstawie wpisanych danych.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Nazwa raportu</label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => onReportNameChange(e.target.value)}
            placeholder="np. Bilans firmy XYZ 2025"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
          />
          <p className="mt-1 text-xs text-gray-400">
            Jeśli zostawisz puste, zapisze się jako „Bilans ręczny”.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Branża</label>
          <select
            value={industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
          >
            <option value="manufacturing">Produkcja</option>
            <option value="it">IT</option>
            <option value="retail">Handel</option>
            <option value="services">Usługi</option>
            <option value="construction">Budownictwo</option>
          </select>
        </div>

        <div className="rounded-xl border border-dashed bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Okresy</p>
          <p className="mt-1 text-sm text-gray-600">
            Wspierane są: t-2, t-1, t0, t1, t2, t3, t4, t5, t6. Na ten moment
            do wygenerowania raportu wymagany jest przynajmniej okres t0.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="min-w-[1400px] border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                Pozycja
              </th>
              {PERIODS.map((period) => (
                <th
                  key={period}
                  className="border-b px-3 py-3 text-center font-semibold text-gray-700"
                >
                  {period}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="bg-gray-50">
              <td
                className="border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700"
                colSpan={PERIODS.length + 1}
              >
                Aktywa
              </td>
            </tr>

            {assetsRows.map((row) => (
              <tr key={row.key}>
                <td className="border-b px-4 py-3 font-medium text-gray-800">
                  {row.label}
                </td>

                {PERIODS.map((period) => (
                  <td key={`${row.key}-${period}`} className="border-b px-2 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values[row.key][period]}
                      onChange={(e) => updateCell(row.key, period, e.target.value)}
                      placeholder="0"
                      className="w-24 rounded-md border px-2 py-1.5 text-center text-sm outline-none transition focus:border-black"
                    />
                  </td>
                ))}
              </tr>
            ))}

            <tr className="bg-gray-50 font-semibold">
              <td className="border-b px-4 py-3 text-gray-900">Aktywa razem</td>
              {PERIODS.map((period) => (
                <td
                  key={`assets-total-${period}`}
                  className="border-b px-2 py-3 text-center text-gray-900"
                >
                  {totals.assets[period].toLocaleString("pl-PL")}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-50">
              <td
                className="border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700"
                colSpan={PERIODS.length + 1}
              >
                Kapitał własny
              </td>
            </tr>

            {equityRows.map((row) => (
              <tr key={row.key}>
                <td className="border-b px-4 py-3 font-medium text-gray-800">
                  {row.label}
                </td>

                {PERIODS.map((period) => (
                  <td key={`${row.key}-${period}`} className="border-b px-2 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values[row.key][period]}
                      onChange={(e) => updateCell(row.key, period, e.target.value)}
                      placeholder="0"
                      className="w-24 rounded-md border px-2 py-1.5 text-center text-sm outline-none transition focus:border-black"
                    />
                  </td>
                ))}
              </tr>
            ))}

            <tr className="bg-gray-50 font-semibold">
              <td className="border-b px-4 py-3 text-gray-900">Kapitał własny razem</td>
              {PERIODS.map((period) => (
                <td
                  key={`equity-total-${period}`}
                  className="border-b px-2 py-3 text-center text-gray-900"
                >
                  {totals.equity[period].toLocaleString("pl-PL")}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-50">
              <td
                className="border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700"
                colSpan={PERIODS.length + 1}
              >
                Zobowiązania i rozliczenia
              </td>
            </tr>

            {liabilitiesRows.map((row) => (
              <tr key={row.key}>
                <td className="border-b px-4 py-3 font-medium text-gray-800">
                  {row.label}
                </td>

                {PERIODS.map((period) => (
                  <td key={`${row.key}-${period}`} className="border-b px-2 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values[row.key][period]}
                      onChange={(e) => updateCell(row.key, period, e.target.value)}
                      placeholder="0"
                      className="w-24 rounded-md border px-2 py-1.5 text-center text-sm outline-none transition focus:border-black"
                    />
                  </td>
                ))}
              </tr>
            ))}

            <tr className="bg-gray-50 font-semibold">
              <td className="border-b px-4 py-3 text-gray-900">Zobowiązania razem</td>
              {PERIODS.map((period) => (
                <td
                  key={`liabilities-total-${period}`}
                  className="border-b px-2 py-3 text-center text-gray-900"
                >
                  {totals.liabilities[period].toLocaleString("pl-PL")}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-100 font-semibold">
              <td className="border-b px-4 py-3 text-gray-900">
                Kapitał własny i zobowiązania razem
              </td>
              {PERIODS.map((period) => (
                <td
                  key={`equity-liabilities-total-${period}`}
                  className="border-b px-2 py-3 text-center text-gray-900"
                >
                  {totals.equityLiabilities[period].toLocaleString("pl-PL")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
          W tej wersji sumy liczone są automatycznie po stronie formularza, więc
          nie musisz ręcznie wpisywać pozycji agregujących.
        </div>

        <div className="rounded-xl border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
          Żeby wygenerować raport, bilans musi się zgadzać:
          aktywa razem = kapitał własny + zobowiązania razem.
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`rounded-lg px-5 py-2.5 font-medium text-white ${
            loading ? "bg-gray-400" : "bg-black hover:bg-gray-800"
          }`}
        >
          {loading ? "Generowanie..." : "Analizuj bilans"}
        </button>
      </div>
    </section>
  );
}