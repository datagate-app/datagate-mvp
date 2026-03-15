export default function BudgetPage() {
  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              DataGate Budget
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Planowanie budżetu i prognoz finansowych
          </h1>

          <div className="mt-6 space-y-4 text-base leading-7 text-slate-600">
            <p>
              Moduł DataGate Budget pozwoli tworzyć budżety oraz prognozy
              finansowe na podstawie danych firmy.
            </p>

            <p>
              Celem funkcji będzie wsparcie planowania finansowego poprzez
              analizę wpływu przyszłych decyzji na wyniki finansowe, strukturę
              kapitału oraz stabilność przedsiębiorstwa.
            </p>

            <p>
              Funkcja jest obecnie w przygotowaniu i pojawi się w kolejnych
              wersjach DataGate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}