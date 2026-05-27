export default function BudgetPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="dg-title text-2xl">DataGate Budget</h1>
          <span className="dg-module-badge">W przygotowaniu</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--dg-gray-500)]">
          Moduł będzie rozwinięciem DataGate o planowanie budżetu i prognozy
          finansowe.
        </p>
      </div>

      <section className="dg-card">
        <div className="dg-card-body md:p-8">
          <div className="dg-ai-block p-5">
            <span className="dg-module-badge">DataGate Budget</span>
            <h2 className="mt-4 text-lg font-semibold text-[var(--dg-navy)]">
              Planowanie budżetu i prognoz finansowych
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--dg-gray-500)]">
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
      </section>
    </div>
  );
}
