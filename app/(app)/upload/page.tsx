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

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
    </svg>
  );
}

export default function UploadPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<UploadTab>("demo");

  const [balanceFile, setBalanceFile] = useState<File | null>(null);
  const [incomeStatementFile, setIncomeStatementFile] = useState<File | null>(
    null
  );
  const [importName, setImportName] = useState("");
  const [importIndustry, setImportIndustry] = useState("manufacturing");
  const [importLoading, setImportLoading] = useState(false);

  const [demoName, setDemoName] = useState("");
  const [demoIndustry, setDemoIndustry] = useState("manufacturing");
  const [demoAssets, setDemoAssets] = useState("");
  const [demoEquity, setDemoEquity] = useState("");

  const [manualName, setManualName] = useState("");
  const [manualIndustry, setManualIndustry] = useState("manufacturing");

  function downloadBalanceTemplate() {
    const link = document.createElement("a");
    link.href = encodeURI("/DataGate - szablon.xlsx");
    link.download = "DataGate - szablon.xlsx";
    link.click();
  }

  function downloadIncomeTemplate() {
    const link = document.createElement("a");
    link.href = encodeURI("/DataGate - szablon RZiS.xlsx");
    link.download = "DataGate - szablon RZiS.xlsx";
    link.click();
  }

  async function handleImportUpload() {
    const user = auth.currentUser;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    if (!balanceFile && !incomeStatementFile) {
      alert("Wybierz plik bilansu albo plik RZiS.");
      return;
    }

    try {
      setImportLoading(true);

      const token = await user.getIdToken();

      const baseFileName =
        balanceFile?.name || incomeStatementFile?.name || "Nowy raport";

      const formData = new FormData();

      if (balanceFile) {
        formData.append("balanceFile", balanceFile);
      }

      if (incomeStatementFile) {
        formData.append("incomeStatementFile", incomeStatementFile);
      }

      formData.append("industry", importIndustry);
      formData.append(
        "name",
        importName.trim() || baseFileName.replace(/\.[^/.]+$/, "")
      );
      formData.append("inputMode", "import_csv");

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

  const balanceFileInfo = useMemo(() => {
    if (!balanceFile) return null;

    return {
      name: balanceFile.name,
      sizeKb: Math.max(1, Math.round(balanceFile.size / 1024)),
    };
  }, [balanceFile]);

  const incomeFileInfo = useMemo(() => {
    if (!incomeStatementFile) return null;

    return {
      name: incomeStatementFile.name,
      sizeKb: Math.max(1, Math.round(incomeStatementFile.size / 1024)),
    };
  }, [incomeStatementFile]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <span className="dg-module-badge">DataGate Analyze</span>
        <h1 className="dg-title mt-3 text-2xl md:text-3xl">
          Dodaj dane do raportu
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--dg-gray-500)]">
          Wybierz sposób pracy z danymi finansowymi. Możesz szybko utworzyć demo
          danych, uzupełnić pełny bilans online albo zaimportować pliki
          przygotowane na bazie szablonów DataGate.
        </p>
      </div>

      <div className="dg-card p-2">
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
            description="Upload CSV dla bilansu i RZiS"
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
        <section className="dg-card">
          <div className="dg-card-body md:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[var(--dg-navy)]">
                Import z pliku
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--dg-gray-500)]">
                Możesz zaimportować sam bilans, sam RZiS albo oba pliki naraz.
                Docelowo będą zapisane jako jeden raport finansowy.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="dg-label">Nazwa raportu</label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="np. ABC sp. z o.o. - raport finansowy 2025"
                  className="dg-input"
                />
                <p className="mt-2 text-xs text-[var(--dg-gray-400)]">
                  Jeśli zostawisz puste, jako nazwa raportu zostanie użyta nazwa
                  pierwszego wybranego pliku.
                </p>
              </div>

              <div>
                <label className="dg-label">Branża</label>
                <select
                  value={importIndustry}
                  onChange={(e) => setImportIndustry(e.target.value)}
                  className="dg-select"
                >
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[var(--dg-radius)] border border-dashed border-[var(--dg-gray-300)] bg-[var(--dg-gray-50)] p-4">
                <p className="text-sm font-medium text-[var(--dg-navy)]">
                  Zakres importu
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--dg-gray-500)]">
                  Minimalnie możesz wgrać bilans. Pełniejsza analiza powstanie
                  po dodaniu także RZiS.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="dg-upload-box">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--dg-radius)] bg-[var(--dg-gray-100)] text-[var(--dg-gray-400)]">
                  <span className="h-6 w-6">
                    <IconUpload />
                  </span>
                </div>
                <label className="block text-sm font-semibold text-[var(--dg-navy)]">
                  Bilans - plik CSV
                </label>
                <p className="mt-1 text-xs text-[var(--dg-gray-400)]">
                  Aktywa, kapitał własny, zobowiązania i pozycje bilansowe.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <label className="dg-btn dg-btn-primary cursor-pointer">
                    Wybierz bilans CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) =>
                        setBalanceFile(e.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={downloadBalanceTemplate}
                    className="dg-btn dg-btn-secondary"
                  >
                    Pobierz szablon
                  </button>
                </div>

                <div className="mt-4 text-sm text-[var(--dg-gray-600)]">
                  {balanceFileInfo ? (
                    <div className="rounded-[var(--dg-radius-sm)] border border-emerald-200 bg-emerald-50 p-3">
                      <p>
                        Wybrano: <strong>{balanceFileInfo.name}</strong>
                      </p>
                      <p>Rozmiar: {balanceFileInfo.sizeKb} KB</p>
                    </div>
                  ) : (
                    <p className="text-[var(--dg-gray-400)]">
                      Nie wybrano pliku bilansu.
                    </p>
                  )}
                </div>
              </div>

              <div className="dg-upload-box">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--dg-radius)] bg-[var(--dg-gray-100)] text-[var(--dg-gray-400)]">
                  <span className="h-6 w-6">
                    <IconUpload />
                  </span>
                </div>
                <label className="block text-sm font-semibold text-[var(--dg-navy)]">
                  RZiS - plik CSV
                </label>
                <p className="mt-1 text-xs text-[var(--dg-gray-400)]">
                  Przychody, koszty, wynik operacyjny, brutto i netto.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <label className="dg-btn dg-btn-primary cursor-pointer">
                    Wybierz RZiS CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) =>
                        setIncomeStatementFile(e.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={downloadIncomeTemplate}
                    className="dg-btn dg-btn-secondary"
                  >
                    Pobierz szablon
                  </button>
                </div>

                <div className="mt-4 text-sm text-[var(--dg-gray-600)]">
                  {incomeFileInfo ? (
                    <div className="rounded-[var(--dg-radius-sm)] border border-emerald-200 bg-emerald-50 p-3">
                      <p>
                        Wybrano: <strong>{incomeFileInfo.name}</strong>
                      </p>
                      <p>Rozmiar: {incomeFileInfo.sizeKb} KB</p>
                    </div>
                  ) : (
                    <p className="text-[var(--dg-gray-400)]">
                      Nie wybrano pliku RZiS.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleImportUpload}
                disabled={importLoading}
                className="dg-btn dg-btn-primary px-5 py-3"
              >
                {importLoading
                  ? "Generowanie..."
                  : "Importuj i wygeneruj raport"}
              </button>
            </div>

            <div className="mt-6 rounded-[var(--dg-radius)] border border-[var(--dg-gray-200)] bg-[var(--dg-gray-50)] p-4 text-sm text-[var(--dg-gray-500)]">
              <p className="font-semibold text-[var(--dg-navy)]">
                Na ten moment obowiązuje taki flow:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Pobierz szablon bilansu i/lub szablon RZiS.</li>
                <li>Uzupełnij dane w Excelu.</li>
                <li>Zapisz każdy plik jako CSV.</li>
                <li>Wgraj jeden lub dwa pliki do DataGate.</li>
                <li>System zapisze je jako jeden raport finansowy.</li>
              </ol>
            </div>
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
      className={`min-h-[92px] w-full cursor-pointer rounded-[var(--dg-radius)] border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
        isActive
          ? "border-sky-500 bg-gradient-to-br from-[var(--dg-teal)] to-[var(--dg-blue)] text-white shadow-[0_4px_14px_rgba(14,165,233,.26)]"
          : "border-[var(--dg-gray-200)] bg-white text-[var(--dg-navy)] hover:border-sky-300 hover:bg-[var(--dg-gray-50)]"
      }`}
    >
      <div className="text-base font-semibold leading-tight">{title}</div>
      <div
        className={`mt-2 text-sm leading-snug ${
          isActive ? "text-white/75" : "text-[var(--dg-gray-500)]"
        }`}
      >
        {description}
      </div>
    </button>
  );
}
