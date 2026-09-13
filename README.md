# Loop — Retro Music Player

Loop is a retro iPod-inspired web music player built with **Next.js (App Router) + TypeScript**. It recreates the classic skeuomorphic click-wheel experience — rotating to scroll, center button to select, quadrant buttons for Menu / Play-Pause / Next / Previous — on top of a modern streaming architecture.

The core idea is a **separation of metadata and audio**:

- **Metadata** (playlists, tracks, artists, albums) comes from **Spotify playlist data** (public playlist import + local demo seed) and is persisted in **PostgreSQL via Prisma**.
- **Audio** is streamed through a **pluggable music-provider abstraction**, implemented by default with a **JioSaavn API wrapper** — Spotify is never used for playback.

On top of that, Loop adds offline downloads (IndexedDB + PWA service worker), favorites / history / stats, a virtual equalizer + visualizer, 3D Cover Flow, theming, and **Party Rooms** — shared listening rooms synced over Server-Sent Events.

## Features

- **Virtual Click Wheel** (`src/components/ipod/ClickWheel.tsx`, `src/hooks/useClickWheel.ts`)
  - Unified touch + mouse rotation to scroll lists, with mechanical tick sounds (`useSounds`) and optional haptic feedback (`useHaptic`).
  - Center button selects; quadrants map to Menu (back), Play/Pause, Next, Previous. Keyboard shortcuts included (`useKeyboard`).
- **Classic iPod UI & navigation**
  - Skeuomorphic screen (`Screen.tsx`, `StatusBar.tsx`), slide left/right transitions (Framer Motion), hierarchical menu system driven by a Zustand navigation store (`navigation-store.ts`).
  - Responsive shells: `DesktopShell`, `MobileShell`, composed by `LoopShell`.
- **Music library screens** (`src/components/screens/`)
  - Home, Music menu, Playlists, Playlist detail, Songs, Artists, Albums, Search, Now Playing, Favorites, Recently Played, Downloads, Stats, Cover Flow, Equalizer, Settings, Party.
- **Spotify metadata import (no OAuth, no login)**
  - Paste any public Spotify playlist URL → `POST /api/spotify/import-public` scrapes the public embed page (`open.spotify.com/embed/playlist/<id>`) and extracts track metadata into Postgres.
  - `POST /api/spotify/sync` seeds demo playlists/songs for local development.
  - There is **no NextAuth/Auth.js login flow** — the app uses a single local user (`src/lib/user.ts`, `spotifyId = "local-loop-user"`). Legacy `SPOTIFY_CLIENT_ID / AUTH_SECRET` keys may exist in `.env` but are unused by the current code.
- **Pluggable audio provider**
  - All playback code depends only on the `MusicProvider` interface (`src/providers/music-provider.ts`: `searchSong`, `getSong`, `getStreamUrl`, `download`).
  - Default implementation is `JioSaavnProvider` (`jiosaavn-provider.ts`), resolved via `provider-registry.ts`. Swap backends without touching UI/player code.
- **Playback engine**
  - `AudioEngine` + `useAudioPlayer` + `playback.ts` + Zustand `player-store` handle queue, shuffle/repeat, seek, volume, sleep timer, and history logging.
  - Audio output via HTML5 Audio with Howler.js; song matching (`SongMatch` table) links a library `Song` to a provider stream URL + quality.
- **Offline & PWA**
  - `public/manifest.webmanifest` for installability, `public/sw.js` for app-shell + album-art caching with offline fallback.
  - Downloads stored as raw audio bytes in **IndexedDB** (`loop-music` DB via the `idb` package, `src/utils/storage.ts`), tracked server-side in the `Download` table.
- **Party Rooms (listen together)**
  - Create/join a 4-character room code, share one playback state (track, position derived from timestamps, playing/paused).
  - Live updates over **Server-Sent Events** (`GET /api/rooms/[code]/events`), state mutations via REST, revision counter (`rev`) for ordering. Rooms auto-expire after 72h of inactivity.
- **Settings & theming** (`settings-store.ts`, `Settings` table)
  - Dark mode, classic colorways (Classic, Black, Pink, Blue, Green), playback quality, click sounds, haptic toggle, cache-size budget, sleep timer.

## How it works

### 1. Metadata flow (Spotify → Postgres → UI)

```
User pastes Spotify playlist URL (Search/Playlists screen)
  → POST /api/spotify/import-public { url }
  → server fetches open.spotify.com/embed/playlist/<id>
  → parses __NEXT_DATA__ JSON for playlist + track metadata
  → upserts User / Playlist / Song rows in Postgres (Prisma)
  → UI reads via GET /api/spotify/playlists + /api/music/search?type=...
```

