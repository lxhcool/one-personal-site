# Project Instructions

This repository is a production-style personal site maintained with substantial AI assistance. Prefer simple, explicit architecture and automated verification over additional infrastructure.

## Architecture

- Keep the three applications separate:
  - `lxhcool-frontend`: Nuxt 3 / Vue 3 public site.
  - `lxhcool-admin`: Vite / React administration app.
  - `lxhcool-backend`: NestJS / Prisma / PostgreSQL API.
- Keep the backend as a modular monolith. Do not introduce microservices, queues, Redis, or additional infrastructure without a demonstrated requirement.
- Public pages read from `/public/*` endpoints. Admin pages use `/admin/*` endpoints protected by `AdminAuthGuard`.
- All admin UI belongs in `lxhcool-admin`; do not add admin routes to the public Nuxt app.
- Keep controllers thin: validate input in DTOs, implement domain behavior in services, and access PostgreSQL through `PrismaService`.

## API And Data

- Successful API responses use `{ success: true, data }`. Errors use NestJS exceptions and real HTTP status codes.
- Do not hide API failures with empty arrays, fake content, `null`, or silent fallback data.
- Do not expose Prisma models directly as a frontend contract. When generated OpenAPI types are introduced, treat backend DTOs and OpenAPI as the source of truth and do not edit generated files.
- Database schema changes require a checked-in Prisma migration. Never use an in-memory or file-backed substitute for PostgreSQL.
- Preserve publishing rules: public queries return only `PUBLISHED` records, while admin queries may return every status.
- Validate structured JSON such as `Post.media` and `SiteWidget.config` at API boundaries when adding or changing its shape.

## Authentication And Media

- Registration currently uses `ADMIN_REGISTRATION_CODE`; do not restore the unused email-verification flow without an explicit product decision.
- Passwords remain hashed with Argon2. Sessions remain signed HttpOnly cookies.
- Do not bypass `AdminAuthGuard` for development convenience.
- Upload endpoints must remain authenticated and enforce file type and size limits.
- Uploaded media is currently local-disk storage. Do not assume it is safe for multi-instance deployment.

## Frontend Boundaries

- Pages compose features and entities; entity API modules own public API calls and entity types.
- Keep layouts focused on application shell concerns. Move complex interaction state, coordinate calculations, and editor messaging into composables or feature components.
- Widget behavior belongs under `components/widgets` until that area is deliberately migrated. Do not create a second parallel Widget implementation under `shared`.
- Preserve the existing design system and verify UI changes at desktop and mobile sizes.
- Never overwrite unrelated uncommitted UI changes.

## Verification

Run the root verification command after cross-application or architectural changes:

```bash
npm run verify
```

For focused changes, run the relevant command:

```bash
npm run check:backend
npm run check:frontend
npm run check:admin
npm run test:admin
```

Backend behavior changes should include focused tests when a test harness is available, especially for authentication, publishing, uploads, and migrations. UI work should also be checked in the browser when visual behavior changes.
