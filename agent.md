# Agent Instructions

This project must be implemented as a normal production-style application, not a prototype and not a demo with silent fallbacks.

## Architecture

- Keep the project split:
  - `lxhcool-frontend`: Nuxt 3 / Vue 3 public frontend using FSD-oriented source boundaries.
  - `lxhcool-admin`: Vite React admin system, based on a lightweight shadcn-admin style architecture.
  - `lxhcool-backend`: NestJS API, Prisma, PostgreSQL.
- PostgreSQL is required. Do not replace database behavior with local files, in-memory stores, mock data, or fake success responses.
- Public pages must read from public API endpoints only.
- Admin pages must read from admin API endpoints and require authentication.
- All admin development belongs in `lxhcool-admin`. Do not add admin routes back into `lxhcool-frontend`.
- Shared response shape remains:
  - success responses: `{ success: true, data }`
  - error responses must use real HTTP status codes from NestJS exceptions.

## No Silent Fallbacks

- Do not hide API failures by returning empty arrays, `null`, fake content, or default demo data.
- Do not continue with placeholder secrets or fake credentials.
- Do not swallow exceptions except to add useful context and rethrow or show a clear error state.
- Do not make frontend pages appear successful when backend data failed to load.
- Do not add temporary file-based, in-memory, or hardcoded fallback storage.

## Configuration

- Required backend environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `RESEND_API_KEY`
  - `MAIL_FROM`
  - `FRONTEND_ORIGIN`
  - `PORT`
- Required frontend environment variables:
  - `NUXT_PUBLIC_API_BASE_URL`
  - `NUXT_PUBLIC_SITE_URL`
- Missing required configuration must fail fast with a clear error.
- `JWT_SECRET=change-me` or any `dev-only` secret is invalid.
- Local development values belong in `.env`, not hardcoded in application logic.

## Publishing Rules

- Public blog and project pages show only `PUBLISHED` records.
- Admin pages show all records, including `DRAFT` and `HIDDEN`.
- If a user expects content to appear on the public site, the admin UI must make the status visible and easy to set.
- New article and project forms should default to `PUBLISHED` unless the UI explicitly says it is creating a draft.
- When status changes to `PUBLISHED`, backend must set `publishedAt` if it is currently empty.
- When status changes away from `PUBLISHED`, backend may clear `publishedAt` only if that behavior is explicitly desired and documented.

## Auth

- Registration uses email verification through Resend.
- Passwords must be hashed with `argon2`.
- Sessions use signed HttpOnly cookies.
- Admin API routes must stay protected by `AdminAuthGuard`.
- Do not bypass auth for convenience during development.

## UI Quality

- Frontend and admin UI must look like finished product surfaces, not wireframes.
- Admin pages need clear hierarchy, consistent navigation, meaningful empty states, and visible status information.
- Tables must have clear actions and status labels.
- Forms must be grouped logically, with important fields visible and status controls easy to understand.

## Verification

Before reporting completion after code changes, run the relevant checks:

- Backend: `npm run build`
- Frontend: `npm run typecheck`
- If a bug involves frontend/backend integration, verify the relevant local HTTP endpoint directly.