TanStack React Query (`Providers.tsx`) caches these reads client-side (60s stale time, no refetch on focus).

### 2. Audio flow (JioSaavn → player)

```
User presses Play on a Song
  → client calls GET /api/music/search?q=<title artist>
  → server uses MusicProvider.searchSong() against JioSaavn wrapper
  → best match saved as SongMatch { providerId, providerSongId, streamUrl, quality }
  → client calls GET /api/music/stream?id=<providerSongId>
  → provider.getStreamUrl() returns direct audio URL
  → AudioEngine plays it (HTML5 Audio / Howler)
```

The provider caches `id → streamUrl` from search results because the wrapper API has no by-id lookup. Downloads use `provider.download()` → bytes saved to IndexedDB, `POST /api/downloads` records the `fileKey`.

### 3. Offline flow

1. Online: stream normally; service worker caches app shell + album art on the fly.
2. User taps Download → audio bytes stored in IndexedDB (`audio-<songId>`), metadata in Postgres.
3. Offline: `useOffline` detects loss of connectivity; player resolves `IndexedDB blob URL` instead of network stream; navigations fall back to cached `/`.

### 4. Party Room flow

```
Host: POST /api/rooms { name } → { code } (e.g. "K7Q2")
Guests: POST /api/rooms/[code]/join { memberId, name }
Sync: GET /api/rooms/[code]/events (SSE, ~1s poll server-side, heartbeat 15s)
Control: PATCH /api/rooms/[code]/state { trackId, positionMs, playing, rev }
Leave: POST /api/rooms/[code]/leave
```

`useRoomSync` hook applies remote state to the local player store. `Room.rev` + `lastActiveAt` handle ordering and 72h TTL expiry (`expireIfStale`).

### 5. Click-wheel → navigation flow

Rotation angle from pointer events → menu index delta → tick sound + haptic → Zustand `navigation-store` pushes/pops screens → Framer Motion slide transition renders the new screen inside `Screen.tsx`.

## Services used (in detail)

| Service / Layer | What it is | How Loop uses it | Where |
|---|---|---|---|
| **Next.js 16 (App Router) + React 19** | Full-stack framework; server routes + client components | All pages, layouts, and `src/app/api/*` REST + SSE endpoints | `src/app/` |
| **PostgreSQL** | Primary database | Stores users, playlists, songs, matches, favorites, history, downloads, settings, rooms | `DATABASE_URL`, `prisma/schema.prisma` |
| **Prisma ORM v7 + `@prisma/adapter-pg`** | Type-safe DB access | Schema, migrations, generated client; `prisma generate` runs on build/postinstall | `prisma/`, `src/lib/prisma.ts` |
| **JioSaavn API wrapper** (default `https://saavn.sumit.co`, configurable) | External unofficial search/stream API | `searchSong`, stream URL resolution, downloads. No API key needed | `NEXT_PUBLIC_JIOSAAVN_API_URL`, `src/providers/jiosaavn-provider.ts` |
| **Spotify (public embeds only)** | Metadata source | Public playlist import by scraping the embed page; demo seed data. **No OAuth, no Spotify playback, no API calls with a token** | `src/app/api/spotify/` |
| **IndexedDB (`idb`)** | Browser-side binary storage | Offline audio bytes (`loop-music` DB, `audio-files` store, indexed by `songId`) | `src/utils/storage.ts`, `useOffline.ts` |
| **Service Worker + Web Manifest** | PWA offline shell | Caches `/`, sounds, manifest; runtime-caches album art; offline navigation fallback | `public/sw.js`, `public/manifest.webmanifest` |
| **Zustand** | Client state | Player, navigation, settings, room stores | `src/stores/` |
| **TanStack React Query** | Server-state cache | Caches playlist/search API reads | `src/components/Providers.tsx` |
| **Howler.js + HTML5 Audio** | Audio output | Actual sound playback, volume/seek/queue control | `src/components/player/AudioEngine.tsx`, `src/hooks/useAudioPlayer.ts`, `src/lib/playback.ts`, `src/lib/audio-registry.ts` |
| **Tailwind CSS v4 + shadcn/ui + Framer Motion + lucide-react** | Styling / UI / animation / icons | Skeuomorphic iPod shell, menus, dialogs, sliders, transitions | `src/components/`, `src/app/globals.css` |
| **Neon / Supabase (compatible)** | Hosted Postgres options | Any Postgres connection string works; connection example for Supabase in `.env.example` | `DATABASE_URL` |

