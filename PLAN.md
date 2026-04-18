# Moss Weather — Implementeringsplan

> **Mål:** Bygge en moderne, tospråklig landingsside som viser været i Moss basert på MET Norway sitt åpne API. Deploy til Vercel når MVP er ferdig.

---

## 1. Tech stack

| Lag | Valg | Versjon | Hvorfor |
|-----|------|---------|---------|
| Framework | Next.js (App Router) | `@latest` (16.x) | Server Components, Cache Components, innebygd i18n-støtte |
| Språk | TypeScript | `@latest` | Type-sikker API-respons fra MET |
| Styling | Tailwind CSS | `v4` | Default i Next.js 16, utility-first |
| UI-komponenter | shadcn/ui | `@latest` | Rene, tilgjengelige komponenter via shadcn MCP |
| i18n | next-intl | `@latest` | De facto standard for App Router |
| Theming | next-themes | `@latest` | Dark/light mode med system-preferanse |
| Ikoner (UI) | lucide-react | `@latest` | Følger med shadcn |
| Værsymboler | MET Weather Icons | — | Offisielle SVG fra yr.no (MIT-lisens) |
| Font | Geist | default | Moderne, rent, default i Next.js 16 |
| Deploy | Vercel (via MCP) | — | Fluid Compute, edge caching |
| Bildegen | Gemini 3.1 Flash (Nano Banana) | via `ai-image-gen` | Hero-bilde av Moss |

★ **Insight — hvorfor next-intl over manuell i18n:** Vi kunne bygget i18n selv med dynamisk `[locale]`-segment og JSON-ordbøker, men next-intl håndterer dato/tall-formatering (viktig for `5°C` vs `41°F`, `mandag` vs `Monday`), type-sikre oversettelsesnøkler og SEO-metadata (hreflang) ut av boksen. For en produksjonsklar app er det verdt de ~30 kB.

---

## 2. Arkitektur

```
Browser
   │
   │ GET /nb  eller  GET /en
   ▼
┌─────────────────────────────────────┐
│  Next.js App Router (Server)        │
│                                     │
│  app/[locale]/page.tsx              │
│     └─ "use cache"                  │
│         cacheLife('minutes')  ──────┼──► Vercel Runtime Cache
│         fetchWeather()              │      (10 min TTL)
│                                     │
└─────────────────┬───────────────────┘
                  │
                  ▼ (cache miss)
     ┌────────────────────────────┐
     │  MET Norway API            │
     │  locationforecast/2.0      │
     │  lat=59.4369 lon=10.6596   │
     │  (User-Agent kreves)       │
     └────────────────────────────┘
```

### Dataflyt

1. Bruker treffer `/nb` eller `/en` (default redirect fra `/`)
2. Server Component kaller `fetchMossWeather()` (cached med `use cache` + `cacheLife('minutes')`)
3. MET returnerer JSON med prognose de neste ~9 døgn (10-minutters oppløsning første 48t)
4. Vi transformerer til egen datamodell (`CurrentWeather`, `HourlyForecast[]`, `DailyForecast[]`)
5. Rendres som HTML → sendes til browser

★ **Insight — hvorfor server-side fetch:** MET krever identifiserbar `User-Agent`. Henter vi fra browser lekker vi aldri API-nøkler (det er ingen), men vi får CORS-problemer og kan ikke cache. Server-side løser begge.

---

## 3. Filstruktur

```
moss-weather/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # i18n provider, theme provider
│   │   └── page.tsx            # Landingsside (Server Component)
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── globals.css             # Tailwind + CSS-variabler for theming
│   └── not-found.tsx
├── components/
│   ├── ui/                     # shadcn (card, button, scroll-area, tabs, skeleton)
│   ├── hero.tsx                # Stor temp + symbol + bilde-bakgrunn
│   ├── current-weather.tsx     # Nå-boks med detaljer
│   ├── hourly-forecast.tsx     # 24t horizontal scroll
│   ├── daily-forecast.tsx      # 7d grid
│   ├── weather-details.tsx     # Vind, fukt, trykk, sol opp/ned
│   ├── weather-icon.tsx        # Mapper MET symbolkode → SVG
│   ├── language-switcher.tsx   # nb ↔ en
│   └── theme-toggle.tsx        # dark/light/system
├── lib/
│   ├── weather/
│   │   ├── met-client.ts       # MET API fetcher (server-only)
│   │   ├── types.ts            # MET-respons + egne typer
│   │   ├── transform.ts        # MET-respons → vår datamodell
│   │   └── sun.ts              # Soloppgang/solnedgang fra MET sunrise API
│   └── utils.ts                # cn() fra shadcn
├── i18n/
│   ├── routing.ts              # next-intl routing config
│   ├── request.ts              # Server-side locale resolver
│   └── messages/
│       ├── nb.json
│       └── en.json
├── public/
│   ├── images/
│   │   └── moss-hero.jpg       # Generert med Gemini (Nano Banana)
│   └── weather-icons/          # SVG fra MET (nedlastet én gang)
├── middleware.ts               # next-intl middleware for locale-routing
├── next.config.ts
├── tailwind.config.ts          # (v4 bruker @theme inline i CSS)
├── components.json             # shadcn-config
├── package.json
└── README.md
```

