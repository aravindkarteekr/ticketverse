# @ticketverse/web

React 18 + Vite + TypeScript frontend for TicketVerse, structured feature-first, mirroring the
backend's modules.

## Structure (`src/`)

| Path                                                     | Contents                                                                                                                                                       |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                                                   | Redux store (`authSlice`, hydrated via `/me` on load), React Query client, router, typed hooks                                                                 |
| `features/{auth,movies,theatres,booking,payment,admin}/` | Pages, feature-scoped API clients (axios + React Query), and forms per domain                                                                                  |
| `components/`                                            | Shared UI: `ProtectedRoute`, `NavBar`, `RootLayout`, `HomePage`                                                                                                |
| `lib/axiosClient.ts`                                     | Axios instance (`withCredentials: true`) with a response interceptor that transparently calls `/auth/refresh` on a `401` and retries the original request once |
| `theme/`                                                 | MUI theme                                                                                                                                                      |

State management split: **Redux Toolkit** holds only client/UI state (the auth slice); **TanStack
React Query** owns all server state (movies, shows, theatres, bookings) — no server data is
duplicated into Redux.

## Environment variables (`apps/web/.env`, see `.env.example`)

| Variable                      | Description                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL`           | Base URL of the backend API, e.g. `http://localhost:4000/api/v1` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable (test-mode) key for Stripe Elements           |

> Note: Vite's dev server auto-shifts to the next free port (5173 → 5174 → …) if 5173 is taken.
> Whatever port it actually binds to must match `CLIENT_ORIGIN` in `apps/api/.env`, or CORS and
> cookie delivery will silently fail.

## Routes (`app/router.tsx`)

| Path                                                                           | Access                 | Page                                                                     |
| ------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------ |
| `/`                                                                            | public                 | Home                                                                     |
| `/login`, `/signup`                                                            | public                 | Auth forms                                                               |
| `/movies`, `/movies/:id`                                                       | public                 | Browse/detail                                                            |
| `/theatres/request`                                                            | any authenticated user | Request theatre-owner status                                             |
| `/shows/:id`                                                                   | any authenticated user | Seat map + hold/booking                                                  |
| `/bookings/mine`                                                               | any authenticated user | Booking history                                                          |
| `/payment/:bookingId`                                                          | any authenticated user | Stripe Elements checkout                                                 |
| `/theatres/mine`, `/theatres/:theatreId/screens`, `/theatres/:theatreId/shows` | `theatre_owner`        | Theatre/screen/show management                                           |
| `/admin`                                                                       | `admin`                | Theatre-owner request review, movie CRUD, user/theatre/booking oversight |

`ProtectedRoute` reads `{user, status}` from the `auth` Redux slice; unauthenticated users are
redirected to `/login`, and users whose role isn't in `allowedRoles` are redirected to `/`.

## Testing

```bash
npm run test --workspace=@ticketverse/web   # or: npx turbo run test --filter=@ticketverse/web
```

Vitest + React Testing Library, jsdom environment (`vitest.config.ts`, `test/setup.ts` registers
`@testing-library/jest-dom` matchers):

- `src/components/ProtectedRoute.test.tsx` — loading / unauthenticated-redirect /
  role-denied-redirect / authenticated-outlet cases, using a real Redux store with a preloaded
  `auth` state.
- `src/features/booking/SeatMapPage.test.tsx` — seat select/deselect, running total price, the
  client-side `MAX_SEATS = 10` cap, and that booked seats can't be selected (mocks `bookingApi`).
- `src/features/auth/AuthForms.test.tsx` — `LoginPage`/`SignupPage` validation errors from the
  shared Zod schemas (`@ticketverse/schemas`) via `react-hook-form` + `zodResolver`, and correct,
  normalized payloads on valid submission (mocks `authApi`).

## Local development

```bash
# from the repo root
cp apps/web/.env.example apps/web/.env   # then edit VITE_STRIPE_PUBLISHABLE_KEY etc.
npm run dev --workspace=@ticketverse/web  # or: npx turbo run dev --filter=@ticketverse/web
```

Requires `apps/api` running (see [../api/README.md](../api/README.md)) and reachable at
`VITE_API_BASE_URL`.
