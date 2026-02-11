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
For remote delivery features (email/SMS OTP and reminders), run the optional notification gateway in `server/notify-server.mjs` or deploy `server/notify-worker.mjs`.

Current app routes:

- `/` -> Calendar workspace
- `/safety` -> Safety Center (security, export/import, audit, panic wipe, profile hardening)
- `/home`, `/about`, `/privacy`, `/contact` -> product/marketing pages

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
- Relay-backed multi-device sync (`/api/sync`) plus local P2P sync
- Collaboration roles (`owner`, `editor`, `viewer`) with team member management
- Notification failover + retry queue (Node gateway and Worker)
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
- `VITE_NOTIFICATION_API` -> notification backend base URL (default: `/api`, for example `https://<worker>.workers.dev/api`)
- `VITE_NOTIFICATION_TOKEN` -> optional request token sent as `X-Nullcal-Token` / Bearer header by the frontend
- `VITE_SYNC_API` -> optional sync relay base URL (defaults to `VITE_NOTIFICATION_API` or `/api`)
- `VITE_SYNC_TOKEN` -> optional sync request token (defaults to `VITE_NOTIFICATION_TOKEN`)
- `VITE_NOTIFICATION_TOKEN` is bundled into client code; pair it with strict `NOTIFY_CORS_ORIGIN` + `NOTIFY_ALLOWED_RECIPIENTS`
- `NOTIFY_PROXY_TARGET` -> Vite dev proxy target for `/api` (default: `http://127.0.0.1:8787`)
- `NOTIFY_SERVER_PORT` -> optional notification server port (default: `8787`)
- `NOTIFY_CORS_ORIGIN` -> allowed origin(s) for notification server requests (recommended: exact site origin, comma-separated allowed); default is local dev origins only (`http://127.0.0.1:5173,http://localhost:5173`)
- `RESEND_API_KEY` and `NOTIFY_FROM_EMAIL` -> email delivery via Resend
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` -> SMS delivery via Twilio
- `TEXTBELT_API_KEY` -> optional SMS delivery via Textbelt (works in Node gateway and Worker)
- `TEXTBELT_FREE=1` -> use Textbelt free key (`textbelt`, very limited quota, useful for testing)
- `EMAIL_WEBHOOK_URL` and `SMS_WEBHOOK_URL` -> optional custom delivery webhooks (alternative to Resend/Twilio)
- `NOTIFY_ALLOWED_RECIPIENTS` -> optional recipient allowlist (`email:alerts@example.com,sms:+15551234567,*@example.com`)
- `NOTIFY_REQUEST_TOKEN` -> request token required by default for `/api/notify`; if missing, server returns 503 unless `NOTIFY_ALLOW_UNAUTH=1`
- `NOTIFY_ALLOW_UNAUTH=1` -> explicitly allow unauthenticated notify requests (not recommended)
- `NOTIFY_TRUST_PROXY=1` -> trust `X-Forwarded-For` for rate-limit client IP derivation (only enable behind a trusted proxy)
- `NOTIFY_RATE_LIMIT_MAX` and `NOTIFY_RATE_LIMIT_WINDOW_SEC` -> per-IP in-memory rate limit controls
- `NOTIFY_MAX_REQUEST_BYTES` -> max request size in bytes (default: `8192`)
- `NOTIFY_QUEUE_DISABLE=1` -> disable retry queue (enabled by default)
- `NOTIFY_QUEUE_RETRY_SEC`, `NOTIFY_QUEUE_MAX_ATTEMPTS`, `NOTIFY_QUEUE_MAX_ITEMS` -> queue retry/backlog controls
- `NOTIFY_SYNC_TTL_SEC`, `NOTIFY_SYNC_MAX_MESSAGES`, `NOTIFY_SYNC_MAX_PULL` -> sync relay retention and pull-window controls
- `NOTIFY_SYNC_MAX_REQUEST_BYTES` -> max accepted sync snapshot payload bytes (default: `524288`)

## Notification Gateway (Email/SMS)

Email/SMS 2FA and reminders require `POST /api/notify`.
Multi-device relay sync uses `POST /api/sync` and `GET /api/sync`.

### Local Node gateway

1. Start the gateway locally:

```bash
NOTIFY_REQUEST_TOKEN=dev-notify-token \
NOTIFY_CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173 \
npm run notify:server
```

2. Point the frontend to it:

```bash
VITE_NOTIFICATION_API=http://127.0.0.1:8787/api \
VITE_NOTIFICATION_TOKEN=dev-notify-token \
npm run dev
```

3. In Safety Center:
- Disable **Network lock** when you want remote delivery.
- Keep it enabled for strict offline mode.

### Free hosted gateway (Cloudflare Worker)

`server/notify-worker.mjs` is compatible with Cloudflare Workers free tier.

1. Deploy the worker:

```bash
npx wrangler deploy server/notify-worker.mjs --name nullcal-notify --compatibility-date 2026-02-11
```

This repo also includes `wrangler.jsonc`, so you can deploy with:

```bash
npm run notify:deploy
```

2. Add secrets/vars to the worker (choose any provider path):

```bash
# CORS
npx wrangler secret put NOTIFY_CORS_ORIGIN

