## Testing Strategy

### Philosophy: Testing the Properties That Matter Most

Rather than pursuing blanket code coverage as an end in itself, TicketVerse's test suite is deliberately concentrated on the two classes of behaviour that are hardest to get right by inspection alone and most damaging to get wrong in production: **concurrency correctness** in the booking flow, and **authentication/authorization correctness** in the identity flow. A UI form that renders a label in the wrong place is a cosmetic bug; a race condition that lets two customers pay for the same seat, or a role check that can be bypassed, is a trust-destroying one. The test suite's shape reflects that priority ordering.

### Backend Testing (`apps/api`)

The backend test suite uses **Vitest** (a Jest-compatible test runner with native TypeScript/ESM support and a faster watch mode) together with **Supertest** for issuing real HTTP requests against the Express app in-process, without needing a running network server.

Two infrastructure dependencies are replaced with fast, deterministic in-memory equivalents so the suite can run entirely offline, in CI-free environments, and on any developer's machine without provisioning real cloud resources:

- **`mongodb-memory-server`** downloads and runs a real, temporary `mongod` binary in-process. `apps/api/test/globalSetup.ts` starts exactly **one** shared instance for the entire test run (rather than one per test file), which was a deliberate performance and stability decision — spinning up a fresh `mongod` per file would multiply both startup latency and the chance of port-binding flakiness. Because a shared instance persists data across test files, `apps/api/test/setup.ts` clears every collection in an `afterEach` hook, so each individual test still starts from a known-empty state without needing per-test infrastructure teardown.
- **`ioredis-mock`** is swapped in for the real `ioredis` client via `vi.mock("ioredis")`, so the exact same `RedisSeatHoldAdapter` code exercised in production runs against an in-memory Redis-compatible implementation during tests — the `SETNX`-with-TTL locking logic under test is the real production code path, not a stubbed-out fake of it.

**Table 6.01** — Backend Test Files and Coverage Focus

| File                                | Test Cases | Focus                                                                                                                                                                          |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `test/identity.integration.test.ts` | 5          | Full signup → session → refresh → logout flow; password rejection; invalid/stale refresh token rejection; missing-cookie rejection; RBAC enforcement on a protected route      |
| `test/booking.integration.test.ts`  | 1          | End-to-end seat hold + booking, and — critically — that two concurrent hold requests for the _same_ seat resolve to exactly one success and one rejection, never two successes |
| `test/jwt.unit.test.ts`             | 4          | Access and refresh token sign/verify round-trips; a tampered token is rejected; a token signed with the wrong secret is rejected                                               |
| `test/password.unit.test.ts`        | 4          | bcrypt hashing produces a verifiable hash; two hashes of the identical password differ (unique salts); correct password verifies; incorrect password is rejected               |

The single concurrency test in `booking.integration.test.ts` is disproportionately important relative to its count of one: it is the automated, repeatable proof that NFR-01 (no seat is ever double-booked) holds, executed by firing two hold requests for an overlapping seat set at effectively the same time via `Promise.all` and asserting that exactly one resolves successfully. Without this test, the concurrency-safety claim made throughout this report would rest entirely on manual testing and code review rather than on a machine-checked guarantee that re-runs on every future change to the booking module.

Test execution is configured with `fileParallelism: false` in the Vitest config, meaning test files run sequentially rather than in parallel worker processes — a direct consequence of sharing one `mongodb-memory-server` instance across the whole run; parallel file execution against a single shared database would reintroduce exactly the kind of test-order-dependent flakiness the in-memory-database strategy was chosen to eliminate.

### Frontend Testing (`apps/web`)

The frontend test suite uses **Vitest** with **`@testing-library/react`** (rendering components into a `jsdom` environment and asserting on behaviour from the user's perspective — what is rendered and what happens on interaction — rather than on internal component state) and **`@testing-library/user-event`** for realistic simulated user input.

**Table 6.02** — Frontend Test Files and Coverage Focus

| File                      | Test Cases | Focus                                                                                                                                                                                                                                                   |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProtectedRoute.test.tsx` | 5          | Loading state while auth status resolves; unauthenticated user is redirected; a user without an allowed role is denied; an authorized user renders the protected content; a route with no `allowedRoles` restriction renders for any authenticated user |
| `AuthForms.test.tsx`      | 4          | Login form surfaces validation errors on invalid input and submits correctly on valid input; signup form enforces password rules and submits correctly on valid input                                                                                   |
| `SeatMapPage.test.tsx`    | 3          | Seat selection toggles on click; the client-side `MAX_SEATS` cap is enforced; a seat already marked booked/held cannot be selected                                                                                                                      |

`ProtectedRoute.test.tsx` is the frontend analogue of the backend's RBAC test: it verifies that the _same_ role-gating logic the backend enforces authoritatively is also correctly mirrored in the client's route guard, so that an unauthorized user is never even shown a UI affordance for an action the backend would reject anyway — a defense-in-depth, UX-quality property rather than a security boundary in itself (the security boundary is, and must remain, the backend's `requireRole` check, discussed in the Security chapter).

### What Is Deliberately Not Covered

No coverage-percentage target was set, and several categories of testing were consciously deferred rather than attempted incompletely: full end-to-end browser testing (e.g., Playwright/Cypress driving a real browser against the deployed site), load/performance testing of the Redis-based seat-hold mechanism under high concurrent volume beyond the two-request race condition already covered, and exhaustive UI snapshot testing of every admin panel. These are named explicitly as Limitations in the Conclusion chapter rather than silently omitted, consistent with this report's overall preference for grounded, verifiable claims over implied completeness.
