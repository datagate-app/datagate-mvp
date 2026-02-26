"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import type { Metrics } from "@/lib/types/metrics";

const INDUSTRIES = {
  manufacturing: "Produkcja",
  it: "Technologie / IT",
  retail: "Handel",
  services: "Usługi",
  construction: "Budownictwo",
} as const;

type IndustryKey = keyof typeof INDUSTRIES;

export default function InteractiveDemoPage() {
  const router = useRouter();

  const [aktywa, setAktywa] = useState("");
  const [kapital, setKapital] = useState("");
  const [industry, setIndustry] =
    useState<IndustryKey>("manufacturing");

  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    const user = auth.currentUser;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const assets = Number(aktywa);
    const equity = Number(kapital);

    if (!assets || !equity || equity > assets) {
      alert("Sprawdź dane – kapitał nie może być większy niż aktywa.");
      return;
    }

    setLoading(true);

    const liabilities = assets - equity;

    const debtRatio = liabilities / assets;
    const equityRatio = equity / assets;
    const leverage = assets / equity;
    const debtToEquity = liabilities / equity;
    const solvencyRatio = assets / liabilities;

    const metrics: Metrics = {
      tMinus2: {},
      tMinus1: {},
      t0: {
        aktywaRazem: assets,
        kapitalWlasny: equity,
        zobowiazania: liabilities,
        debtRatio,
        equityRatio,
        leverage,
        debtToEquity,
        solvencyRatio,
      },
      t1: {},
      t2: {},
      t3: {},
      t4: {},
      t5: {},
      t6: {},
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.uid,
          name: "Raport – Twoje dane",
          industry,
          metrics,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Błąd zapisu");
      }

      // 🔥 redirect do prawdziwego raportu
      router.push(`/reports/${data.id}`);
    } catch (err) {
      alert("Wystąpił błąd podczas zapisu raportu.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">
          Wygeneruj raport z własnych danych
        </h1>
        <p className="mt-2 text-gray-600">
          Raport zostanie zapisany w Twoim koncie.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm text-gray-500">
            Branża
          </label>
          <select
            value={industry}
            onChange={(e) =>
              setIndustry(e.target.value as IndustryKey)
            }
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {Object.entries(INDUSTRIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500">
            Aktywa razem (w tys. zł)
          </label>
          <input
            type="number"
            value={aktywa}
            onChange={(e) => setAktywa(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500">
            Kapitał własny (w tys. zł)
          </label>
          <input
            type="number"
            value={kapital}
            onChange={(e) => setKapital(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full rounded-lg px-4 py-2 text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {loading ? "Generowanie..." : "Generuj raport"}
        </button>
      </div>
    </div>
  );
}