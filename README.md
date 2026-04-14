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

Erwartete Admin Keys fuer den internen Login:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

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

Wenn `share_links` bereits vor der Rechteverwaltung angelegt wurde, fuehre zusaetzlich dieses SQL aus:

```sql
alter table public.share_links
add column if not exists visible_sections_json jsonb not null default '[]'::jsonb;
alter table public.share_links
add column if not exists recipient_name_nullable text;
```

Wenn dein bestehendes Projekt bereits vor der Media Galerie aufgesetzt wurde, fuehre zusaetzlich dieses SQL aus:

```sql
create table if not exists public.media_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  media_id text not null,
  media_kind text not null check (media_kind in ('reel', 'story')),
  title text not null,
  caption text,
  platform_label text not null,
  media_type_label text not null,
  media_url text,
  permalink text,
  published_at timestamptz,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  sort_order integer not null default 0,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_snapshots_account_kind
  on public.media_snapshots (account_id, media_kind, sort_order);

alter table public.media_snapshots
add column if not exists archived_media_url text;
```

Wenn dein bestehendes Projekt noch kein Story-Archiv hat, fuehre zusaetzlich dieses SQL aus:

```sql
create table if not exists public.story_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  story_id text not null unique,
  media_url text,
  archived_media_url text,
  timestamp timestamptz,
  caption text,
  saved_at timestamptz not null default now()
);

alter table public.story_snapshots
add column if not exists archived_media_url text;

create index if not exists idx_story_snapshots_account_timestamp
  on public.story_snapshots (account_id, timestamp desc);
```

## Wichtige Ordner

- `src/lib/meta`
- `src/lib/youtube`
- `src/lib/insights`
- `src/components/dashboard`
- `supabase/schema.sql`
