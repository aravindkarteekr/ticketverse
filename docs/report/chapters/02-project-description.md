## Project Description

### Overview

TicketVerse is a movie ticket booking platform that lets a moviegoer search for a movie, browse showtimes across theatres in a city, pick seats from a live seat map, hold those seats while paying, and receive a confirmed booking once payment succeeds. Alongside the customer-facing flow, the platform supports two additional roles: a **theatre owner**, who can list their theatres, define each screen's seat layout, and schedule showtimes against the platform's shared movie catalogue; and an **administrator**, who curates the movie catalogue, approves or rejects theatre-owner applications, and has read-only oversight of all users, theatres, and bookings for support and auditing purposes.

The project was built as a TypeScript monorepo (`apps/web`, `apps/api`, `packages/schemas`, `packages/config`) managed with npm workspaces and Turborepo, so the frontend and backend can share one source of truth for request/response validation instead of the two ends of the API silently drifting apart over time, which is a common real-world source of production bugs.

### Objectives

1. Build a genuinely **concurrency-safe** seat-booking mechanism — the core technical challenge of any ticketing system — rather than a naive implementation that would allow two customers to pay for the same seat.
2. Implement a **complete, asynchronous payment flow** using a real payment gateway (Stripe), including signature-verified webhook confirmation, mirroring how production ticketing and e-commerce systems actually confirm payment rather than trusting the client's browser.
3. Design a **role-based access control (RBAC)** system from first principles (custom bcrypt + JWT implementation, not a third-party auth provider) so that the reasoning behind password hashing, token issuance, and token revocation is fully owned and explainable rather than hidden behind a vendor SDK.
4. Apply **Domain-Driven Design (DDD)** on the backend so that business rules (e.g., "a seat cannot be held twice", "only an admin can create a movie") live in a framework-independent domain layer, separated from Express routing and MongoDB persistence concerns.
5. **Deploy the system live** end-to-end (not just describe a hypothetical deployment) so that the operational concerns discussed in this report — CORS, cross-site cookies, environment configuration, managed database/cache provisioning — are grounded in a system that was actually exercised in production-like conditions.

### Problem Statement

Most introductory full-stack tutorials build a CRUD (create/read/update/delete) application against a single resource with no contention between users. That shape teaches routing, forms, and database access, but it deliberately avoids the two problems that make ticketing, booking, and inventory systems hard in practice: **concurrency** (what happens when two people try to claim the same limited resource at the same instant) and **asynchronous settlement** (what happens when the system that confirms a transaction — a card network, a bank, a payment processor — is a separate, untrusted, and sometimes slow third party that the client cannot be trusted to report on honestly). TicketVerse was deliberately scoped around a domain — cinema seat booking — where both problems occur naturally and cannot be avoided or faked: a specific seat in a specific show is a genuinely scarce, non-substitutable resource, and Stripe's PaymentIntent/webhook model forces an asynchronous, server-to-server confirmation step that cannot be shortcut by trusting a success response in the browser. The problem, stated precisely, is: _given a fixed, finite set of seats for a scheduled show, guarantee that no seat is ever sold to more than one paying customer, while still allowing many customers to browse and attempt to book concurrently, and while the actual payment confirmation arrives asynchronously and out-of-band from the booking request itself._

### Scope and Out-of-Scope

To keep the project achievable within the time available while still exercising every technically interesting problem above, the following scope boundaries were set explicitly at the start of the project:

**In scope:**

- Seat-level booking for a single-city, single-currency deployment (no multi-region pricing or tax logic).
- Three roles — user, theatre owner, administrator — with role-based authorization enforced on the backend, not just hidden in the UI.
- A single payment gateway integration (Stripe), fully wired end-to-end including webhook confirmation.
- Automated backend and frontend tests covering the core concurrency-sensitive and security-sensitive code paths.
- A real, live deployment across managed cloud services, rather than a purely local demo.

**Out of scope (explicitly deferred, see also the Limitations section in the Conclusion chapter):**

- Multiple payment gateways or region-specific payment methods (e.g., UPI, wallets).
- Seat-level dynamic pricing, discounts, or promotional codes.
- Forgot-password / email-verification flows (the identity module supports signup, login, refresh, and logout only).
- A notifications system (email/SMS booking confirmations) — bookings are confirmed synchronously in the API response and visible in the user's dashboard instead.
- Horizontal scaling concerns beyond what a single Render web service instance and a single Upstash Redis instance provide; the system is designed to be _correct_ under concurrency, not to be load-tested at a specific throughput target.

### Stakeholders

Although this is an individually built academic project rather than a commercial product with real stakeholders, the system was designed around three internally consistent stakeholder personas so that the requirement-gathering and access-control decisions in later chapters have a concrete audience to be evaluated against:

