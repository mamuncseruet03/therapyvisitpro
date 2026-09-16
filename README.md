# TherapyVisit Pro

A therapy-visit documentation and billing system for contract PT/OT/SLP therapy agencies — referral intake, therapist assignment, visit note documentation, scheduling, invoicing, payroll, and compliance. Next.js migration of an original Base44 app, with pixel-perfect UI parity and a real Prisma/Postgres backend replacing Base44's hosted platform.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system design and [`docs/API.md`](docs/API.md) for the REST API reference.

## Setup

```bash
npm install             # also runs `prisma generate` via postinstall
cp .env.example .env     # set DATABASE_URL, AUTH_SECRET, AUTH_URL
npx prisma migrate deploy
npx prisma db seed      # optional — loads demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Seeing `Module not found: Can't resolve '@/generated/prisma/client'`?** Prisma's generated client lives at `src/generated/prisma/` (a custom output path — see `prisma/schema.prisma`), which is gitignored like any other build artifact. `npm install` regenerates it automatically via `postinstall`; if you skipped a full `npm install` (e.g. only ran `npm ci --omit=optional` or copied `node_modules` from elsewhere), run `npx prisma generate` manually.

## Test accounts

All passwords: `demo123`

| Email | Role |
|---|---|
| `superadmin@therapyvisit.com` | Superuser |
| `admin@therapyvisit.com` | Admin |
| `sarah.johnson@therapyvisit.com` | Therapist (PT) |
| `michael.chen@therapyvisit.com` | Therapist (OT) |
| `james.rivera@therapyvisit.com` | Therapist (PTA) |
| `coordinator@therapyvisit.com` | Coordinator |
| `hr@therapyvisit.com` | HR |
| `guest@therapyvisit.com` | Guest |
| `client@therapyvisit.com` | Client |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm run start` | Production build + serve |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` / `npm run test:coverage` | Vitest unit tests |
| `npx tsc --noEmit` | Type check |
| `npx prisma generate` | Regenerate the Prisma client (auto-runs on `npm install` via `postinstall`) |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npx prisma db seed` | Load demo data |

## Branches

The backend was built incrementally across `task-1-project-setup` through `task-22-form-components`, a linear chain where each branch wires one domain (patients, therapists, agencies, invoices, ...) to the real database. `task-22-form-components` has everything. `main` is a separate, earlier UI-only scaffold — not part of that chain.
