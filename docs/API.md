# REST API Reference

TherapyVisit Pro exposes a REST API under `/api/v1`. This is not just an external-facing API — **the web app itself consumes it too**, via thin fetch wrappers in `src/lib/api-client/*.ts` (one file per domain). The web UI used to call server actions directly (in-process, no HTTP hop); it was migrated onto this same REST API so a future backend rewrite (e.g. a Go service) only requires repointing where the frontend's requests go, not rewriting any page/component. See `docs/ARCHITECTURE.md`.

Every endpoint is a thin wrapper around an existing `actions.js` function — the REST layer never duplicates business logic, it just translates HTTP in/out.

## Authentication

Two auth methods are supported, transparently, on every endpoint:

1. **Session cookie** — the same NextAuth session the web app uses. Works automatically if you're calling from an already-authenticated browser session.
2. **Bearer API key** — for external/programmatic access (e.g. a mobile app or a server-to-server integration). Send it as a header:

   ```
   Authorization: Bearer tvp_<64 hex chars>
   ```

There is currently **no self-service UI** for generating API keys — they're issued via `src/lib/auth/api-keys.ts`:

```ts
import { generateApiKey, listApiKeys, revokeApiKey } from "@/lib/auth/api-keys";

const { rawKey } = await generateApiKey(userId, "my integration");
// rawKey is only ever returned here — only its SHA-256 hash is stored.
// Treat it like a password: if you lose it, revoke and generate a new one.
```

A key inherits the full role/permissions of the user it's tied to (same `requireAuth()`/`requireRole()` checks as the session-based path — there's no separate scoping/permission model for keys).

### Auth errors

| Status | Meaning |
|---|---|
| `401 Unauthorized` | No valid session cookie or bearer token |
| `403 Forbidden` | Authenticated, but the user's role doesn't have access to this action |
| `404 Not Found` | Resource doesn't exist (or, for detail-record endpoints, doesn't exist under the given ID) |

Error responses are always `{ "error": "<message>" }`.

## Response shape

Success responses return the resource directly (no envelope):

```json
// GET /api/v1/patients
[{ "id": "...", "first_name": "...", ... }, ...]
```

```json
// POST /api/v1/patients
{ "success": true, "id": "0a1b2c..." }
```

All field names are `snake_case` (matching the web app's existing convention — the REST layer doesn't introduce a separate casing scheme).

## Identity-guarded endpoints

A handful of endpoints represent "my own" data (my tasks, my time logs, my notifications). These **always** derive identity from the authenticated caller — any client-supplied email/id in the request is ignored. This was a deliberate hardening pass: the underlying server actions were written for a trusted web UI that always passes its own session user's identity, so wrapping them for REST (where a caller could otherwise pass someone else's email) required this guard. These are marked **🔒 self-scoped** below.

---

## Endpoints

`{id}` denotes a path parameter (substitute the actual resource ID) — this is standard REST/OpenAPI notation, not literal Next.js folder syntax.

### Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/auth/login` | Body: `{ email, password }`. Sets the session cookie on success — this is how the web UI itself logs in. Not wrapped from an action; reimplements `signIn("credentials", ...)` directly. |

### Users
*(requires SUPERUSER or ADMIN, unless noted)*

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Body: `{ email, userType }`. Invites a user (default password `changeme123`) |
| PATCH | `/api/v1/users/{id}` | Body: `{ data: {...} }` |
| POST | `/api/v1/users/sync-therapists` | Creates/links user accounts for active therapists missing one |
| GET | `/api/v1/users/for-select` | Lightweight `{id, email, full_name}` list for assignment dropdowns — any authenticated user, not role-restricted |
| POST | `/api/v1/users/verify-password` | Body: `{ password }`. Verifies the *caller's own* current password — powers the HR password gate in front of therapist disciplinary records |

### Patients

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/patients` | List patients |
| POST | `/api/v1/patients` | Create |
| GET | `/api/v1/patients/{id}` | 404 if not found |
| PATCH | `/api/v1/patients/{id}` | Partial update |
| DELETE | `/api/v1/patients/{id}` | SUPERUSER/ADMIN only |
| GET | `/api/v1/patients/{id}/visits` | Visit history for this patient |
| GET | `/api/v1/patients/{id}/communication-notes` | Communication notes for this patient |
| POST | `/api/v1/patients/{id}/communication-notes` | Body: `{ patientName, note, noteType }` |
| GET | `/api/v1/patients/agencies-for-select` | Lightweight `{id, name}` list for agency dropdowns — any authenticated user, not role-restricted |

### Therapists
*(list/detail require SUPERUSER, ADMIN, COORDINATOR, or HR)*

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/therapists` | List |
| POST | `/api/v1/therapists` | Create (SUPERUSER/ADMIN/HR) |
| GET | `/api/v1/therapists/{id}` | Detail |
| PATCH | `/api/v1/therapists/{id}` | Update (SUPERUSER/ADMIN/HR) |
| DELETE | `/api/v1/therapists/{id}` | SUPERUSER/ADMIN only |
| GET | `/api/v1/therapists/schedule` | Lightweight list for schedule/calendar UI — any authenticated user, not role-restricted (unlike the endpoints above) |

### Agencies
*(SUPERUSER/ADMIN/COORDINATOR for read, SUPERUSER/ADMIN for write)*

| Method | Path |
|---|---|
| GET | `/api/v1/agencies` |
| POST | `/api/v1/agencies` |
| GET | `/api/v1/agencies/{id}` |
| PATCH | `/api/v1/agencies/{id}` |
| DELETE | `/api/v1/agencies/{id}` |

