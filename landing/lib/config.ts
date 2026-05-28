/**
 * Centralna konfiguracja landingu.
 * Wszystkie linki CTA i adresy do podmiany trzymane są tutaj —
 * po deployu zmień wartości w jednym miejscu zamiast szukać po komponentach.
 */
export const siteConfig = {
  name: "DataGate",
  tagline: "Analyze · Scenario · Budget",
  description:
    "DataGate pomaga zamieniać pliki finansowe w czytelne dashboardy, wskaźniki i raporty. Dołącz do testów MVP i sprawdź, jak szybciej analizować dane firmowe.",
  url: "https://datagate.app", // TODO: podmień na produkcyjną domenę
  ogImage: "/og-image.png", // TODO: wygeneruj 1200×630 OG image
  email: "hello@datagate.app", // TODO: realny adres kontaktowy

  // Główne CTA — jeden cel: zapis do testów MVP
  cta: {
    primaryHref: "#zglos-sie", // sekcja z formularzem
    primaryLabel: "Dołącz do testów MVP",
    secondaryHref: "#przykladowy-raport",
    secondaryLabel: "Zobacz przykładowy raport",
    contactHref: "mailto:hello@datagate.app", // TODO: Calendly / Cal.com link na rozmowę
    contactLabel: "Umów krótką rozmowę",
  },

  company: {
    parent: "Asterion",
  },
} as const;

export const nav = [
  { href: "#jak-dziala", label: "Jak działa" },
  { href: "#przykladowy-raport", label: "Przykładowy raport" },
  { href: "#funkcje", label: "Funkcje" },
  { href: "#moduly", label: "Moduły" },
  { href: "#dla-kogo", label: "Dla kogo" },
  { href: "#faq", label: "FAQ" },
] as const;
