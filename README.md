# Personal Site

This repository contains three independently built applications that form one personal-site system:

- `lxhcool-frontend`: Nuxt 3 / Vue 3 public site.
- `lxhcool-admin`: Vite / React administration app.
- `lxhcool-backend`: NestJS API backed by Prisma and PostgreSQL.

The backend is a modular monolith. Public and admin clients share the same API and database, while authentication and route boundaries keep their responsibilities separate.

## Architecture

```text
Nuxt public site  ── /public/* ──┐
                                 ├── NestJS API ── Prisma ── PostgreSQL
React admin app  ── /admin/* ────┘
                       /auth/*
```

Implemented domains include authentication, articles, moments, projects, friend links, categories, site widgets, media uploads, image thumbnails, and music metadata.

Admin authentication uses Argon2 password hashes and a signed HttpOnly Cookie session. New admin registration currently requires the configured `ADMIN_REGISTRATION_CODE`.

## Local Development

Create local environment files from each application's `.env.example`, install dependencies in all three application directories, then start everything from the repository root:

```bash
npm run dev
```

Services are available at:

- Public site: `http://127.0.0.1:3000`
- Admin app: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:4000`
- Swagger UI: `http://127.0.0.1:4000/api-docs`

Stop the local services with:

```bash
npm run dev:stop
```

PostgreSQL must be running and reachable through the backend `DATABASE_URL`. The backend creates local `uploads/images`, `uploads/audio`, and `uploads/videos` directories when it starts.

## Verification

Run all build and type checks from the repository root:

```bash
npm run verify
```

Focused checks are also available:

```bash
npm run check:backend
npm run check:frontend
npm run check:admin
npm run test:admin
```

The admin test suite currently has the broadest automated coverage. Backend integration tests and focused public-site tests remain priorities, especially around authentication, publishing, uploads, and Widget layout behavior.

## Deployment

The current deployment scripts build release archives, deploy them to versioned release directories, run Prisma migrations, switch the active symlink, and manage the Nuxt and NestJS processes with PM2. Uploaded media remains local-disk state and should be moved to shared persistent storage before multi-instance deployment.