- **The moviegoer** — wants to find a show, see an accurate, live seat map (not a stale one that leads to a failed booking after payment), and get a fast, unambiguous confirmation.
- **The theatre owner** — wants to list their own theatres and screens without needing platform-administrator involvement for routine operations (adding a screen, scheduling a show), but is willing to accept a one-time administrator approval step before being granted that capability, mirroring how real marketplace platforms (e.g., ride-sharing driver onboarding, e-commerce seller onboarding) vet new supply-side participants before granting them write access to shared inventory.
- **The platform administrator** — wants oversight (read access to all users, theatres, and bookings) and gatekeeping power (approving theatre-owner requests, curating the movie catalogue) without needing to perform day-to-day theatre operations themselves.

### Relevance

The seat-hold-then-confirm pattern used in this project is the same pattern used by real airline, train, and event-ticketing platforms: a resource (a seat) is provisionally locked for a short window while the customer completes payment, and is only durably committed once an external payment provider confirms the charge asynchronously. Getting this pattern right — and getting it _wrong_ in an obviously incorrect but tempting way (e.g., checking availability and booking in two separate, non-atomic steps) — is one of the most instructive concurrency problems a full-stack engineer can work through, because the failure mode (double-booking a seat, or worse, double-charging a customer for a seat that was already released) is highly visible and consequential in the real world. The role-based dashboards additionally mirror a very common real-world SaaS shape: a public-facing consumer product with a separate, more privileged operator/admin surface layered on the same data.

### Development Process

The project was implemented in six sequential phases — monorepo bootstrap, shared schema authoring, backend module-by-module implementation, frontend feature-by-feature implementation, integration wiring, and automated testing/documentation — followed by a seventh live-deployment phase once the application was feature-complete and tested. Each phase produced one or more incremental, working Git commits, so the commit history itself traces the system's evolution from an empty repository to a fully deployed application.

![Figure 2.01](figures/2.01-development-process.png)

**Figure 2.01** — Development Process Flow

### System Architecture

The deployed system consists of a static single-page React application served from Netlify, a stateless Express API deployed on Render, a managed MongoDB Atlas cluster for durable storage, and a managed Upstash Redis instance used exclusively as an atomic, expiring lock store for in-progress seat holds — never as a system of record. Stripe sits outside the platform's own infrastructure entirely: the API only ever creates a PaymentIntent and verifies an inbound, cryptographically signed webhook event; raw card data never touches TicketVerse's own servers.

![Figure 2.02](figures/2.02-system-architecture.png)

**Figure 2.02** — System Architecture

### Module Breakdown (Domain-Driven Design)

The backend (`apps/api/src/modules/`) is organized as six bounded contexts, each following the same four-layer internal structure — `domain/` (framework-free business rules and entities), `application/` (use-case functions that orchestrate domain logic), `infrastructure/` (Mongoose models and repository implementations, plus any adapters to other modules), and `interface/http/` (Express routes and controllers that translate HTTP requests into use-case calls). This consistent shape means any contributor who understands one module already knows where to look in every other module.

**Table 2.01** — Bounded Context / Module Summary

| Module     | Key Domain Entities                   | Representative Use Cases                                                             | Notable Infrastructure                                                                                          |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `identity` | `User`, `TheatreOwnerRequest`         | signup, login, refreshTokens, logout, requestTheatreOwner, reviewTheatreOwnerRequest | `MongoUserRepository`, `MongoTheatreOwnerRequestRepository`                                                     |
| `catalog`  | `Movie`                               | create/list/update/delete movie (admin-only writes)                                  | `MongoMovieRepository`                                                                                          |
| `theatre`  | `Theatre`, `Screen`                   | create theatre, define screen seat layout                                            | `MongoTheatreRepository`, `MongoScreenRepository`, plus lookup/provisioning adapters used by other modules      |
| `show`     | `Show`                                | schedule a show (movie × theatre × screen × time)                                    | `MongoShowRepository`, `ShowLookupAdapter`                                                                      |
| `booking`  | `Booking`, `seatLayout` (value logic) | hold seats, confirm booking, release expired holds                                   | `MongoBookingRepository`, `RedisSeatHoldAdapter` (the atomic seat-lock mechanism), `BookingConfirmationAdapter` |
| `payment`  | `Payment`                             | create PaymentIntent, handle Stripe webhook                                          | `MongoPaymentRepository`                                                                                        |

This module boundary is not merely organizational — it is enforced at the dependency level: the `booking` module depends on `show` and `theatre` only through narrow, purpose-built lookup adapters (e.g., `ShowLookupAdapter`, `ScreenLookupAdapter`) rather than importing those modules' Mongoose models directly. This means, for example, that the booking domain logic never needs to know _how_ a show is stored — only that it can ask "does this show exist, and what screen does it use?" through a small, stable interface. This is the same dependency-inversion discipline that Domain-Driven Design and hexagonal/ports-and-adapters architecture both recommend, and it is what keeps the `RedisSeatHoldAdapter` swappable in tests (replaced with `ioredis-mock`, discussed further in the Testing Strategy chapter) without touching a single line of business logic.
