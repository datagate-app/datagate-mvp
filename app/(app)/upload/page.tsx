"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function UploadPage() {

  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [industry, setIndustry] = useState("manufacturing");
  const [loading, setLoading] = useState(false);

  function downloadTemplate() {

    const csv =
`pozycja,wartosc
aktywa_razem,1000000
kapital_wlasny,500000
zobowiazania,500000`;

    const blob = new Blob([csv], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "datagate_template.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  }

  async function handleUpload() {

    const user = auth.currentUser;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    if (!file) {
      alert("Wybierz plik CSV.");
      return;
    }

    try {

      setLoading(true);

      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", industry);

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error);
      }

      router.push(`/reports/${data.id}`);

    } catch (err) {

      console.error(err);
      alert("Błąd uploadu");

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="max-w-2xl mx-auto space-y-8">

      {/* HEADER */}

      <div>

        <h1 className="text-3xl font-bold">
          Upload bilansu
        </h1>

        <p className="text-gray-600 mt-2">
          Wgraj plik CSV z bilansem firmy, a DataGate automatycznie
          obliczy wskaźniki finansowe i wygeneruje raport.
        </p>

      </div>

      {/* CARD */}

      <div className="bg-white border rounded-2xl p-8 space-y-6 shadow-sm">

        {/* INDUSTRY */}

        <div>

          <label className="text-sm font-medium text-gray-600">
            Branża
          </label>

          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-2 w-full border rounded-lg px-3 py-2"
          >
            <option value="manufacturing">Produkcja</option>
            <option value="it">IT</option>
            <option value="retail">Handel</option>
            <option value="services">Usługi</option>
            <option value="construction">Budownictwo</option>
          </select>

        </div>

        {/* FILE */}

        <div>

          <label className="text-sm font-medium text-gray-600">
            Plik CSV
          </label>

          <div className="mt-2 border-2 border-dashed rounded-xl p-6 text-center">

            <input
              type="file"
              accept=".csv"
              onChange={(e) =>
                setFile(e.target.files?.[0] ?? null)
              }
              className="mx-auto"
            />

            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Wybrano: <strong>{file.name}</strong>
              </p>
            )}

          </div>

        </div>

        {/* BUTTONS */}

        <div className="flex gap-4">

          <button
            onClick={handleUpload}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2 text-white font-medium ${
              loading
                ? "bg-gray-400"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Generowanie..." : "Wgraj i wygeneruj raport"}
          </button>

          <button
            onClick={downloadTemplate}
            className="border rounded-lg px-4 py-2 hover:bg-gray-100"
          >
            Pobierz szablon
          </button>

        </div>

      </div>

      {/* INFO */}

      <div className="text-sm text-gray-500">

        <p>Szablon CSV powinien zawierać kolumny:</p>

        <pre className="bg-gray-100 p-4 rounded mt-2">
pozycja,wartosc
aktywa_razem,1000000
kapital_wlasny,500000
zobowiazania,500000
        </pre>

      </div>

    </div>

  );
}