# NullCal

<p align="left">
  <img src="public/logo-lockup-256.png" alt="NullCal logo" width="160" />
</p>

Local-first operations calendar with privacy-first controls, profile isolation, encrypted backups, and a dedicated Safety Center.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)

## Overview

NullCal is a React + TypeScript Progressive Web App for scheduling in high-privacy workflows.
It is built to run offline-first, keep data local by default, and provide operational security controls without requiring a backend for core use.

Current app routes:

- `/` -> Calendar workspace
- `/safety` -> Safety Center (security, export/import, audit, panic wipe, profile hardening)

## Core Features

- Multi-profile calendar workspaces with isolated events/calendars/templates
- Week and month scheduling views (FullCalendar) with drag/drop and resize
- Event creation wizard with reminders, recurrence, attendees, notes, and reusable templates
- 47 theme packs with dark/light variants and instant palette switching
- Local lock screen with PIN, decoy PIN, local passphrase, passkey, and biometric unlock options
- Two-factor support (OTP/TOTP flows) plus privacy-screen hotkey (`Cmd/Ctrl+Shift+P`)
- Encrypted export/import backups with export hygiene modes (`full`, `clean`, `minimal`)
- Event export formats: CSV, ICS, and JSON
- Audit log, auto-lock rules, decoy profile flow, and panic wipe
- PWA install support with service worker caching and standalone mode
- Built-in localization support: English (`en`), Russian (`ru`), Persian (`fa`)

## Tech Stack

- Frontend: React 18, TypeScript, Vite 5
- UI/Animation: Tailwind CSS, Framer Motion
- Calendar Engine: FullCalendar
- Local Persistence: IndexedDB (`idb`) + localStorage cache/audit
- Security Primitives: Web Crypto API (PBKDF2 + AES-GCM, hash-based verification)
- PWA: `vite-plugin-pwa` + Workbox runtime caching

## Architecture

Key directories:

- `src/app` -> app shell, store/provider wiring, top bar, sidebar, hotkeys
- `src/pages` -> main calendar page and Safety Center
- `src/storage` -> IndexedDB schema, persistence, cache, seed data, audit log
- `src/security` -> encryption, auth flows, export hygiene, reminders integrations
- `src/reminders` -> local reminder scheduler and secure ping adapters
- `src/theme` -> theme provider and theme packs
- `src/i18n` -> translations and localization helpers

Persistence model:

- IndexedDB database: `nullcal-db`
- Object stores: `profiles`, `calendars`, `events`, `templates`, `settings`, `securityPrefs`
- Local cache key: `nullcal:cache`
- Audit log key: `nullcal:audit`

## Quick Start

### Prerequisites

- Node.js 20+ recommended
- npm 10+

### Install and Run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

### Production Build

```bash
npm run build
npm run preview
```

`npm run build` also generates `dist/404.html` for GitHub Pages SPA fallback support.

## Configuration

Environment variables:

- `VITE_BASE` -> base path for deployment (for example `/NullCal/` on GitHub Pages)
- `VITE_NOTIFICATION_API` -> notification backend base URL (default: `/api`)

## Scripts

- `npm run dev` -> ensure icons + start dev server
- `npm run build` -> ensure icons, run hook-order guard, build, generate `404.html`
- `npm run preview` -> preview built output locally
- `npm run lint` -> run hook dependency order validator
- `npm run typecheck` -> TypeScript compile check (`tsc --noEmit`)

## Deployment

GitHub Actions workflow: `.github/workflows/deploy.yml`

- Triggers on pushes to `main` or `master`
- Resolves `VITE_BASE` automatically:
  - Uses `/` when `public/CNAME` exists
  - Otherwise uses `/<repo-name>/`
- Publishes `dist/` to GitHub Pages

Custom domain in this repo:

- `public/CNAME` -> `nullcal.kamranboroomand.ir`

## Security Notes

- Export encryption and note encryption use Web Crypto with PBKDF2-derived AES-GCM keys.
- PIN/local passphrase hashes are PBKDF2-derived and verified client-side.
- TOTP is implemented client-side for offline-friendly MFA.
- Panic wipe removes IndexedDB, localStorage state, caches, and service workers.
- Network lock is enforced in current app state logic, so outbound network-dependent integrations (for example email/SMS reminder delivery APIs) are constrained unless that behavior is intentionally relaxed.

## Roadmap

- Add real multi-device sync transport beyond local BroadcastChannel exchange
- Add robust backend adapters for remote notifications and OTP delivery
- Add automated test suites (unit + integration + E2E)
- Add role-based collaboration workflows for shared/team modes