---

## 4. MET Norway API

### Endepunkter vi bruker

| Endpoint | Formål |
|----------|--------|
| `GET /weatherapi/locationforecast/2.0/complete` | Full prognose (time-for-time 64t + 6t-intervaller 9d) |
| `GET /weatherapi/sunrise/3.0/sun` | Soloppgang/solnedgang for Moss |

**Base URL:** `https://api.met.no`

**Koordinater Moss:** `lat=59.4369&lon=10.6596` (altitude=20 for nøyaktighet)

**Headers:**
```
User-Agent: MossWeather/1.0 mail@glennmeling.com
Accept: application/json
```

### Respons-struktur (forenklet)

```ts
{
  properties: {
    meta: { updated_at: string, units: {...} },
    timeseries: [
      {
        time: "2026-04-18T12:00:00Z",
        data: {
          instant: { details: { air_temperature, wind_speed, humidity, ... } },
          next_1_hours: { summary: { symbol_code: "partlycloudy_day" }, details: { precipitation_amount } },
          next_6_hours: { ... },
          next_12_hours: { ... }
        }
      },
      ...
    ]
  }
}
```

### Caching-strategi

```ts
// lib/weather/met-client.ts
import { unstable_cacheLife as cacheLife } from 'next/cache';

export async function fetchMossWeather() {
  'use cache';
  cacheLife('minutes');       // revalidate ~hvert 10. min
  cacheTag('weather-moss');   // kan invalidere manuelt ved behov

  const res = await fetch(MET_URL, {
    headers: { 'User-Agent': 'MossWeather/1.0 mail@glennmeling.com' },
  });
  return transform(await res.json());
}
```

★ **Insight — hvorfor Cache Components, ikke `revalidate: 600`:** Next.js 16 anbefaler `use cache` + `cacheLife` over det gamle `fetch(..., { next: { revalidate } })`-mønsteret. Det gir oss tag-basert invalidering og fungerer sømløst med PPR (Partial Prerendering) hvis vi skulle utvide siden senere.

### MET-regler vi må følge

