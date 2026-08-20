# TaskFlow — Frontend

Next.js client for TaskFlow, a full-stack task management app.

This is **Tier 0**: scaffolding, config, and boot-up only. No auth, no task
UI or business logic yet — that starts in Tier 1.

## Stack

- Next.js 15 (App Router, TypeScript strict)
- React 19
- Tailwind CSS v4
- `@tanstack/react-query` for server state
- `zustand` for client state
- `axios` for HTTP
- `react-hook-form` + `zod` for forms/validation
- `framer-motion` for animation
- `lucide-react` for icons

## Prerequisites

- Node.js 20+
- npm
- The `taskflow-backend` API running (see its README) — or at least reachable
  at the URL you set in `.env`.

## Setup

```bash
npm install
cp .env.example .env
# then set NEXT_PUBLIC_API_URL to your backend's URL
```

## Running

```bash
npm run dev     # dev server, http://localhost:3001 (or next available port)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint
```

## Project structure

```
app/
  layout.tsx       # root layout, wraps app in Providers
  providers.tsx     # QueryClientProvider wrapper
  page.tsx           # placeholder home page
lib/
  api.ts               # shared axios instance (withCredentials, NEXT_PUBLIC_API_URL)
```

## Roadmap

This repo is being built in tiers. Tier 0 (this one) is scaffolding only -
auth, task UI, and all business logic land in Tier 1 and beyond.
