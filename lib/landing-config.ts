export const siteConfig = {
  name: "DataGate",
  tagline: "Analyze · Scenario · Budget",
  description:
    "DataGate pomaga zamieniać pliki finansowe w czytelne dashboardy, wskaźniki i raporty.",
  url: "https://datagate.app",
  ogImage: "/logo_dark_big.png",
  email: "hello@datagate.app",
  cta: {
    primaryHref: "/login",
    primaryLabel: "Zaloguj się",
    secondaryHref: "#przykladowy-raport",
    secondaryLabel: "Zobacz przykładowy raport",
    contactHref: "mailto:hello@datagate.app",
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
