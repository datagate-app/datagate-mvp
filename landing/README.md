# DataGate Landing — Next.js 14

Produkcyjny landing dla DataGate (App Router · TypeScript · Tailwind · lucide-react).

## Uruchomienie lokalne

```bash
# 1. Instalacja zależności
npm install
# lub: pnpm install / yarn install

# 2. Tryb deweloperski
npm run dev
# → http://localhost:3000

# 3. Build produkcyjny
npm run build
npm run start
```

Wymagania: Node.js 18.17+ (zalecane 20+).

## Struktura projektu

```
datagate/
├─ app/
│  ├─ layout.tsx          # Fonts (next/font), metadata SEO, OG/Twitter
│  ├─ page.tsx            # Złożenie wszystkich sekcji + skip-link
│  ├─ globals.css         # Tailwind base + keyframes + reduced-motion
│  ├─ robots.ts           # /robots.txt (auto)
│  └─ sitemap.ts          # /sitemap.xml (auto)
├─ components/
│  ├─ JsonLd.tsx          # schema.org SoftwareApplication
│  ├─ ui/
│  │  ├─ ButtonLink.tsx
│  │  ├─ Pill.tsx
│  │  └─ SectionHeader.tsx
│  └─ landing/
│     ├─ Header.tsx            # sticky + mobile drawer (client)
│     ├─ Hero.tsx
│     ├─ DashboardMockup.tsx   # reużywalny (compact/full)
│     ├─ ProblemSection.tsx
│     ├─ HowItWorks.tsx
│     ├─ DashboardPreview.tsx
│     ├─ FeaturesSection.tsx   # MVP / Roadmap
│     ├─ ModulesSection.tsx
│     ├─ AudienceSection.tsx
│     ├─ MvpSection.tsx        # 3-stopniowa mini roadmapa
│     ├─ FaqSection.tsx
│     ├─ SignupForm.tsx        # client - formularz testów
│     ├─ FinalCta.tsx
│     └─ Footer.tsx
├─ lib/
│  └─ config.ts           # Centralne miejsce: linki CTA, email, nawigacja
├─ tailwind.config.ts
├─ next.config.js
├─ tsconfig.json
└─ package.json
```

## Co podpiąć ręcznie (TODO)

| Element | Plik | Co zrobić |
|---|---|---|
| Domena | `lib/config.ts → siteConfig.url` | Podmień na produkcyjną |
| Email kontaktowy | `lib/config.ts → siteConfig.email` | Realny adres |
| Link „Umów rozmowę” | `lib/config.ts → siteConfig.cta.contactHref` | Calendly / Cal.com / formularz |
| OG image | `public/og-image.png` (1200×630) | Wygeneruj graficznie |
| Formularz zapisu | `components/landing/SignupForm.tsx` → `mockSubmit` | Podmień na `fetch('/api/signup', ...)` lub Resend / Formspree / HubSpot |
| Polityka prywatności | `app/polityka-prywatnosci/page.tsx` | Stwórz stronę |
| Regulamin | `app/regulamin/page.tsx` | Stwórz stronę |
| Analityka | `app/layout.tsx` | Dodaj Plausible / Umami / GA4 (`<Script />`) |
| Roadmapa publiczna | osobna strona `/roadmap` (opcja) | Linkuj z sekcji MVP |

## Wszystkie linki CTA — jedno miejsce

Wszystkie kluczowe CTA i linki kontaktowe są w `lib/config.ts`.
Zmień je raz, wszystkie sekcje zaktualizują się automatycznie.

## Dostępność (a11y)

- semantic HTML (`<main>`, `<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`, `<ol>`)
- skip-link „Pomiń do treści”
- `aria-label`, `aria-controls`, `aria-expanded` na mobile menu
- `aria-hidden` na dekoracyjnych ikonach
- focus-visible outlines
- FAQ na `<details>/<summary>` — działa klawiaturą out of the box
- `prefers-reduced-motion` szanowany w `globals.css`

## Performance

- Fonts via `next/font` (self-hosted, brak FOIT/FOUT)
- Tailwind w build-time (brak CDN, ~10× mniejszy CSS niż w prototypie)
- Mockup dashboardu jako SVG/HTML — brak ciężkich obrazków
- Animacje CSS only — żadnych ciężkich bibliotek motion
- Lucide jako tree-shakeable imports (`import { X } from "lucide-react"`)

## SEO

- jeden `<h1>` (Hero), logiczne H2/H3
- meta title (template) + description w `app/layout.tsx`
- canonical URL via `metadata.alternates.canonical`
- Open Graph + Twitter Card
- JSON-LD `SoftwareApplication` (`components/JsonLd.tsx`)
- `/robots.txt` i `/sitemap.xml` generowane automatycznie
- `lang="pl"` na `<html>`
- alt-texty / aria-labels na wszystkich grafikach SVG
