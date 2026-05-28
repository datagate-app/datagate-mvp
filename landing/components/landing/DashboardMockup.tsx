import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface DashboardMockupProps {
  variant?: "compact" | "full";
}

/**
 * Kompletny mockup dashboardu używany w hero (compact) i sekcji "Przykładowy raport" (full).
 * Wszystkie liczby to dane demonstracyjne — komunikujemy to wizualnie.
 */
export function DashboardMockup({ variant = "compact" }: DashboardMockupProps) {
  const isFull = variant === "full";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white hairline ${
        isFull ? "shadow-lift" : "shadow-glow"
      }`}
      role="img"
      aria-label="Przykładowy widok dashboardu DataGate z danymi demonstracyjnymi"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-bg to-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        <div className="font-mono text-[11px] text-muted">
          datagate.app{isFull ? " · raport Q3 2026" : "/analyze/q3-2026"}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
        </div>
      </div>

      <div className={isFull ? "p-5 lg:p-7" : "p-5"}>
        {/* Title */}
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Raport · Q3 2026
            </div>
            <div
              className={`mt-1 font-display font-semibold text-ink ${
                isFull ? "text-2xl lg:text-3xl" : "text-lg"
              }`}
            >
              Kondycja finansowa firmy
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-xs sm:flex">
            <span className="rounded-md bg-bg px-2 py-1 text-muted">M</span>
            <span className="rounded-md bg-ink px-2 py-1 text-white">Q3</span>
            <span className="rounded-md bg-bg px-2 py-1 text-muted">YTD</span>
          </div>
        </div>

        {/* KPI grid */}
        <div
          className={`grid gap-2.5 ${
            isFull
              ? "grid-cols-2 lg:grid-cols-5"
              : "grid-cols-2 sm:grid-cols-4"
          }`}
        >
          <KpiCard label="Przychody" value="428 000 zł" delta="+6,4%" trend="up" />
          <KpiCard label="Koszty" value="316 000 zł" delta="+3,1%" trend="down" />
          <KpiCard label="Marża" value="26,2%" delta="+1,8 pp" trend="up" />
          {isFull && (
            <KpiCard label="Wynik netto" value="78 400 zł" delta="+8,2%" trend="up" />
          )}
          <KpiCard
            label="Cash Flow"
            value={isFull ? "+42 000 zł" : "+42 000"}
            delta="stabilny"
            trend="neutral"
            highlight={isFull}
          />
        </div>

        {/* Chart */}
        <div className="mt-4 rounded-lg bg-white p-4 hairline">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold text-ink">
              {isFull
                ? "Trend P&L · ostatnie 6 miesięcy"
                : "Przychody vs koszty · trend 6m"}
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <Legend color="bg-blue" label="Przychód" />
              <Legend color="bg-cyan" label="Koszty" />
              {isFull && <Legend color="bg-success" label="Marża" />}
            </div>
          </div>
          <TrendChart isFull={isFull} />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
            <span>Kwi</span>
            <span>Maj</span>
            <span>Cze</span>
            <span>Lip</span>
            <span>Sie</span>
            <span>Wrz</span>
          </div>
        </div>

        {/* Bottom: insights + alerts (full only) or mini bars (compact) */}
        {isFull ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl bg-bg p-4 hairline">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-success" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink">
                  Najważniejsze wnioski
                </span>
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
                <li>• Marża rośnie trzeci miesiąc z rzędu (+1,8 pp).</li>
                <li>• Przychody rosną szybciej niż koszty operacyjne.</li>
                <li>• Cash flow stabilny, bez nagłych odchyleń.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle
                  className="h-4 w-4 text-red-500"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-ink">
                  Obszary wymagające uwagi
                </span>
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
                <li>
                  • Koszty transportu wzrosły o{" "}
                  <span className="font-semibold text-red-500">+11,8%</span> m/m.
                </li>
                <li>• Należności spóźnione +14 dni rosną o 9%.</li>
                <li>• Spadek marży o 8% w segmencie B.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex h-20 items-end justify-between gap-1.5 rounded-lg bg-white p-3 hairline">
            <div className="bar w-full rounded-sm bg-ink/85" style={{ height: "35%" }} />
            <div className="bar w-full rounded-sm bg-ink/85" style={{ height: "48%", animationDelay: ".05s" }} />
            <div className="bar w-full rounded-sm bg-ink/85" style={{ height: "42%", animationDelay: ".1s" }} />
            <div className="bar w-full rounded-sm bg-blue/90" style={{ height: "65%", animationDelay: ".15s" }} />
            <div className="bar w-full rounded-sm bg-blue/90" style={{ height: "72%", animationDelay: ".2s" }} />
            <div className="bar w-full rounded-sm bg-cyan" style={{ height: "88%", animationDelay: ".25s" }} />
          </div>
        )}

        {/* Table — tylko full */}
        {isFull && <IndicatorsTable />}

        {/* Disclaimer */}
        <div className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          Przykładowy widok — dane demonstracyjne
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  highlight = false,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "neutral";
  highlight?: boolean;
}) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-red-500"
        : "text-success";
  const TrendIcon = trend === "down" ? TrendingDown : trend === "up" ? TrendingUp : CheckCircle2;

  return (
    <div
      className={`rounded-lg p-3 ${
        highlight ? "bg-ink text-white" : "bg-bg/70 hairline"
      } ${highlight ? "col-span-2 lg:col-span-1" : ""}`}
    >
      <div
        className={`font-mono text-[10px] uppercase tracking-wider ${
          highlight ? "text-white/50" : "text-muted"
        }`}
      >
        {label}
      </div>
      <div
        className={`ticker mt-1 font-display font-semibold ${
          highlight ? "text-white" : "text-ink"
        } ${highlight ? "text-2xl" : "text-lg"}`}
      >
        {value}
      </div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] ${trendColor}`}>
        <TrendIcon className="h-3 w-3" aria-hidden="true" />
        {delta}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function TrendChart({ isFull }: { isFull: boolean }) {
  return (
    <svg
      viewBox={isFull ? "0 0 600 200" : "0 0 400 120"}
      className={`w-full ${isFull ? "h-44" : "h-28"}`}
      role="img"
      aria-label="Wykres trendu przychodów i kosztów"
    >
      <defs>
        <linearGradient id={`rev-${isFull ? "f" : "c"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" stopOpacity="0.22" />
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {isFull ? (
        <>
          <line x1="0" y1="50" x2="600" y2="50" stroke="#E2E8F0" strokeDasharray="2 4" />
          <line x1="0" y1="100" x2="600" y2="100" stroke="#E2E8F0" strokeDasharray="2 4" />
          <line x1="0" y1="150" x2="600" y2="150" stroke="#E2E8F0" strokeDasharray="2 4" />
          <path d="M0,140 L100,120 L200,128 L300,90 L400,80 L500,68 L600,50 L600,200 L0,200 Z" fill="url(#rev-f)" />
          <path className="draw-path" d="M0,140 L100,120 L200,128 L300,90 L400,80 L500,68 L600,50" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path className="draw-path" style={{ animationDelay: ".6s" }} d="M0,160 L100,152 L200,140 L300,138 L400,130 L500,134 L600,124" stroke="#06B6D4" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
          <path className="draw-path" style={{ animationDelay: "1s" }} d="M0,110 L100,100 L200,108 L300,82 L400,76 L500,70 L600,58" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 4" />
        </>
      ) : (
        <>
          <line x1="0" y1="30" x2="400" y2="30" stroke="#E2E8F0" strokeDasharray="2 4" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="#E2E8F0" strokeDasharray="2 4" />
          <line x1="0" y1="90" x2="400" y2="90" stroke="#E2E8F0" strokeDasharray="2 4" />
          <path d="M0,80 L60,68 L120,72 L180,52 L240,46 L300,40 L360,28 L400,30 L400,120 L0,120 Z" fill="url(#rev-c)" />
          <path className="draw-path" d="M0,80 L60,68 L120,72 L180,52 L240,46 L300,40 L360,28 L400,30" stroke="#3B82F6" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path className="draw-path" style={{ animationDelay: ".7s" }} d="M0,90 L60,86 L120,80 L180,78 L240,72 L300,76 L360,68 L400,66" stroke="#06B6D4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
          <circle cx="360" cy="28" r="3.5" fill="#3B82F6" />
          <circle cx="360" cy="28" r="6" fill="#3B82F6" fillOpacity="0.2" />
        </>
      )}
    </svg>
  );
}

function IndicatorsTable() {
  const rows = [
    { name: "Rentowność operacyjna", value: "18,3%", delta: "+1,2 pp", deltaTone: "ok", status: "OK" },
    { name: "Wskaźnik płynności bieżącej", value: "1,72", delta: "+0,08", deltaTone: "ok", status: "OK" },
    { name: "Rotacja należności", value: "38 dni", delta: "+4 dni", deltaTone: "warn", status: "Uwaga" },
    { name: "Marża brutto", value: "26,2%", delta: "+1,8 pp", deltaTone: "ok", status: "OK" },
    { name: "Koszty transportu / przychód", value: "7,4%", delta: "+11,8%", deltaTone: "alert", status: "Alert" },
  ] as const;

  const statusTone = {
    OK: { dot: "bg-success", text: "text-success" },
    Uwaga: { dot: "bg-amber", text: "text-amber" },
    Alert: { dot: "bg-red-500", text: "text-red-500" },
  } as const;
  const deltaTone = {
    ok: "text-success",
    warn: "text-red-500",
    alert: "text-red-500",
  } as const;

  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-white hairline">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="text-sm font-semibold text-ink">Kluczowe wskaźniki</div>
        <div className="font-mono text-xs text-muted">5 z 8 wskaźników · Q3 2026</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg/50 font-mono text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Wskaźnik</th>
              <th className="px-5 py-3 text-right font-medium">Wartość</th>
              <th className="px-5 py-3 text-right font-medium">Zmiana m/m</th>
              <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-5 py-3 text-ink">{r.name}</td>
                <td className="ticker px-5 py-3 text-right font-display font-semibold">
                  {r.value}
                </td>
                <td className={`ticker px-5 py-3 text-right ${deltaTone[r.deltaTone]}`}>
                  {r.delta}
                </td>
                <td className="hidden px-5 py-3 text-right md:table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${statusTone[r.status].text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusTone[r.status].dot}`} />
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