- ✅ Identifiserbar `User-Agent` (ellers HTTP 403)
- ✅ Respekter `Expires`-header (vi cacher lokalt i minutter uansett)
- ✅ Hvis vi får 304 Not Modified, bruk gammel data (ikke aktuelt med vår cache-strategi)
- ❌ Ikke hamre API-et — MET blokkerer ved misbruk
- 📄 [Terms of Service](https://api.met.no/doc/TermsOfService)

---

## 5. Datamodell (vår intern)

```ts
type WeatherSymbol =
  | 'clearsky_day' | 'clearsky_night'
  | 'partlycloudy_day' | 'partlycloudy_night'
  | 'cloudy' | 'fair_day' | 'fair_night'
  | 'lightrain' | 'rain' | 'heavyrain'
  | 'lightsnow' | 'snow' | 'heavysnow'
  | 'fog' | 'sleet' // ... ~40 totalt fra MET
  ;

type CurrentWeather = {
  temperature: number;          // °C
  feelsLike: number;            // beregnet (wind chill)
  symbol: WeatherSymbol;
  description: string;          // lokalisert, f.eks. "Lett regn"
  windSpeed: number;            // m/s
  windDirection: number;        // grader
  humidity: number;             // %
  pressure: number;             // hPa
  precipitationNext1h: number;  // mm
  updatedAt: Date;
};

type HourlyForecast = {
  time: Date;
  temperature: number;
  symbol: WeatherSymbol;
  precipitation: number;
  windSpeed: number;
};

type DailyForecast = {
  date: Date;
  tempMin: number;
  tempMax: number;
  symbol: WeatherSymbol;
  precipitation: number;
};

type SunTimes = {
  sunrise: Date;
  sunset: Date;
};
```

---

## 6. i18n-strategi (next-intl)

### Routing

- `/` → redirect til `/nb` (default locale)
- `/nb` → norsk
- `/en` → engelsk
- Locale-prefix alltid synlig (best for SEO)

### Ordbøker (utdrag)

```json
// i18n/messages/nb.json
{
  "meta": { "title": "Været i Moss", "description": "Live værmelding fra Meteorologisk institutt" },
  "sections": { "now": "Nå", "hourly": "Time for time", "daily": "7 dager", "details": "Detaljer" },
  "details": {
    "feelsLike": "Føles som",
    "wind": "Vind",
    "humidity": "Luftfuktighet",
    "pressure": "Lufttrykk",
    "sunrise": "Soloppgang",
    "sunset": "Solnedgang"
  },
  "weather": {
    "clearsky_day": "Klarvær",
    "partlycloudy_day": "Delvis skyet",
    "lightrain": "Lett regn"
    // ...
  }
}
```

```json
// i18n/messages/en.json
{
  "meta": { "title": "Weather in Moss", "description": "Live forecast from the Norwegian Meteorological Institute" },
  "sections": { "now": "Now", "hourly": "Hourly", "daily": "7 days", "details": "Details" },
  // ...
}
```

### Dato/klokkeslett

Bruker `next-intl`'s `useFormatter()` — håndterer automatisk "mandag 18. april" vs "Monday, April 18".

---

## 7. Theming (dark/light)

### Strategi

- `next-themes` provider i root layout
- `class="dark"` på `<html>` (Tailwind v4 dark mode)
- CSS-variabler i `globals.css` for farger
- Toggle: **light → dark → system**

### Dynamisk bakgrunn (bonus-lag)

Gradient som endrer seg basert på **både** tema **og** værtilstand:

| Værtilstand | Light mode | Dark mode |
|-------------|------------|-----------|
| Klarvær dag | `from-sky-300 to-blue-500` | `from-slate-800 to-blue-950` |
| Klarvær natt | `from-indigo-900 to-slate-900` | `from-indigo-950 to-black` |
| Overskyet | `from-slate-200 to-slate-400` | `from-slate-700 to-slate-900` |
| Regn | `from-slate-300 to-blue-400` | `from-slate-800 to-blue-900` |
| Snø | `from-slate-100 to-blue-200` | `from-slate-700 to-slate-900` |

Hero-bildet legges over med `mix-blend-overlay` og lav opacity for å gi stedstilhørighet uten å dominere.

★ **Insight — hvorfor begge (tema + værtilstand):** Ren theming (dark/light) gir tilgjengelighet og brukerkontroll. Værbasert bakgrunn gir personlighet. Kombinasjonen betyr at dark mode i regn ser annerledes ut enn dark mode i klarvær — siden føles *levende* uten å bli kaotisk.

---

## 8. Designretning

### Layout (mobile first → desktop)

```
┌────────────────────────────────────────┐
│  [logo]        [nb|en]  [☀︎/☾ toggle] │  ← Header (sticky)
├────────────────────────────────────────┤
│                                        │
│         🌤  14°                        │
│                                        │
│       Delvis skyet i Moss             │  ← Hero (stor, luftig)
│       Oppdatert 12:43                  │
│                                        │
│   [Moss havn gradient bakgrunn]        │
├────────────────────────────────────────┤
│  Føles som 12°   Vind 4 m/s V          │
│  Fukt 67%        Trykk 1013 hPa        │  ← Details grid
│  Soloppgang 05:41  Solnedgang 20:12    │
├────────────────────────────────────────┤
│  Time for time                         │
│  ←[12] [13] [14] [15] [16] [17] [18]→  │  ← Horizontal scroll (24t)
├────────────────────────────────────────┤
│  7 dager                               │
│  Man  🌧  8°/14°  2.3mm                │
│  Tir  ⛅  6°/12°  0.0mm                │  ← Daily grid
│  ...                                   │
├────────────────────────────────────────┤
│  Kilde: MET Norway • api.met.no        │  ← Footer
└────────────────────────────────────────┘
```

### Visuelle prinsipper

- **Typografi:** Store tall (`text-8xl`) for temperatur, `tabular-nums` for konsistens
- **Kort:** `rounded-2xl`, subtile skygger, `backdrop-blur` for glassmorfisme-effekt over hero
- **Mellomrom:** Generøs padding, ingen tett-pakket UI
- **Animasjoner:** Kun ved tema-bytte og scroll. Ingen pulsering eller unødvendig bevegelse
- **Tilgjengelighet:** WCAG AA kontrast i begge temaer, `prefers-reduced-motion` respekteres

---

## 9. Komponenter (shadcn)

Installeres via shadcn MCP:

| Komponent | Bruk |
|-----------|------|
| `card` | Kort for current weather, details, daily forecast |
| `button` | Theme toggle, language switcher |
| `scroll-area` | Horizontal hourly forecast |
| `tabs` | (valgfritt) Today/Tomorrow/Week |
| `skeleton` | Loading states |
| `separator` | Visuelle skiller |
| `tooltip` | Forklar forkortelser (m/s, hPa) |

---

## 10. Hero-bilde (Nano Banana)

**Prompt:**
> Atmospheric cinematic landscape photograph of Moss Norway coastal fjord town at golden hour, dramatic Nordic sky with scattered cumulus clouds catching warm sunset light, calm fjord water reflecting colors, distant harbor silhouette with small boats, moody editorial photography, rich warm tones, depth and atmosphere, wide angle, shallow depth of field, soft natural light

**Innstillinger:**
- Provider: `gemini` (Nano Banana)
- Aspect ratio: `16:9`
- Image size: `2K`
- Output: `public/images/moss-hero.jpg`

Bildet brukes som hero-bakgrunn med lav opacity + gradient overlay for stemning, ikke som hovedfokus.

---

## 11. Faser

### Fase 1 — Scaffolding
- `create-next-app` (TS, Tailwind v4, App Router, Turbopack, ESLint)
- Init git-repo
- Installer deps: `next-intl`, `next-themes`, `lucide-react`
- Init shadcn via MCP, legg til base-komponenter

### Fase 2 — MET API-integrasjon
- `lib/weather/types.ts` — TypeScript-typer for MET-respons
- `lib/weather/met-client.ts` — fetcher med `use cache` + `cacheLife`
- `lib/weather/transform.ts` — MET → vår datamodell
- Smoke-test: logg ut aktuelle data i en enkel server page

### Fase 3 — i18n + theming
- Konfigurer `next-intl` (routing, request, middleware)
- Lag `nb.json` + `en.json` med alle strings
- Sett opp `next-themes` i root layout
- Lag `language-switcher.tsx` + `theme-toggle.tsx`

### Fase 4 — Bildegenerering
- Generer hero-bilde med Gemini (Nano Banana)
- Plasser i `public/images/moss-hero.jpg`
- Last ned MET weather-icons til `public/weather-icons/`

### Fase 5 — UI-bygging
- `hero.tsx` — stor temp + symbol + bilde-bakgrunn + dynamisk gradient
- `current-weather.tsx` + `weather-details.tsx` — detaljer
- `hourly-forecast.tsx` — 24t horizontal scroll
- `daily-forecast.tsx` — 7d grid
- Sett sammen i `app/[locale]/page.tsx`

### Fase 6 — Polish
- Loading states (skeletons)
- Error boundary (feilet MET-kall → fallback UI)
- Metadata (OG-image, favicon, title per locale)
- Lighthouse-sjekk (mål: 95+ på alle)
- `npm run lint` + `tsc --noEmit` må være grønn

### Fase 7 — Deploy
- `vercel link` (via Vercel CLI/MCP)
- Første deploy (preview)
- Promote til production
- Sjekk live URL

---

## 12. Åpne spørsmål / risikoer

| Spørsmål | Forslag | Bekreft? |
|----------|---------|----------|
| Package manager? | `npm` (default, enkel) | ✅ bekreftet implisitt |
| Default locale? | `nb` (Moss er norsk by) | — |
| Skal vi vise UV-indeks? | MET har det ikke i `/complete`, men i `/airqualityforecast`. Hopper over i MVP. | — |
| Skal "nå" være `instant` eller `next_1_hours`? | `instant` for temp/vind, `next_1_hours` for symbol/nedbør | — |
| Skal tiden vises i lokal tid (Europa/Oslo)? | Ja, alltid. MET returnerer UTC. | — |
| Trengs sitemap/robots.txt? | Ja, enkel versjon for SEO | — |
| Hvor skal `PLAN.md` ligge til slutt? | Flyttes til `docs/PLAN.md` etter build, eller slettes | — |

---

## 13. Suksesskriterier for MVP

- [ ] Siden laster på under 1s (LCP)
- [ ] Viser korrekt vær for Moss fra MET
- [ ] Både `/nb` og `/en` fungerer med oversatt UI
- [ ] Dark/light-toggle fungerer og huskes på tvers av sidevisninger
- [ ] Responsiv fra 375px til 1920px
- [ ] Lighthouse ≥ 95 på Performance, Accessibility, Best Practices, SEO
- [ ] Deployed på Vercel med fungerende preview + production
- [ ] `npm run lint` og `tsc --noEmit` er grønn

---

## 14. Ikke-mål (scope-kontroll)

Vi bygger **ikke** følgende i MVP:

- ❌ Søk på andre byer (kun Moss)
- ❌ Historiske værdata
- ❌ Værvarsel via SMS/e-post
- ❌ Brukerkontoer eller personalisering
- ❌ Radar-kart
- ❌ PWA / offline-støtte (kan legges til senere)

---

**Klar for bygging når du gir klarsignal. 🚀**
