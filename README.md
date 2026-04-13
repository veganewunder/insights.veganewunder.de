# Veganewunder Insights Dashboard

Produktionsnahes Grundgeruest fuer ein internes Creator Insights Dashboard auf Basis von Next.js 15, TypeScript, Tailwind und Supabase.

## Enthalten

- `src/app` Struktur mit `login`, `dashboard`, `dashboard/client/[slug]` und `share/[token]`
- Realistische Dummy Dashboards fuer Instagram, Facebook und YouTube
- Gemeinsame KPI Struktur mit plattformunabhaengigen Keys
- Vorbereitete Meta und YouTube Service Layer
- Vorbereitete API Routen fuer OAuth und Sync
- Supabase Schema Vorschlag fuer gecachte Insight Daten
- Deutsche UI Texte und monochromes Reporting Layout

## Start

```bash
npm run dev
```

## Lokale Envs

Fuer lokale Entwicklung erwartet Next.js eine `.env.local` im Projektroot.

Der Projektroot in diesem Repo ist:

`/Users/chris/Entwicklungen/insights.veganewunder.de`

Wichtig:

- `.env.example` und `.env.local.example` sind nur Vorlagen
- Next.js laedt `.env.example` nicht automatisch
- echte Laufzeitwerte muessen in `.env.local` liegen
- `.env.local` darf nicht in `src/` oder einem Unterordner liegen
- nach jeder Aenderung an `.env.local` muss der Next Dev Server neu gestartet werden

Erwartete Meta Keys:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_ACCESS_TOKEN`
- `META_INSTAGRAM_ACCOUNT_ID`

Erwartete Supabase Keys fuer den serverseitigen Cache:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Zum lokalen Neustart:

```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```

Zur Debug-Pruefung in Development:

`/api/debug/env`

Fuer den ersten Datenimport:

- `supabase/schema.sql` in Supabase ausfuehren
- danach lokal `http://localhost:3000/api/sync` aufrufen
- erst danach liest das Dashboard bevorzugt aus Supabase statt direkt aus dem Live-Fetch

## Wichtige Ordner

- `src/lib/meta`
- `src/lib/youtube`
- `src/lib/insights`
- `src/components/dashboard`
- `supabase/schema.sql`
