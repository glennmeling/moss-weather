# Moss Weather

Live værmelding for Moss basert på [MET Norway](https://api.met.no) sitt åpne API.

## Tech stack

- **Next.js 16** — App Router, Turbopack
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** — base-nova preset (bygget på base-ui)
- **next-intl** — i18n for norsk og engelsk
- **next-themes** — dark / light / system

## Funksjoner

- Nå-været med dynamisk gradient (reflekterer vær og tid på døgnet)
- Timeprognose for neste 24 timer (horisontal scroll)
- 7-dagers prognose med temperatur-range
- Dark / light mode (husker valg)
- Norsk + engelsk (`/nb`, `/en`)
- Responsiv (mobil + desktop)

## Utvikling

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) — omdirigeres til `/nb`.

## Bygg

```bash
npm run build
npm run start
```

## Lint og typecheck

```bash
npm run lint
npx tsc --noEmit
```

## Datakilde

Værdata er levert av [Meteorologisk institutt](https://api.met.no). Bruken følger deres [Terms of Service](https://api.met.no/doc/TermsOfService) — siden identifiserer seg med en `User-Agent` og cacher responsen i 10 minutter.

## Struktur

```
app/[locale]/      # Lokaliserte sider (nb, en)
components/        # UI-komponenter (hero, forecast, details)
components/ui/     # shadcn/ui
lib/weather/       # MET-klient, transform, typer
i18n/messages/     # Oversettelser
public/            # Hero-bilde (Gemini-generert), værikoner (MET)
proxy.ts           # next-intl locale-routing (Next.js 16 proxy convention)
```

## Koordinater

Moss: `59.4369°N, 10.6596°E` (altitude 20m)

## Lisens

Vær-ikonene i `public/weather-icons/` er fra [metno/weathericons](https://github.com/metno/weathericons) (MIT). Værdata fra MET Norway — fri bruk under CC-BY 4.0.
