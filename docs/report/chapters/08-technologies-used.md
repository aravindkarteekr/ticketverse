## Technologies Used

### The MERN Stack

TicketVerse is built on the **MERN** stack — **M**ongoDB, **E**xpress, **R**eact, **N**ode.js — a widely used combination for building full-stack JavaScript/TypeScript applications where the same language (TypeScript, a typed superset of JavaScript) is used from the database layer's query code through to the browser UI.

**MongoDB** is a document-oriented NoSQL database that stores data as flexible, JSON-like BSON documents rather than fixed-schema rows in tables (MongoDB, n.d.-a). TicketVerse uses **Mongoose** as an Object Document Mapper (ODM) on top of MongoDB, which lets each backend module define an explicit schema in code (e.g., a `Booking` document with `showId`, `seatIds`, `status`, `totalAmount`) while still benefiting from MongoDB's flexibility — for example, the `Show` document embeds per-seat pricing without needing a separate join table. A real-world analogy: MongoDB is closer to a flexible filing cabinet where each folder (document) can have a slightly different internal layout, whereas a traditional relational database is closer to a fixed spreadsheet where every row must have exactly the same columns.

**Express** is a minimal, unopinionated web framework for Node.js that TicketVerse uses to define its entire HTTP surface — routing, middleware (authentication, validation, rate limiting), and error handling (Express, n.d.). Its middleware-chain model is what makes the security stack described in Ch.5 possible: each request passes through `helmet`, then `cors`, then body-parsing, then `express-mongo-sanitize`, then route-specific `authenticate`/`requireRole`/`validate` middleware, before finally reaching a controller — each concern isolated into its own composable function.

**React** is a component-based UI library used to build `apps/web` as a single-page application (React, n.d.). Rather than server-rendering full HTML pages for every navigation, React re-renders only the parts of the page whose underlying data changed — for instance, updating just the seat map's colors when a hold conflict response arrives, without reloading the whole page. This project uses React Router v6's data-router APIs for client-side navigation and route-level error boundaries (`errorElement`).

**Node.js** is the JavaScript runtime that executes `apps/api` outside the browser (Node.js, n.d.). Its single-threaded, non-blocking I/O event loop is particularly well suited to an application like TicketVerse where most work — querying MongoDB, reading/writing Redis, calling Stripe's API — is I/O-bound rather than CPU-bound: while one request waits on a database round-trip, Node.js is free to keep serving other requests instead of blocking a whole thread on the wait.

**Table 7.01** — MERN Stack Summary

| Layer | Technology | Role in TicketVerse |
| --- | --- | --- |
| Database | MongoDB + Mongoose | Durable storage for users, movies, theatres, screens, shows, bookings, payments |
| Backend | Express + Node.js | HTTP API, middleware security chain, DDD business logic |
| Frontend | React + Vite | Single-page application, seat map, checkout, role-based dashboards |

### Redis

**Redis** is an in-memory key-value data store (Redis, n.d.), used in TicketVerse exclusively as a **temporary, atomic lock store** for seat holds — never as a system of record. The `SETNX` (set-if-not-exists) command gives an atomic "only one caller can succeed" guarantee across concurrent requests, which is exactly the primitive needed to prevent two users from holding the same seat simultaneously; combined with a time-to-live (TTL), an abandoned hold (a user who never completes payment) is automatically released without any cleanup job. A real-world analogy: Redis's role here is like a nightclub's wristband counter — it doesn't remember your entire life story (that's MongoDB's job), it just very quickly and reliably answers "has this specific slot already been claimed, right now?"

### Stripe

**Stripe** is the payment gateway integrated in Ch.4, chosen over alternatives such as Razorpay for its mature, well-documented **PaymentIntents** and **Elements** APIs and first-class Node.js/React SDKs (Stripe, n.d.-a). Its webhook-signing mechanism (Ch.4, Ch.5) is a recurring pattern across payment and platform APIs generally: never trust an inbound event until its cryptographic signature has been verified against a shared secret.

### Zod and Shared Schema Validation

**Zod** is a TypeScript-first schema declaration and validation library (Zod, n.d.). TicketVerse defines every domain shape (a movie, a booking request, a signup payload) exactly once in `packages/schemas`, and both `apps/api` (as Express validation middleware) and `apps/web` (as `react-hook-form`'s `zodResolver`, and to type React Query results) import that single definition. This eliminates an entire category of bugs common to hand-written full-stack projects: the frontend and backend silently disagreeing about what a valid request looks like, because there is only ever one schema, not two independently maintained ones.

### Turborepo and npm Workspaces

**Turborepo** is a build-system orchestrator for JavaScript/TypeScript monorepos, used here on top of **npm workspaces** (Turborepo, n.d.). npm workspaces let `apps/api` and `apps/web` depend on `packages/schemas` as a normal, locally-resolved npm dependency (rather than a published registry package), and Turborepo adds a task graph and caching layer on top so that, for example, `npx turbo run build` only rebuilds `packages/schemas` when its source actually changed, and skips rebuilding it (using a cached result) otherwise. This is analogous to a spreadsheet with formulas: change one cell (a shared schema), and only the cells that actually depend on it are recalculated — everything else is served from cache.

### Material UI (MUI), Redux Toolkit, and React Query

**Material UI (MUI)** supplies TicketVerse's component library and theme (buttons, tables, dialogs, form fields) (MUI, n.d.), so the project could focus engineering effort on business logic rather than hand-rolling every UI primitive from scratch.

**Redux Toolkit** manages a deliberately small slice of *client-only* UI state — specifically the authenticated user's identity and role, hydrated once at app load via `GET /me` (Redux Toolkit, n.d.). TicketVerse does **not** use Redux for server data (movies, bookings, seat availability); that responsibility belongs entirely to **React Query** (TanStack Query, n.d.), which handles fetching, caching, background refetching, and — critically for this project — exposes `isLoading`/`isError`/`error`/`refetch` on every query, which is what powers the loading/error/empty-state handling on every data-driven page described in the Requirement Gathering chapter's NFR-08.

### Testing Stack: Vitest, Supertest, React Testing Library

The backend is tested with **Vitest** as the test runner, **Supertest** for HTTP-level integration assertions against the real Express app, **mongodb-memory-server** for an ephemeral, disposable MongoDB instance per test run, and **ioredis-mock** to simulate Redis without a real network dependency (Vitest, n.d.; Supertest, n.d.). This combination allows the booking module's genuinely concurrency-sensitive behavior — a deliberate double-hold attempt on the same seat — to be asserted automatically on every run, rather than relying on manual, easy-to-forget exploratory testing. The frontend is tested with Vitest plus **React Testing Library**, which asserts on rendered UI output and user-facing behavior (e.g., a validation error appearing after an invalid form submission) rather than internal component implementation details.

**Table 7.02** — Supporting Technology Summary

| Technology | Category | Primary Role in TicketVerse |
| --- | --- | --- |
| Redis (ioredis) | In-memory data store | Atomic, expiring seat-hold locks |
| Stripe | Payment gateway | PaymentIntents, Elements checkout, signed webhooks |
| Zod | Schema validation | One shared request/response contract for backend + frontend |
| Turborepo + npm workspaces | Monorepo tooling | Shared package resolution, cached incremental builds |
| MUI | UI component library | Theming and pre-built accessible components |
| Redux Toolkit | Client state | Authenticated user identity/role only |
| React Query | Server state | Fetching, caching, loading/error/empty states |
| Vitest + Supertest + RTL | Automated testing | 26 tests across backend and frontend |

