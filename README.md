# Personal Site MVP

This workspace contains two independent projects:

- `lxhcool-frontend`: Nuxt 3 / Vue 3 public frontend with FSD-oriented source boundaries
- `lxhcool-admin`: Vite React admin system based on shadcn-admin architecture
- `lxhcool-backend`: NestJS API with Prisma/PostgreSQL schema

## Current Scope

Implemented as a simple MVP foundation:

- Public pages: home, blog list/detail, project list/detail, friend links
- Admin app: register, login, dashboard, and CRUD screens
- Backend modules: auth, posts, projects, friend links
- Prisma schema: `AdminUser`, `EmailVerificationCode`, `Post`, `Project`, `FriendLink`
- Auth: email verification registration through Resend, password login, signed HttpOnly Cookie session

Media upload, rich admin CRUD forms, Docker deployment, sitemap, and backups are intentionally left for later steps.

## Backend

```bash
cd lxhcool-backend
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Default port: `http://localhost:4000`

API documentation: `http://localhost:4000/api-docs`

Auth and email require these environment variables:

```env
JWT_SECRET=replace-with-long-random-secret
RESEND_API_KEY=re_xxxxxxxxx
MAIL_FROM=Personal Site <noreply@lxhcoool.cn>
FRONTEND_ORIGIN=http://localhost:3000
```

Before Resend can send from `noreply@lxhcoool.cn`, the domain `lxhcoool.cn` must be verified in Resend DNS settings.

## Frontend

```bash
cd lxhcool-frontend
copy .env.example .env
npm run dev
```

Default port: `http://localhost:3000`

Frontend required environment variables:

```env
NUXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000
```

## Admin

```bash
cd lxhcool-admin
copy .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 5173
```

Default port: `http://127.0.0.1:5173`

The admin app is a separate Vite + React + TypeScript project. It uses shadcn/ui components, TanStack Query, React Router, and the existing NestJS API.

## Verified

Both projects have been build-checked:

```bash
cd lxhcool-backend && npm run build
cd lxhcool-frontend && npm run typecheck
cd lxhcool-frontend && npm run build
```
