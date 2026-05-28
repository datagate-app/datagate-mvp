import { SectionHeader } from "@/components/ui/SectionHeader";

const faqs = [
  {
    q: "Czy DataGate zastępuje Excela?",
    a: "Nie. DataGate ma ograniczyć ręczną pracę i pomóc szybciej zamieniać dane w raporty oraz wnioski. Excel nadal może być źródłem danych albo narzędziem do dalszej pracy.",
  },
  {
    q: "Czy produkt jest już gotowy?",
    a: "DataGate jest rozwijanym MVP. Część funkcji jest dostępna, a część rozwijana na podstawie testów i feedbacku pierwszych użytkowników.",
  },
  {
    q: "Jakie pliki można wgrywać?",
    a: "W MVP obsługiwane są wybrane struktury CSV i XLSX. Zakres obsługiwanych plików będzie stopniowo rozszerzany — informujemy o tym jasno przy uploadzie, zanim zaczniesz analizę.",
  },
  {
    q: "Czy moje dane są bezpieczne?",
    a: "Bezpieczeństwo danych jest jednym z priorytetów rozwoju DataGate. Wersja produkcyjna będzie oparta o kontrolę dostępu, bezpieczne przechowywanie danych i jasne zasady przetwarzania plików. Pełna polityka bezpieczeństwa zostanie opublikowana wraz z wersją produkcyjną.",
  },
  {
    q: "Dla kogo jest DataGate?",
    a: "Dla małych i średnich firm, właścicieli, controllerów, analityków i osób, które pracują z danymi finansowymi, kosztami, sprzedażą lub raportami.",
  },
  {
    q: "Czy DataGate korzysta z AI?",
    a: "Docelowo DataGate może wspierać interpretację danych i komentarze systemowe, ale główną wartością produktu jest uporządkowana analiza, wskaźniki i dashboard. Nie obiecujemy „AI, które zna Twoją firmę” — obiecujemy szybsze, czytelniejsze raporty.",
  },
] as const;

export function FaqSection() {
  return (
    <section id="faq" className="bg-bg py-20 lg:py-28" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <SectionHeader eyebrow="08 — FAQ" title="Najczęstsze pytania." />

        <div className="mt-12 space-y-2">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white p-5 hairline open:bg-white"
            >
              <summary className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-ink">{item.q}</h3>
                <span
                  className="chev flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xl leading-none text-white"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
