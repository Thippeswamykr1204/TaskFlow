# TaskFlow

A full-stack task management platform with Kanban boards, analytics, email notifications, file attachments, and location-aware weather context — built as a production-shaped monorepo, not a tutorial clone.

---

## Overview

TaskFlow lets users create, organize, and track tasks through multiple views — a list with filters, a drag-and-drop Kanban board, and an analytics dashboard — backed by a secure NestJS API with JWT authentication, file attachments, and email notifications.

It was built to go beyond CRUD: real session management, provider-abstracted third-party integrations, optimistic UI updates, and a themed design system rather than default component styling.

## Features

- **Authentication** — Register/login with hashed passwords (bcrypt, cost 12), short-lived JWT access tokens, and long-lived refresh tokens stored in HttpOnly cookies, backed by a session model (tracks device/IP per login).
- **Task management** — Full CRUD with title, description, status, priority, due date, tags, and subtasks; server-side filtering, search, and sorting.
- **Kanban board** — Drag-and-drop between Backlog / To Do / In Progress / Done via `dnd-kit`, with optimistic status updates.
- **Analytics** — Task distribution and completion trends visualized with Recharts.
- **Attachments** — File uploads on tasks via Cloudinary, with size/type validation.
- **Activity log** — Per-task audit trail of changes.
- **Email notifications** — Task-created and task-completed emails via Resend.
- **Location-aware weather** — Tasks can be tied to a city; the backend geocodes it and fetches live weather (OpenWeatherMap) behind a swappable provider interface, with in-memory caching to avoid redundant calls.
- **API documentation** — Auto-generated Swagger docs at `/api/docs`.

## Tech Stack

**Frontend** — Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix primitives) · TanStack Query · Zustand · React Hook Form + Zod · dnd-kit · Recharts · Framer Motion

**Backend** — NestJS 11 · MongoDB + Mongoose · Passport JWT · class-validator · Zod (env validation) · Helmet · Cloudinary SDK · Resend · Swagger

## Architecture

```
TaskFlow/
├── frontend/          Next.js 15 App Router client
│   ├── app/            Route groups: (auth), (dashboard)
│   ├── components/     UI primitives, dashboard, tasks, auth
│   ├── lib/             API client, hooks, Zustand store, validation schemas
│   └── types/
└── backend/            NestJS API
    └── src/
        ├── auth/         Register, login, refresh, sessions, JWT strategy
        ├── tasks/        CRUD, activity log, attachments
        ├── uploads/       Cloudinary integration
        ├── mail/          Resend email templates
        ├── location/      Geocoding + weather providers (interface-based)
        ├── common/        Global exception filter
        └── config/        Zod-validated environment schema
```

The frontend and backend are decoupled — the API is a standalone NestJS service consumable by any client, documented via Swagger.

Notable design choices:
- **Provider abstraction** — `location/providers/*.interface.ts` decouples the weather/geocoding logic from OpenWeatherMap specifically, so the provider is swappable.
- **Fail-fast config** — environment variables are validated with Zod at boot (`config/env.validation.ts`); the app refuses to start with missing/malformed config instead of failing silently at runtime.
- **Structured error responses** — a global exception filter returns consistent `{ error, message }` shapes instead of raw stack traces.

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB instance (Atlas or local)
- API keys: [Cloudinary](https://cloudinary.com), [Resend](https://resend.com), [OpenWeatherMap](https://openweathermap.org/api)

### 1. Clone and install

```bash
git clone https://github.com/thippeswamykr1204/TaskFlow.git
cd TaskFlow

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in `backend/.env`:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Distinct secrets, 16+ characters |
| `CORS_ORIGIN` | Frontend URL (default `http://localhost:3001`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
| `RESEND_API_KEY` / `EMAIL_FROM_ADDRESS` | From your Resend dashboard (use `onboarding@resend.dev` for local dev) |
| `OPENWEATHER_API_KEY` | From your OpenWeatherMap dashboard |

`frontend/.env` only needs:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run

```bash
# Terminal 1 — backend (http://localhost:3000)
cd backend && npm run start:dev

# Terminal 2 — frontend (http://localhost:3001)
cd frontend && npm run dev
```

API docs available at `http://localhost:3000/api/docs`.

### 4. Run tests

```bash
cd backend && npm run test
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Log in, receive access token + refresh cookie |
| `POST` | `/auth/refresh` | Rotate access token |
| `POST` | `/auth/logout` | End session |
| `GET` | `/auth/me` | Current user |
| `PATCH` | `/auth/me` | Update profile |
| `GET` | `/tasks` | List tasks (filter/search/sort) |
| `GET` | `/tasks/stats` | Aggregate task statistics |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks/:id` | Get a task |
| `PATCH` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |
| `GET` | `/tasks/:id/activity` | Task activity log |
| `POST` | `/tasks/:id/attachments` | Upload an attachment |
| `DELETE` | `/tasks/:id/attachments/:attachmentId` | Remove an attachment |
| `GET` | `/weather` | Weather for a given city |

Full request/response schemas are in Swagger at `/api/docs`.


## Roadmap

- [ ] Per-request task-ownership authorization tests
- [ ] E2E test suite (Playwright)
- [ ] CI pipeline (GitHub Actions)
- [ ] Team/workspace support beyond single-user tasks

## Author

**Thippeswamy** — [GitHub](https://github.com/thippeswamykr1204) · [Portfolio](https://thippeswamykr1204.github.io/Portfolio) · kollithippeswamy1204@gmail.com

## License

MIT