### Data model (Postgres)

- `User` — single local user (`spotifyId = "local-loop-user"`), owns everything below.
- `Playlist` ↔ `Song` (many-to-many) — imported library.
- `SongMatch` — links a `Song` to a provider stream (`providerId`, `providerSongId`, `streamUrl`, `quality`).
- `Favorite`, `History`, `Download` (`fileKey` → IndexedDB key), `Settings` (theme, quality, toggles).
- `Room` (`code` unique, `rev`, `state` JSON, `lastActiveAt`) + `RoomMember` — party state.

### API reference

| Method & path | Purpose |
|---|---|
| `GET /api/music/search?q=…` / `?type=all\|albums\|artists` | Search DB + provider; list library grouped views |
| `GET /api/music/stream?id=…&provider=…` | Resolve playable stream URL via provider |
| `POST /api/spotify/import-public { url }` | Import public Spotify playlist metadata |
| `POST /api/spotify/sync` | Seed demo playlists/songs |
| `GET /api/spotify/playlists` | List stored playlists |
| `GET/POST /api/favorites`, `GET/POST /api/history`, `GET/POST/DELETE /api/downloads` | Library extras (persisted per local user) |
| `POST /api/rooms`, `GET/PATCH /api/rooms/[code]`, `GET /api/rooms/[code]/events` (SSE), `POST …/join`, `POST …/leave`, `PATCH …/state` | Party rooms |
| `GET /api/time` | Server time (used for position-sync math) |

Images allowed via `next.config.ts` remote patterns: `i.scdn.co`, `*.scdn.co`, `mosaic.scdn.co`, `c.saavncdn.com`, `*.saavncdn.com`, `images.unsplash.com` (demo art).

## Tech stack

- **Framework**: Next.js 16 (App Router, standalone output), React 19, TypeScript
- **Styling/UI**: Tailwind CSS v4, shadcn/ui, Framer Motion, lucide-react
- **State**: Zustand (client), TanStack React Query (server cache)
- **Database**: PostgreSQL + Prisma ORM v7 (`pg` driver)
- **Audio**: HTML5 Audio, Howler.js
- **Offline**: IndexedDB (`idb`), service worker, web manifest
- **Sync**: SSE-based party rooms, REST + JSON state

## Project structure

```
src/
  app/                 # routes: page.tsx, layout.tsx, api/*
    api/
      music/           # search, stream (provider-backed)
      spotify/         # import-public, playlists, sync (metadata only)
      favorites|history|downloads|time
      rooms/           # create, state, join/leave, SSE events
  components/
    ipod/              # LoopShell, ClickWheel, Screen, StatusBar, shells
    screens/           # HomeMenu, Playlists, NowPlaying, Party, Stats, ...
    player/            # AudioEngine
    ui/                # shadcn primitives (button, dialog, slider, ...)
  providers/           # MusicProvider interface, JioSaavn impl, registry
  stores/              # player, navigation, settings, room (Zustand)
  hooks/               # useAudioPlayer, useClickWheel, useOffline, useRoomSync, ...
  lib/                 # prisma, user (local), rooms, playback, audio-registry
  utils/               # storage (IndexedDB), format, haptic
  types/               # music, player, navigation, room, settings
prisma/                # schema.prisma, migrations/
public/                # manifest.webmanifest, sw.js, icons/, sounds/
```

## Getting started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local, Neon, or Supabase)
- (Optional) A self-hosted JioSaavn API wrapper URL — defaults work out of the box

### Installation

1. Clone and install:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Set at minimum:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/loop_db?schema=public"
   NEXT_PUBLIC_JIOSAAVN_API_URL="https://saavn.sumit.co"
   NEXT_PUBLIC_MUSIC_PROVIDER="jiosaavn"
   ```

3. Push schema and generate the client:
   ```bash
   npx prisma db push
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

### Scripts

| Script | Command | Purpose |
|---|---|---|
| dev | `next dev` | Local development |
| build | `prisma generate && next build` | Production build |
| start | `next start` | Serve production build |
| lint | `eslint` | Lint |

## Pluggable music provider architecture

All audio access goes through `MusicProvider` (`src/providers/music-provider.ts`). To add a backend (e.g. a self-hosted catalog or another API):

1. Implement `searchSong`, `getSong`, `getStreamUrl`, `download`.
2. Register it in `src/providers/provider-registry.ts`.
3. Point `NEXT_PUBLIC_MUSIC_PROVIDER` at its name.

No UI, store, or API-route changes are needed — consumers only use the interface.
