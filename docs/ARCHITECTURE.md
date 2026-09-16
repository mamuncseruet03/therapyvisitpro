# Architecture

## What this is

TherapyVisit Pro is a therapy-visit documentation and billing system for contract PT/OT/SLP therapy agencies: referral intake, therapist assignment, visit note documentation (evaluation/treatment/re-eval/recert/discharge), scheduling, invoicing, payroll, and compliance (audit logs, two-admin approval for record deletion).

This is a **Next.js migration of an original Base44 app** (a low-code platform product). The migration's hard requirement was pixel-perfect UI/UX parity with the original — same layout, colors, fonts, field names, and user flows — while replacing Base44's hosted backend with a real one.

A REST API was added afterward for external/programmatic access, and then the web UI itself was migrated onto that same REST API (see "REST-only frontend" below) — in preparation for a future rewrite of the backend in a different language/runtime (e.g. Go) without also having to rewrite the frontend.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Prisma 7** + **PostgreSQL** (via `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials provider, JWT session strategy, bcrypt password hashing)
- **Vitest** for unit tests (101 tests: RBAC, validation schemas, auth helpers, audit logger)
- **Tailwind + shadcn/ui** components (ported 1:1 from the Base44 original)

## REST-only frontend, one backend

```
┌─────────────────┐     ┌──────────────────┐
│   Web UI (React) │     │  External client  │
│  (session cookie)│     │ (Bearer API key)  │
└────────┬─────────┘     └─────────┬─────────┘
         │  fetch()                 │  fetch()
         │  via src/lib/api-client  │
         ▼                          ▼
              REST routes
           (src/app/api/v1/**)
                      │
                      ▼
        actions.js functions (unchanged)
     (src/app/**/actions.js, src/components/**/*-actions.js)
                      │
                      ▼
         requireAuth() / requireRole()
         (src/lib/auth/session.ts)
                      │
                      ▼
              Prisma → PostgreSQL
```

The web app and external API consumers now go through the **exact same REST routes** — the browser is just another REST client. Every page component calls a thin wrapper in `src/lib/api-client/<domain>.ts` (one file per backend domain, mirroring the `actions.js` files) instead of importing a server action directly. Each wrapper exports functions with the same names/signatures the old direct-import call sites used, so migrating a call site was a one-line import swap, not a rewrite.

This was **not** the original design — the web UI used to call server actions directly (in-process function calls, no HTTP hop), with REST existing only for external callers. It was migrated to be REST-only so that the backend (route.ts + actions.js + Prisma) can eventually be swapped for a different implementation (e.g. a Go service) by changing where the frontend's fetch calls point, without touching any page/component code. See "REST API base URL" below.

The `actions.js` files themselves were **never touched** by this migration — they still contain 100% of the business logic (Prisma queries, validation, audit logging), and REST routes are still thin wrappers around them, same as before. Only their *callers* changed: previously both page components and route.ts handlers imported them; now only route.ts handlers do.

What makes both session-cookie and bearer-token callers work through the same `requireAuth()` call: it checks for a NextAuth session cookie first, and if there isn't one, falls back to checking for an `Authorization: Bearer` header and looking up an `ApiKey` record in the database. Either way it returns the same `SessionUser` shape, so nothing downstream needs to know or care which auth method was used. The web UI relies on the cookie path (same-origin `fetch()` sends it automatically); the bearer-token path is for external/programmatic callers.

## REST API base URL

`src/lib/api-client/_fetch.ts` exports `apiUrl(path)`, which every api-client file uses instead of a bare `fetch("/api/v1/...")`. It prefixes `process.env.NEXT_PUBLIC_API_URL` (empty by default, so `apiUrl(path)` returns `path` unchanged and requests stay relative/same-origin — zero behavior change today). If the API is ever split into a separately-deployed service, pointing the whole frontend at it is a one-line env var change instead of touching the ~70 call sites across 18 files. See `.env.example`.

Note this only solves the URL half of a real split — cookie-based session auth doesn't survive a cross-origin split on its own (would need `SameSite=None` + a same-origin proxy, or the web UI switching to bearer tokens too). Not needed while frontend and API share an origin.

## Auth & authorization

- **Session-based** (web UI): NextAuth v5, Credentials provider, JWT strategy, 60-minute session. Config: `src/lib/auth/config.ts` / `auth.config.ts`.
- **Bearer-token-based** (REST): per-user `ApiKey` records, SHA-256 hashed at rest, generated/listed/revoked via `src/lib/auth/api-keys.ts`. A key inherits its owner's full role — there's no separate key-scoping.
- **`requireAuth()` / `requireRole(...types)`**: `src/lib/auth/session.ts` — the single choke point both auth methods flow through.
- **RBAC**: `src/lib/rbac/` — a route-level permission matrix (`RouteKey → UserType[]`) and a resource-action permission matrix, both keyed off `UserType` (`SUPERUSER | ADMIN | THERAPIST | COORDINATOR | HR | GUEST | CLIENT`).
- **`src/proxy.ts`** (formerly `middleware.ts` — renamed for Next.js 16, see below): gates every page route except `/api/auth`, `/api/v1`, and static assets, redirecting unauthenticated requests to `/login`. REST routes are excluded from this gate deliberately — they handle their own 401/403 responses as JSON rather than an HTML redirect, since a non-browser client can't follow a redirect meaningfully.
- **Audit logging**: `src/lib/audit/` — every mutating action logs who/what/when to the `AuditLog` table, visible at `/AuditLogs` and `GET /api/v1/audit-logs`.

## `middleware.ts` → `proxy.ts`

Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. This isn't just a rename: **the `proxy` runtime is always Node.js, whereas `middleware` defaulted to Edge Runtime.** This project's middleware needs the Prisma client (for the NextAuth Credentials provider's user lookup), and Prisma's Node.js driver adapter (`@prisma/adapter-pg`) can't run in Edge Runtime — it crashed in production (`next start`) on every authenticated page with `Failed to load external module node:path`. This was confirmed to be a pre-existing bug present in the app since `task-2` (where `middleware.ts` was first introduced), not something introduced later. Fixed by renaming to `proxy.ts` per Next.js 16's migration guide.

## Data model

20 Prisma models (`prisma/schema.prisma`), the core ones being:

- **User** — auth identity, `role` + `userType` (the real access-control field), optional link to a `Therapist` record
- **Patient** — demographics, insurance, therapy types, embedded JSON for responsible party / physicians / assigned therapists / visit counts
- **Therapist** — credentials, discipline (PT/OT/ST), rates, personal files & disciplinary actions (HR-gated in the UI)
- **VisitNote** — the largest model by far; every visit-type's full documentation (SOAP notes, ROM/strength eval, ADLs, goals, discharge, OASIS, signatures, etc.) stored as typed JSON columns rather than one column per field
- **Referral** / **ReferralAssignment** — intake → therapist assignment → accept/decline/schedule workflow
- **Invoice** / **InvoiceLineItem**, **Agency** / **AgencyContact** / **AgencyRate** — billing
- **Task**, **AuditLog**, **CompanyInfo**, **CommunicationNote**, **Announcement**, **CoordinatorTimeLog**, **DeletionRequest**, **Notification**, **DocumentLibrary** — supporting workflows
- **ApiKey** — bearer-token credentials for the REST API (added alongside the REST rollout)

## Directory layout

```
src/
  app/
    (auth)/login/            — public login page; calls POST /api/v1/auth/login via fetch
    (app)/<Domain>/          — one folder per page/domain: page.jsx (calls api-client) + actions.js
                                (business logic, called only by route.ts now — see below)
    api/
      auth/[...nextauth]/    — NextAuth handler
      upload/                — file upload endpoint
      v1/<domain>/           — REST API (see docs/API.md) — imports and calls actions.js functions
  components/                — shared UI; some domains keep actions.js alongside components
                                instead of under app/ (communication-actions.js, referral-actions.js,
                                dashboard-actions.js) when the feature is patient/dashboard-scoped
                                rather than its own page — same "only called by route.ts" rule applies
  lib/
    api-client/              — one *.ts file per backend domain; thin fetch() wrappers the frontend
                                calls instead of importing actions.js directly (_fetch.ts holds the
                                shared apiUrl()/handleResponse() helpers)
    auth/                    — session.ts (requireAuth/requireRole), config.ts (NextAuth), api-keys.ts
    api/                     — response.ts (shared REST response helpers)
    db/                      — Prisma client singleton
    rbac/                    — permission matrices
    audit/                   — audit log writer
    validations/             — Zod schemas
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Branch history

The backend was built incrementally across a linear chain of 22 branches (`task-1-project-setup` → `task-22-form-components`, each branching from the previous one's tip), each wiring one domain from mock data to real Prisma-backed server actions. `main` is a separate, earlier UI-only mock-data scaffold — not part of this chain, not the branch to build on.

The REST API and the `proxy.ts` fix were added the same way: implemented at the branch where each domain's actions first appear (or at `task-1`/`task-2` for the shared auth foundation), then merged forward through the rest of the chain and force-pushed, so every branch's history stays consistent and each branch remains independently buildable.

The **REST-only frontend migration** (converting every page/component from direct `actions.js` imports to `src/lib/api-client/*.ts`) was applied to **`task-22-form-components` only** — it's a new architectural direction layered on top of the already-built REST API, not "how each domain was originally built," so it wasn't propagated through the other 21 historical branches.

## Known gaps

- **File uploads are a PHI exposure risk, blocked on S3 credentials.** `src/app/api/upload/route.ts` writes to `public/uploads/` and Next.js serves that directory statically with no auth check on read — `requireAuth()` only gates the upload itself. Filenames are `randomUUID()`-based (not sequential/guessable), but any single leak of a URL (browser history, a referrer header, a shared link, a screenshot) exposes that file permanently with zero authentication, and there's no way to revoke access to a static path. **Fix requires migrating storage to S3 (or an S3-compatible service)** with signed/expiring URLs issued per-request after an auth check — this needs real credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / a bucket name, or equivalent for another provider) before it can be implemented. Not something to build against mocked credentials.
- **Zod validation is not wired into most server actions.** Schemas exist in `src/lib/validations/*.ts` for patients, agencies, therapists, and users, but only `VisitNotes/actions.js` and the login action actually call `.parse()`/`.safeParse()` — the other 15 of 17 domain `actions.js` files (and both component-colocated `*-actions.js` files) insert request data into Prisma with only ad-hoc coercion (`?.toUpperCase()`, `parseInt()`), no shape/type check. This got materially riskier after the frontend REST migration: previously only the web UI called these functions, and its own forms guaranteed roughly-correct shape by construction; now a bearer-token API caller can `POST`/`PATCH` arbitrary JSON directly, and malformed input either throws an unhandled 500 (e.g. `.toUpperCase()` on a non-string) or reaches Prisma as `NaN`/wrong-typed and fails with an opaque DB-level error instead of a clean `400`.
- Invite flow hardcodes a default password (`"changeme123"`, in `UserManagement/actions.js`, both the invite and sync-therapists paths) — invited users are expected to change it, but nothing currently forces that.
- No CI (`.github/workflows` doesn't exist) and no test coverage beyond the 9 unit test files under `src/lib/` (RBAC, validation schemas, auth helpers, audit logger) — no tests for any `actions.js` function, REST route, or end-to-end flow.
- `src/components/visits/VisitNoteForm.jsx` is ~1400 lines. It already extracts many evaluation/tab subsections into their own components (`ReevalTab.jsx`, `NomncTab.jsx`, `SignatureTab.jsx`, `ROMEvaluationSection.jsx`, etc.) — the remaining bulk is the other tab bodies (Intake, Vitals, Subjective, Objective, Goals & Plan, ...) that were never extracted, following the same pattern inconsistently.
- PDF generation/import (invoice PDF, Excel export, visit note PDF, referral PDF import) — needs `jspdf`/`xlsx`/`pdf-parse`, not yet added
- Session timeout warning / auto-logout / user impersonation — UI-only features, not yet implemented
- No API-key management UI yet (keys are issued via `src/lib/auth/api-keys.ts` directly — see `docs/API.md`)
- No rate limiting or CORS configuration on `/api/v1/*` (not needed yet — frontend and API share an origin, no external browser-based caller exists)
- `src/app/(auth)/login/actions.js` (the pre-migration `loginAction` server action) is now dead code, left in place unreferenced rather than deleted

## Fresh clone: Prisma client generation

`prisma/schema.prisma` generates the client to a custom path (`src/generated/prisma/`, gitignored like any build artifact) instead of the default `node_modules/@prisma/client`. `package.json` has a `postinstall: "prisma generate"` hook so this happens automatically on `npm install`. If you ever see `Module not found: Can't resolve '@/generated/prisma/client'`, run `npx prisma generate` manually — it usually means `node_modules` was restored/copied without a full `npm install` running.
