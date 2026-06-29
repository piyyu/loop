# Loop — Retro iPod Music Player

A production-ready Next.js 15 application built with the App Router and TypeScript. Loop looks and behaves like a classic skeuomorphic Apple iPod Classic. It integrates with Spotify for playlist/metadata syncing, and uses a pluggable music provider abstraction to stream actual audio from an external source (JioSaavn by default).

## Features

- **Virtual Click Wheel**: Unified touch and mouse interactions. Rotating scrolls list menus with subtle mechanical tick sounds and optional haptic feedback. Center selects, and quadrant buttons map to Play/Pause, Next/Previous, and Menu (Back).
- **Classic UI & Navigation**: Skeuomorphic iPod screen styling, slide left/right transitions, and a classic list-based menu hierarchy.
- **Spotify Metadata Sync**: Seamless login via Spotify OAuth to import user profile, playlists, and tracks without using Spotify for audio streaming.
- **Pluggable Music Provider**: Audio streams from an abstract provider layer. Includes a JioSaavn implementation by default.
- **Offline & PWA Support**: Manifest, service worker asset caching, and offline playback via IndexedDB audio storage.
- **Settings & Theming**: Dark Mode, classic color schemes (Classic, Black, Pink, Blue, Green), adjustable playback quality, and sleep timer.
- **Bonus Extras**: 3D Cover Flow, visualizer, virtual Equalizer, and statistics.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Auth.js / NextAuth v5 (Spotify OAuth)
- **Offline Storage**: IndexedDB (via `idb`)
- **Audio Handling**: HTML5 Audio & Howler.js

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (e.g., Neon or Supabase)
- Spotify Developer Account (for Client ID & Secret)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment variables template and fill in your details:
   ```bash
   cp .env.example .env
   ```

3. Setup the database and generate Prisma Client:
   ```bash
   npx prisma db push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. Note: Spotify OAuth redirects require using `127.0.0.1` rather than `localhost`.

## Pluggable Music Provider Architecture

To replace the streaming backend, implement the `MusicProvider` interface in `src/providers/music-provider.ts` and register it in `src/providers/provider-registry.ts`.