# Optional hardening (recommended)
npx wrangler secret put NOTIFY_ALLOWED_RECIPIENTS

# Email path (free tier possible via Resend)
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put NOTIFY_FROM_EMAIL

# SMS path option A (Textbelt; free key has very small quota)
npx wrangler secret put TEXTBELT_API_KEY

# SMS path option B (Twilio)
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_FROM_NUMBER

# Optional rate limit tuning
npx wrangler secret put NOTIFY_RATE_LIMIT_MAX
npx wrangler secret put NOTIFY_RATE_LIMIT_WINDOW_SEC

# Optional queue tuning
npx wrangler secret put NOTIFY_QUEUE_RETRY_SEC
npx wrangler secret put NOTIFY_QUEUE_MAX_ATTEMPTS
npx wrangler secret put NOTIFY_QUEUE_MAX_ITEMS

# Optional sync relay tuning
npx wrangler secret put NOTIFY_SYNC_TTL_SEC
npx wrangler secret put NOTIFY_SYNC_MAX_MESSAGES
npx wrangler secret put NOTIFY_SYNC_MAX_PULL
npx wrangler secret put NOTIFY_SYNC_MAX_REQUEST_BYTES

# Required by default for /api/notify (client must send this header)
npx wrangler secret put NOTIFY_REQUEST_TOKEN
```

3. Build frontend against worker URL:

```bash
VITE_NOTIFICATION_API=https://nullcal-notify.<your-subdomain>.workers.dev/api \
VITE_NOTIFICATION_TOKEN=<same-token-value> \
npm run build
```

4. For GitHub Pages deployment, set repository variable:

- `VITE_NOTIFICATION_API=https://nullcal-notify.<your-subdomain>.workers.dev/api`
- `VITE_NOTIFICATION_TOKEN=<same-token-value>`

The workflow already reads this variable during build.

### Practical free-tier notes

- Email can be no-cost on free tier quotas (for example Resend free tier).
- Reliable unlimited SMS is not truly free; Textbelt free key is quota-limited.
- If you want fully no-cost reminders long-term, prefer `local`, `push`, `telegram`, or `signal` channels.

## Scripts

- `npm run dev` -> ensure icons + start dev server
- `npm run notify:server` -> start notification/sync gateway (`/api/notify`, `/api/sync`)
- `npm run build` -> ensure icons, run hook-order guard, build, generate `404.html`
- `npm run preview` -> preview built output locally
- `npm run lint` -> run hook dependency order validator
- `npm run typecheck` -> TypeScript compile check (`tsc --noEmit`)
- `npm run test` -> run unit + integration + e2e smoke suites
- `npm run test:unit` -> run unit tests
- `npm run test:integration` -> run integration tests
- `npm run test:e2e` -> run build/e2e smoke tests

## Deployment

GitHub Actions workflow: `.github/workflows/deploy.yml`

- Triggers on pushes to `main` or `master`
- Resolves `VITE_BASE` automatically:
  - Uses `/` when `public/CNAME` exists
  - Otherwise uses `/<repo-name>/`
- Uses optional repository variable `VITE_NOTIFICATION_API` for production notification backend URL
- Publishes `dist/` to GitHub Pages

Custom domain in this repo:

- `public/CNAME` -> `nullcal.kamranboroomand.ir`

## Security Notes

- Export encryption and note encryption use Web Crypto with PBKDF2-derived AES-GCM keys.
- PIN/local passphrase hashes are PBKDF2-derived and verified client-side.
- TOTP is implemented client-side for offline-friendly MFA.
- Panic wipe removes IndexedDB, localStorage state, caches, and service workers.
- Network lock can be toggled in Safety Center. It blocks fetch/XHR/WebSocket/EventSource/sendBeacon at runtime.
- Notification gateway hardening includes origin enforcement, payload size limits, recipient allowlists, request-token enforcement (default), and per-IP rate limiting.

## Roadmap

- Move relay sync storage from in-memory to durable backing (KV/DB) for long retention
- Add collaborator invite acceptance + presence/status reconciliation
- Expand automated coverage with browser journey tests for core calendar workflows
- Add conflict-resolution policies for concurrent multi-device edits