### Company Information
*(SUPERUSER only for writes)*

| Method | Path |
|---|---|
| GET | `/api/v1/company-info` |
| PATCH | `/api/v1/company-info` |
| PATCH | `/api/v1/company-info/menu-permissions` |

### Audit Logs
*(SUPERUSER/ADMIN)*

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/audit-logs` | Most recent 500 |

### Tasks

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/tasks` | All tasks |
| POST | `/api/v1/tasks` | Create |
| PATCH | `/api/v1/tasks/{id}` | Full update (status, notes, completed_date, escalation_data) |
| DELETE | `/api/v1/tasks/{id}` | Delete |
| POST | `/api/v1/tasks/{id}/escalate` | 🔒 self-scoped — `createdByEmail`/`createdByName` on the generated follow-up task always come from the caller, not the request body |
| GET | `/api/v1/tasks/mine` | 🔒 self-scoped — always the authenticated caller's own tasks |

### Documents

| Method | Path |
|---|---|
| GET | `/api/v1/documents` |
| POST | `/api/v1/documents` |
| PATCH | `/api/v1/documents/{id}` |
| DELETE | `/api/v1/documents/{id}` |

### Time Logs (coordinator labor tracking)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/time-logs/mine` | 🔒 self-scoped |
| POST | `/api/v1/time-logs/clock-in` | 🔒 self-scoped — identity (id/name/email) always the caller |
| POST | `/api/v1/time-logs/clock-out` | Body: `{ logId }` |

### Referrals & Assignments

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/referrals` | |
| POST | `/api/v1/referrals` | Manual referral entry |
| GET | `/api/v1/assignments` | |
| POST | `/api/v1/assignments` | SUPERUSER/ADMIN/COORDINATOR |
| PATCH | `/api/v1/assignments/{id}` | Accept/decline/schedule — SUPERUSER/ADMIN/COORDINATOR/THERAPIST |
| DELETE | `/api/v1/assignments/{id}` | SUPERUSER/ADMIN/COORDINATOR |

### Visit Notes

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/visit-notes` | List (summary fields only) |
| POST | `/api/v1/visit-notes` | Create — a client-supplied `id` in the body is ignored to prevent accidentally overwriting an existing note |
| GET | `/api/v1/visit-notes/{id}` | Full detail |
| PATCH | `/api/v1/visit-notes/{id}` | Create-or-update semantics (same underlying `saveVisitNote`) |
| DELETE | `/api/v1/visit-notes/{id}` | SUPERUSER/ADMIN only |
| PATCH | `/api/v1/visit-notes/{id}/field` | Body: `{ field, value }`. Single-field update (e.g. quick status change), distinct from the full PATCH above |
| GET | `/api/v1/visit-notes/form-data` | Bundled active patients/therapists/agencies for the visit note form |

### Invoices
*(SUPERUSER/ADMIN for writes)*

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/invoices` | |
| POST | `/api/v1/invoices` | |
| PATCH | `/api/v1/invoices/{id}` | |
| DELETE | `/api/v1/invoices/{id}` | |
| GET | `/api/v1/invoices/agencies` | Rates-included agency list for the invoice creation form — distinct from `GET /api/v1/agencies` |
| GET | `/api/v1/invoices/completed-visits` | Completed/signed visits available for billing |

### Payroll, Reports, Calendar
*(read-only, SUPERUSER/ADMIN)*

| Method | Path |
|---|---|
| GET | `/api/v1/payroll` |
| GET | `/api/v1/reports` |
| GET | `/api/v1/calendar/visits` |
| GET | `/api/v1/calendar/weekly-close` |

### Deletion Requests (medical record deletion, two-admin approval)
*(SUPERUSER/ADMIN)*

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/deletion-requests` | |
| POST | `/api/v1/deletion-requests/{id}/approve` | Cannot approve your own request; cascades patient + visit note deletion |
| POST | `/api/v1/deletion-requests/{id}/reject` | |

### Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/notifications` | 🔒 self-scoped |
| POST | `/api/v1/notifications/{id}/read` | Mark one as read |
| POST | `/api/v1/notifications/mark-all-read` | 🔒 self-scoped |

---

## Coverage

Every `actions.js` function used anywhere in the app has a REST endpoint — there is no function the web UI calls that skips REST. The one exception is `loginAction` (`src/app/(auth)/login/actions.js`), which is dead code: `POST /api/v1/auth/login` reimplements the same `signIn()` call directly rather than wrapping the old server action, since a Server Action bound to a `<form action>` doesn't translate to an HTTP handler.

A few endpoints are intentionally **not role-restricted** even though the equivalent "main" resource endpoint is — these exist because a broader set of users (e.g. any authenticated therapist) needs the data for a dropdown or schedule view, while only admins/coordinators can see the full resource. Look for "not role-restricted" in the Notes column above (`/users/for-select`, `/patients/agencies-for-select`, `/therapists/schedule`) — don't assume these can be merged into the general list endpoint, since doing so would either break access for the broader audience or over-expose data to it.

## Implementation pattern

Every route handler follows the same shape — see `src/lib/api/response.ts`:

```ts
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const data = await someExistingServerAction();
    return apiSuccess(data);
  } catch (err) {
    return handleApiError(err); // maps "Unauthorized"/"Forbidden"/"Not found" to 401/403/404
  }
}
```

New endpoints should follow this pattern: import the existing action, don't duplicate its logic, and check whether it takes a caller-supplied identity parameter that needs to be overridden from `requireAuth()` instead (see the 🔒 self-scoped endpoints above for the pattern).
