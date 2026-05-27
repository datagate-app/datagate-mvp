export default function ScenarioPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="dg-title text-2xl">DataGate Scenario</h1>
          <span className="dg-module-badge">W przygotowaniu</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--dg-gray-500)]">
          Moduł będzie służył do symulacji decyzji finansowych na podstawie
          raportów utworzonych w DataGate Analyze.
        </p>
      </div>

      <section className="dg-card">
        <div className="dg-card-body md:p-8">
          <div className="dg-ai-block p-5">
            <span className="dg-module-badge">DataGate Scenario</span>
            <h2 className="mt-4 text-lg font-semibold text-[var(--dg-navy)]">
              Symulacja decyzji finansowych
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--dg-gray-500)]">
              <p>
                Moduł DataGate Scenario umożliwi analizę scenariuszy “co jeśli”
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
      </section>
    </div>
  );
}
