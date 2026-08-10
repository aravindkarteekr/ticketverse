# @ticketverse/api

Express + TypeScript backend for TicketVerse, structured as one DDD-style module per bounded
context: `domain/` (entities, repository interfaces, zero framework deps) → `application/`
(use-cases) → `infrastructure/` (Mongoose models/repos, Redis, Stripe) → `interface/http/` (routes,
validated via shared Zod schemas).

## Modules (`src/modules/`)

| Module     | Responsibility                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `identity` | User accounts (bcrypt-hashed passwords, `tokenVersion`), signup/login/refresh/logout, `/me`, theatre-owner requests, admin user oversight |
| `catalog`  | Movie CRUD — admin-only writes, public reads                                                                                              |
| `theatre`  | Theatre + Screen (seat layout) management, scoped to the owning `theatre_owner`, plus admin oversight                                     |
| `show`     | Showtime scheduling (movie + screen + time + pricing), public search, owner-scoped CRUD                                                   |
| `booking`  | Redis-backed seat holds (`SETNX` + TTL) and booking creation/history                                                                      |
| `payment`  | Stripe PaymentIntent creation + signature-verified webhook confirmation                                                                   |

Cross-cutting code lives in `src/shared/`: `config/env.ts` (Zod-validated env), `middleware/`
(`authenticate`, `requireRole`, `validate`, `errorHandler`), `lib/` (Mongoose connection, Redis
client, Stripe client, JWT helpers, bcrypt helpers). `app.ts` exports a `createApp()` factory
(used directly by integration tests); `server.ts` connects Mongo and starts the HTTP listener.

## Environment variables (`apps/api/.env`, see `.env.example`)

| Variable                                      | Description                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                    | `development` \| `test` \| `production`                                                                                               |
| `PORT`                                        | HTTP port (default `4000`)                                                                                                            |
| `CLIENT_ORIGIN`                               | Exact origin of the frontend, used for the CORS allow-list — must match the browser's actual origin or cookies/CORS silently fail     |
| `MONGODB_URI`                                 | MongoDB connection string                                                                                                             |
| `REDIS_URL`                                   | Redis connection string, used for seat holds                                                                                          |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`    | Random secrets (≥16 chars) signing the access/refresh JWTs — generate real random values, never reuse the `.env.example` placeholders |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL`          | Token lifetimes (default `15m` / `7d`)                                                                                                |
| `COOKIE_SECURE`                               | `true` in production (requires HTTPS + `sameSite=None` for cross-site cookies), `false` for local HTTP dev                            |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe test-mode secret key and webhook signing secret                                                                                |
| `PAYMENT_CURRENCY`                            | 3-letter ISO currency code, e.g. `usd`                                                                                                |

## API routes (all mounted under `/api/v1`)

### identity

| Method | Path                                 | Auth           | Notes                                                                         |
| ------ | ------------------------------------ | -------------- | ----------------------------------------------------------------------------- |
| POST   | `/auth/signup`                       | —              | Creates a `user`, sets auth cookies                                           |
| POST   | `/auth/login`                        | —              | Rate-limited to blunt brute-force                                             |
| POST   | `/auth/refresh`                      | refresh cookie | Rotates access+refresh cookies                                                |
| POST   | `/auth/logout`                       | access cookie  | Bumps `tokenVersion`, clears cookies                                          |
| GET    | `/me`                                | access cookie  | Current user profile                                                          |
| POST   | `/theatre-owner-requests`            | `user`         | Submit a theatre-owner request                                                |
| POST   | `/theatre-owner-requests/:id/review` | `admin`        | Approve/reject — approval promotes the user's role and provisions a `Theatre` |
| GET    | `/admin/theatre-owner-requests`      | `admin`        | List requests by status (default `pending`)                                   |
| GET    | `/admin/users`                       | `admin`        | Paginated user oversight (safe DTO — no `passwordHash`)                       |

### catalog

| Method                | Path                     | Auth    | Notes         |
| --------------------- | ------------------------ | ------- | ------------- |
| GET                   | `/movies`                | —       | Search/browse |
| GET                   | `/movies/:id`            | —       | Movie detail  |
| POST / PATCH / DELETE | `/movies`, `/movies/:id` | `admin` | Catalog CRUD  |

### theatre

