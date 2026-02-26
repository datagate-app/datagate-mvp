"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const INDUSTRIES = {
  manufacturing: "Produkcja",
  it: "Technologie / IT",
  retail: "Handel",
  services: "Usługi",
  construction: "Budownictwo",
} as const;

type IndustryKey = keyof typeof INDUSTRIES;

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [industry, setIndustry] = useState<IndustryKey>("manufacturing");

  const router = useRouter();

  const handleUpload = async () => {
    if (!file) {
      alert("Wybierz plik CSV.");
      return;
    }

    // MVP guard: upewnij się, że to CSV
    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      alert("To nie wygląda na plik CSV. Zapisz plik jako CSV i spróbuj ponownie.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    if (!industry) {
      alert("Wybierz branżę.");
      return;
    }

    setLoading(true);
    setProgress(0);

    let value = 0;
    const interval = setInterval(() => {
      value += 15;
      if (value <= 90) setProgress(value);
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ownerId", user.uid);
      formData.append("industry", industry);

      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        router.push(`/reports/${data.id}`);
      }, 400);
    } catch (err) {
      clearInterval(interval);
      console.error("Upload error:", err);
      alert("Błąd podczas przetwarzania pliku.");
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold">Upload raportu</h1>
        <p className="mt-2 text-gray-600">
          Wgraj plik <span className="font-medium">CSV</span> (dane z bilansu).
        </p>
      </div>

      {/* SZABLON */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Szablon pliku
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Pobierz szablon w formacie{" "}
              <span className="font-medium">.xlsx</span>, uzupełnij dane, a
              następnie zapisz go jako{" "}
              <span className="font-medium">CSV</span> przed wgraniem.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Excel: <span className="font-medium">Plik → Zapisz jako → CSV (UTF-8)</span>
            </p>
          </div>

          <a
            href="/DataGate - szablon.xlsx"
            download
            className="h-10 rounded-lg px-4 text-sm font-medium text-white transition"
            style={{ backgroundColor: "#0d1a34" }}
          >
            Pobierz szablon
          </a>
        </div>
      </div>

      {/* Branża */}
      <div>
        <label className="block text-sm text-gray-500">Branża</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value as IndustryKey)}
          disabled={loading}
          className="mt-1 w-full rounded border border-gray-300 p-2"
        >
          {Object.entries(INDUSTRIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Plik */}
      <div>
        <label className="block text-sm text-gray-500">Plik CSV</label>
        <input
          type="file"
          accept=".csv"
          disabled={loading}
          className="mt-1 block w-full rounded border border-gray-300 p-2"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] ?? null;
            setFile(selectedFile);
          }}
        />

        {file && (
          <p className="mt-2 text-xs text-gray-600">
            Wybrany plik: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="h-10 rounded-lg px-4 text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#0d1a34" }}
      >
        {loading ? "Analizuję..." : "Upload & Analizuj"}
      </button>

      {loading && (
        <div>
          <div className="h-2 w-full rounded bg-gray-200">
            <div
              className="h-2 rounded bg-black transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-sm text-gray-600">
            Analiza pliku... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}