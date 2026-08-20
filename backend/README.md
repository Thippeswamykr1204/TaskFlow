# TaskFlow — Backend

NestJS API for TaskFlow, a full-stack task management app.

This is **Tier 0**: scaffolding, config, and boot-up only. No auth, no task
domain logic yet — that starts in Tier 1.

## Stack

- NestJS (TypeScript, strict mode)
- MongoDB Atlas + Mongoose (`@nestjs/mongoose`)
- Config validated with Zod at boot (`@nestjs/config`)
- `class-validator` / `class-transformer` for request validation
- Swagger docs (`@nestjs/swagger`)
- `helmet` for HTTP security headers
- `@nestjs/throttler` for rate limiting

## Prerequisites

- Node.js 20+
- npm
- A MongoDB Atlas cluster (or any reachable Mongo URI) — you provide the
  connection string yourself, this repo never ships one.

## Setup

```bash
npm install
cp .env.example .env
# then fill in MONGO_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

The app validates `.env` on boot with Zod and will refuse to start if
`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, or `PORT` are missing
or malformed — see `src/config/env.validation.ts`.

## Running

```bash
npm run start:dev   # watch mode
npm run build        # compile to dist/
npm run start:prod   # run compiled build
npm run test          # unit tests
npm run test:e2e      # e2e tests
```

Once running:

- Health check: `GET http://localhost:3000/health` -> `{ "status": "ok" }`
- Swagger docs: `http://localhost:3000/api/docs`

## Project structure

```
src/
  app.module.ts       # root module - Config, Mongoose, Throttler wiring
  main.ts              # bootstrap - helmet, CORS, ValidationPipe, filter, swagger
  config/
    env.validation.ts   # Zod schema + fail-fast validator
  common/
    filters/
      http-exception.filter.ts   # Tier 0 stub - real error codes land in Tier 2
```

## Roadmap

This repo is being built in tiers. Tier 0 (this one) is scaffolding only -
auth, task CRUD, and all business logic land in Tier 1 and beyond.
