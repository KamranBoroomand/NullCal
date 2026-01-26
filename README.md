# NullCAL

NullCAL is a local-first, Photon-inspired calendar built with React, Vite, and TypeScript. It ships with multiple profiles, themed calendars, and a dark glass UI designed for focus.

## Features

- Week + month calendar views powered by FullCalendar
- Local-only profiles with independent calendars and events
- Drag, drop, resize, and modal editing for events
- Import/export profile data as JSON
- TailwindCSS-based Photon UI styling

## Getting Started

```bash
npm install
npm run dev
```

Open the URL printed by Vite to view the app.

## Build for Production

```bash
npm run build
npm run preview
```

The production build output is generated in `dist/` and includes a `404.html` fallback for GitHub Pages routing.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys the site to GitHub Pages.

1. In GitHub, go to **Settings → Pages**.
2. Under **Source**, select **GitHub Actions**.
3. Push to `main` (or `master`) and the workflow will publish `dist/`.

The site will be available at:

```
https://<user>.github.io/<REPO_NAME>/
```

The repository name is case-sensitive in the URL, and the workflow derives the base path automatically from the repo name to avoid mismatches.

## Data Storage

Profile data is stored locally in the browser under the `nullcal:v1` key. Use the Import/Export controls in the sidebar to back up or move profiles between devices.
