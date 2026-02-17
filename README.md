# Publication Platform

A franchise publication and lead management platform.

## Architecture

- `apps/api` — NestJS backend API (pages, leads, brands, email)
- `apps/admin` — Next.js admin portal (page editor, lead management)
- `apps/site` — Next.js public site (landing pages, deep dives, forms)
- `packages/shared` — Shared types and utilities

## Getting Started

```bash
pnpm install
pnpm dev
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001 | Backend REST API |
| Admin | http://localhost:3000 | Admin portal |
| Site | http://localhost:3002 | Public site |
