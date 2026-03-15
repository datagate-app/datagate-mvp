export default function ScenarioPage() {
  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              DataGate Scenario
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Symulacja decyzji finansowych
          </h1>

          <div className="mt-6 space-y-4 text-base leading-7 text-slate-600">
            <p>
              Moduł DataGate Scenario umożliwi analizę scenariuszy „co jeśli”
              na podstawie danych finansowych firmy.
            </p>

            <p>
              Dzięki temu będzie można sprawdzić, jak zmiany przychodów,
              kosztów, zadłużenia lub innych parametrów wpłyną na kondycję
              finansową przedsiębiorstwa oraz kluczowe wskaźniki.
            </p>

            <p>
              Funkcja jest obecnie w przygotowaniu i zostanie udostępniona w
              jednej z kolejnych aktualizacji DataGate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}