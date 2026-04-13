# Submission Guide

## What Is Included

- Persistent PostgreSQL storage for brands, pages, and leads (Prisma-based).
- pgAdmin in Docker Compose with configured credentials.
- Bug fix for template clone cross-page corruption.
- UTM capture to lead metadata without leaking into notes.
- Unit, integration, API e2e, and browser e2e coverage.
- CI pipeline with quality gates and container vulnerability scan.

## Local Setup

1. Ensure Docker is running.
2. Start DB and pgAdmin:

```bash
docker compose up -d postgres pgadmin
```

3. Install dependencies:

```bash
corepack pnpm install
```

4. Set env (PowerShell example):

```powershell
$env:DATABASE_URL='postgresql://publication:publication@127.0.0.1:5433/publication?schema=public'
$env:NEXT_PUBLIC_API_URL='http://localhost:3001'
$env:NEXT_PUBLIC_SITE_URL='http://localhost:3002'
```

5. Initialize schema:

```bash
corepack pnpm --filter @publication/api db:push
```

## Verification Commands

```bash
corepack pnpm --filter @publication/api test
corepack pnpm --filter @publication/site test
corepack pnpm --filter @publication/api build
corepack pnpm --filter @publication/admin build
corepack pnpm --filter @publication/site build
corepack pnpm e2e
```

## Credentials

- PostgreSQL:
  - host: localhost
  - port: 5433
  - database: publication
  - user: publication
  - password: publication
- pgAdmin:
  - url: http://localhost:5050
  - email: admin@publication.local
  - password: Raju2006

## CI Gates

Workflow: `.github/workflows/ci.yml`

- Lint
- Test
- Build
- Browser e2e (Playwright)
- Trivy container/filesystem scan
- Deploy gate job that requires all above to pass
