# Flexo Setup Tax — Capacity Audit

A client-side PWA (Progressive Web App) that quantifies flexo press setup time loss and models recovered capacity under different reduction scenarios.

## Architecture

- **Frontend-only calculator**: All logic runs client-side with React state
- **No backend API routes used** — the Express server just serves static files
- **PWA**: manifest.json + service worker for installability on iOS/Android

## Key Files

- `client/src/lib/calculations.ts` — All calculation logic, types, formatters, URL encoding/decoding, text generators
- `client/src/pages/home.tsx` — Main page with tabs (Inputs / Results / Snapshot), state management
- `client/src/components/audit-inputs.tsx` — Input form with operating mode toggle, number fields, reduction slider
- `client/src/components/audit-results.tsx` — Result metric cards + recharts bar chart
- `client/src/components/audit-snapshot.tsx` — Executive snapshot with summary text, copy/share/export actions
- `client/public/manifest.json` — PWA manifest
- `client/public/sw.js` — Service worker for offline caching

## Features

- Operating Mode Toggle (Conservative / Typical / Aggressive) with preset multipliers
- Auto-calculating results from inputs
- Bar chart comparing Setup Hours Lost vs Recovered Hours
- Copy Summary Text / Copy AM Follow-Up Email
- Share Link (encodes all inputs as URL query parameters)
- Export PDF via browser print dialog
- PWA installable via Add to Home Screen
- Mobile-first, responsive design

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS with shadcn/ui components
- Recharts for charts
- Wouter for routing (single page, "/" route)

## Running

- `npm run dev` starts Express + Vite dev server
- App accessible at the dev URL on port 5000
