"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import DemoReportForm from "../../../components/demo-report-form";
import ManualBalanceForm from "../../../components/manual-balance-form";

type UploadTab = "demo" | "manual" | "import";

const INDUSTRIES = [
  { value: "manufacturing", label: "Produkcja" },
  { value: "it", label: "IT" },
  { value: "retail", label: "Handel" },
  { value: "services", label: "Usługi" },
  { value: "construction", label: "Budownictwo" },
];

export default function UploadPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<UploadTab>("demo");

  // IMPORT
  const [file, setFile] = useState<File | null>(null);
  const [importName, setImportName] = useState("");
  const [importIndustry, setImportIndustry] = useState("manufacturing");
  const [importLoading, setImportLoading] = useState(false);

  // DEMO
  const [demoName, setDemoName] = useState("");
  const [demoIndustry, setDemoIndustry] = useState("manufacturing");
  const [demoAssets, setDemoAssets] = useState("");
  const [demoEquity, setDemoEquity] = useState("");

  // MANUAL FULL BALANCE
  const [manualName, setManualName] = useState("");
  const [manualIndustry, setManualIndustry] = useState("manufacturing");

  function downloadTemplate() {
    const link = document.createElement("a");
    link.href = encodeURI("/DataGate - szablon.xlsx");
    link.download = "DataGate - szablon.xlsx";
    link.click();
  }

  async function handleImportUpload() {
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
      setImportLoading(true);

      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", importIndustry);
      formData.append(
        "name",
        importName.trim() || file.name.replace(/\.[^/.]+$/, "")
      );

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Błąd uploadu");
      }

      router.push(`/reports/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Błąd uploadu pliku.");
    } finally {
      setImportLoading(false);
    }
  }

  const fileInfo = useMemo(() => {
    if (!file) return null;

    return {
      name: file.name,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
    };
  }, [file]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Dodaj dane do raportu
        </h1>
        <p className="max-w-3xl text-sm text-gray-600 md:text-base">
          Wybierz sposób pracy z bilansem. Możesz szybko utworzyć demo danych,
          uzupełnić pełny bilans online albo zaimportować plik przygotowany na
          bazie szablonu DataGate.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <TabButton
            isActive={activeTab === "demo"}
            onClick={() => setActiveTab("demo")}
            title="Demo danych"
            description="Szybki raport na podstawie kilku pól"
          />
          <TabButton
            isActive={activeTab === "manual"}
            onClick={() => setActiveTab("manual")}
            title="Pełny bilans online"
            description="Arkusz wielookresowy uzupełniany w przeglądarce"
          />
          <TabButton
            isActive={activeTab === "import"}
            onClick={() => setActiveTab("import")}
            title="Import z pliku"
            description="Upload CSV przygotowanego z szablonu"
          />
        </div>
      </div>

      {activeTab === "demo" && (
        <DemoReportForm
          reportName={demoName}
          onReportNameChange={setDemoName}
          industry={demoIndustry}
          onIndustryChange={setDemoIndustry}
          assets={demoAssets}
          onAssetsChange={setDemoAssets}
          equity={demoEquity}
          onEquityChange={setDemoEquity}
        />
      )}

      {activeTab === "manual" && (
        <ManualBalanceForm
          reportName={manualName}
          onReportNameChange={setManualName}
          industry={manualIndustry}
          onIndustryChange={setManualIndustry}
        />
      )}

      {activeTab === "import" && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Import z pliku</h2>
            <p className="mt-2 text-sm text-gray-600">
              Pobierz szablon Excel, uzupełnij dane, zapisz plik do CSV i wgraj
              go tutaj. Nazwa raportu może być własna — nie musi być taka sama
              jak nazwa pliku.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Nazwa raportu
              </label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="np. Bilans ABC sp. z o.o. 2025"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              />
              <p className="mt-2 text-xs text-gray-500">
                Jeśli zostawisz puste, jako nazwa raportu zostanie użyta nazwa
                pliku.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Branża
              </label>
              <select
                value={importIndustry}
                onChange={(e) => setImportIndustry(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-black"
              >
                {INDUSTRIES.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-dashed bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Szablon pliku</p>
              <p className="mt-1 text-sm text-gray-600">
                Szablon źródłowy jest w Excelu (.xlsx), ale na ten moment upload
                przyjmuje plik zapisany do CSV.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border-2 border-dashed p-6">
            <label className="block text-sm font-medium text-gray-700">
              Plik CSV
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="cursor-pointer rounded-lg border px-5 py-3 font-medium hover:bg-gray-50">
                Wybierz plik CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={downloadTemplate}
                className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50"
              >
                Pobierz szablon Excel
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              {fileInfo ? (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p>
                    Wybrano: <strong>{fileInfo.name}</strong>
                  </p>
                  <p>Rozmiar: {fileInfo.sizeKb} KB</p>
                </div>
              ) : (
                <p className="text-gray-500">Nie wybrano pliku.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleImportUpload}
              disabled={importLoading}
              className={`rounded-lg px-5 py-3 font-medium text-white ${
                importLoading ? "bg-gray-400" : "bg-black hover:bg-gray-800"
              }`}
            >
              {importLoading ? "Generowanie..." : "Importuj i wygeneruj raport"}
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800">
              Na ten moment obowiązuje taki flow:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Pobierz szablon Excel.</li>
              <li>Uzupełnij dane w arkuszu.</li>
              <li>Zapisz plik jako CSV.</li>
              <li>Wgraj CSV do DataGate.</li>
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  title: string;
  description: string;
};

function TabButton({
  isActive,
  onClick,
  title,
  description,
}: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[92px] w-full cursor-pointer rounded-xl border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-black/20 ${
        isActive
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
      }`}
    >
      <div className="text-base font-semibold leading-tight">{title}</div>
      <div
        className={`mt-2 text-sm leading-snug ${
          isActive ? "text-gray-200" : "text-gray-600"
        }`}
      >
        {description}
      </div>
    </button>
  );
}