| Method | Path                           | Auth                           | Notes                              |
| ------ | ------------------------------ | ------------------------------ | ---------------------------------- |
| GET    | `/theatres/mine`               | `theatre_owner`                | Theatres owned by the current user |
| GET    | `/admin/theatres`              | `admin`                        | Paginated oversight                |
| GET    | `/theatres/:id`                | —                              | Theatre detail                     |
| PATCH  | `/theatres/:id`                | `theatre_owner` (owner-scoped) | Update own theatre                 |
| GET    | `/theatres/:theatreId/screens` | —                              | List screens                       |
| POST   | `/theatres/:theatreId/screens` | `theatre_owner` (owner-scoped) | Create a screen + seat layout      |
| DELETE | `/screens/:id`                 | `theatre_owner` (owner-scoped) | Remove a screen                    |

### show

| Method                | Path                         | Auth                           | Notes                         |
| --------------------- | ---------------------------- | ------------------------------ | ----------------------------- |
| GET                   | `/shows`                     | —                              | Search by movie/city/date     |
| GET                   | `/theatres/:theatreId/shows` | —                              | List a theatre's shows        |
| GET                   | `/shows/:id`                 | —                              | Show detail                   |
| POST / PATCH / DELETE | `/shows`, `/shows/:id`       | `theatre_owner` (owner-scoped) | Schedule/update/cancel a show |

### booking

| Method | Path                   | Auth          | Notes                                                          |
| ------ | ---------------------- | ------------- | -------------------------------------------------------------- |
| GET    | `/shows/:showId/seats` | —             | Merges confirmed bookings + live Redis holds                   |
| POST   | `/bookings/hold`       | authenticated | 201 on full success, 409 with `unavailableSeatIds` on conflict |
| POST   | `/bookings`            | authenticated | Creates a `pending_payment` booking from a held hold           |
| GET    | `/bookings/mine`       | authenticated | Paginated own booking history                                  |
| GET    | `/bookings/:id`        | authenticated | Owner or admin only                                            |
| GET    | `/admin/bookings`      | `admin`       | Paginated oversight                                            |

### payment

| Method | Path                | Auth             | Notes                                                                                |
| ------ | ------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| POST   | `/payments/intent`  | authenticated    | Creates a Stripe PaymentIntent for a booking                                         |
| POST   | `/payments/webhook` | Stripe signature | Mounted **before** the JSON body parser (needs raw bytes for signature verification) |

## Testing

```bash
npm run test --workspace=@ticketverse/api   # or: npx turbo run test --filter=@ticketverse/api
```

- **Unit tests**: bcrypt password hashing (`test/password.unit.test.ts`), JWT access/refresh
  sign+verify including tamper/wrong-secret rejection (`test/jwt.unit.test.ts`).
- **Integration tests** (Supertest against `createApp()`): full auth flow — signup → `/me` →
  refresh → logout → stale-refresh-rejected (`test/identity.integration.test.ts`), plus RBAC
  (non-admin hitting an admin-only route → 403) and invalid-token/missing-cookie 401 cases; a
  full booking happy path — movie → theatre-owner request/approval → screen → show → seat hold →
  booking, plus a concurrent double-booking 409 rejection (`test/booking.integration.test.ts`).
- Backed by `mongodb-memory-server` (one shared in-memory MongoDB instance per test run, started
  in `test/globalSetup.ts`) and `ioredis-mock` (swapped in for the real `ioredis` client via a
  `vi.mock` shim in `test/setup.ts`) — no real MongoDB/Redis needed to run the suite.

## Local development

```bash
# from the repo root
cp apps/api/.env.example apps/api/.env   # then edit secrets/URIs
npm run dev --workspace=@ticketverse/api  # or: npx turbo run dev --filter=@ticketverse/api
```

Requires a running MongoDB and Redis reachable at `MONGODB_URI` / `REDIS_URL`. For local Stripe
webhook testing, forward events with the Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/api/v1/payments/webhook
```

## Seed data

To try out the app without manually signing up and clicking through the admin-approval /
show-scheduling flow first, populate the database with a small demo dataset:

```bash
npm run seed --workspace=@ticketverse/api   # or: npx turbo run seed --filter=@ticketverse/api
```

This upserts one user per role, 3 movies, a theatre with 2 screens, and a handful of upcoming
shows over the next couple of days. It's idempotent — safe to re-run at any time (existing
seeded documents are updated in place rather than duplicated), and it refuses to run when
`NODE_ENV=production`. Test accounts (all share the same password):

| Role            | Email                   | Password       |
| --------------- | ----------------------- | -------------- |
| `admin`         | `admin@ticketverse.dev` | `Password@123` |
| `theatre_owner` | `owner@ticketverse.dev` | `Password@123` |
| `user`          | `user@ticketverse.dev`  | `Password@123` |
| `user`          | `jack@ticketverse.dev`  | `Password@123` |

Override the password with the `SEED_PASSWORD` env var if you'd rather not use the default.
