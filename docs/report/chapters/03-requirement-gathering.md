## Requirement Gathering

### Requirement Gathering Methodology

Because this is an individually built academic project rather than a client engagement, requirements could not be gathered through stakeholder interviews in the traditional sense. Instead, a structured, three-step elicitation process was used to arrive at the functional and non-functional requirements below, chosen specifically to keep the requirements grounded in how real commercial ticketing platforms behave rather than in an idealized or convenient design:

1. **Domain research against real platforms.** The booking flows of well-known ticketing and travel platforms (cinema chains, airline seat selection, train reservation systems) were studied to identify the invariants they all share: a seat/berth/slot is a uniquely identifiable, non-substitutable resource; availability must be shown close to real-time; and a booking is only final once payment clears, not the moment a seat is clicked. These invariants were converted directly into NFR-01 and NFR-04.
2. **Role and persona derivation.** Starting from the single "moviegoer" persona, the two supply-side and platform-operator personas (theatre owner, administrator) were derived by asking, for each piece of data the moviegoer depends on (movie listings, showtimes, seat layouts), _who is responsible for keeping that data correct, and what is the minimum access that role needs to do so without being able to affect data outside their own scope._ This directly produced the role-scoping requirements FR-08–FR-13 and the authorization design described in the Security chapter.
3. **User-story-to-endpoint traceability.** Each functional requirement below was written as a short user story ("As a _\<role>_, I want to _\<action>_, so that _\<outcome>_") and then immediately mapped to a concrete backend endpoint before any UI was built, following an API-first discipline. This traceability is preserved in Table 3.03 below, so every requirement in this chapter can be checked against a real, tested route rather than remaining an unverified aspiration.

This process deliberately favours requirements that are _falsifiable by a test_ — for example, NFR-01 ("two concurrent holds on the same seat must never both succeed") is not a vague quality goal; it is exactly the assertion made by the concurrent-booking automated test described in the Testing Strategy chapter.

### Functional Requirements

Functional requirements describe what the system must _do_, organized by the three user roles the platform serves.

**Table 3.01** — Functional Requirements

| ID    | Requirement                                                                                                                                 | Actor         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| FR-01 | A visitor can create an account (email + password) and log in.                                                                              | User          |
| FR-02 | A logged-in user can browse and search movies, and view showtimes filtered by movie, city, and date.                                        | User          |
| FR-03 | A user can view a real-time seat map for a chosen showtime, reflecting both confirmed bookings and seats currently held by other users.     | User          |
| FR-04 | A user can select one or more available seats and place a temporary hold on them before paying.                                             | User          |
| FR-05 | A user can pay for a held booking through Stripe; on successful payment the booking is confirmed automatically without further user action. | User          |
| FR-06 | A user can view their own booking history.                                                                                                  | User          |
| FR-07 | A user can submit a request to become a theatre owner.                                                                                      | User          |
| FR-08 | A theatre owner can view and update the theatres they own.                                                                                  | Theatre Owner |
| FR-09 | A theatre owner can create, list, and delete screens (with a seat layout of rows/columns and seat type) for their own theatres only.        | Theatre Owner |
| FR-10 | A theatre owner can schedule, update, and cancel showtimes for their own screens, selecting a movie from the shared catalogue.              | Theatre Owner |
| FR-11 | An administrator can approve or reject theatre-owner requests; approval promotes the requester's role and provisions their theatre record.  | Administrator |
| FR-12 | An administrator has exclusive rights to create, update, and delete entries in the movie catalogue.                                         | Administrator |
| FR-13 | An administrator can view a paginated oversight list of all users, all theatres, and all bookings on the platform.                          | Administrator |

### Non-Functional Requirements

**Table 3.02** — Non-Functional Requirements

| ID     | Category                      | Requirement                                                                                                                                                                                                                               |
| ------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Concurrency correctness       | Two users attempting to hold the same seat concurrently must never both succeed; the losing request must receive a clear, actionable conflict response.                                                                                   |
| NFR-02 | Security                      | Passwords must never be stored in plaintext; authentication tokens must never be readable by client-side JavaScript.                                                                                                                      |
| NFR-03 | Security                      | All state-changing endpoints must validate their input against a shared schema before touching the database, rejecting malformed or malicious payloads.                                                                                   |
| NFR-04 | Availability of payment truth | Booking confirmation must depend on a signed event from the payment provider, not on the client reporting "payment succeeded" itself.                                                                                                     |
| NFR-05 | Portability                   | The system must run identically against local, containerless development infrastructure (native MongoDB/Redis) and managed cloud infrastructure (MongoDB Atlas/Upstash), with no code changes — only environment variables should differ. |
| NFR-06 | Testability                   | Core business rules (auth, RBAC, booking concurrency) must be covered by automated tests that run without any real external network dependency.                                                                                           |
| NFR-07 | Maintainability               | Business logic must be isolated from Express/Mongoose so that domain rules can be unit-tested and reasoned about independently of the HTTP framework.                                                                                     |
| NFR-08 | Usability                     | Every data-driven page must present a distinct loading state, error state (with retry), and empty state, rather than a blank screen on failure or absence of data.                                                                        |

### Users and Use Cases

TicketVerse has three actors, each mapped to a distinct set of use cases enforced server-side by role-based middleware rather than merely hidden in the UI:

- **User** (default role on signup) — the moviegoer: browses, books, and pays.
- **Theatre Owner** (elevated via an admin-approved request) — manages their own theatres, screens, and showtimes only; cannot touch the shared movie catalogue.
- **Administrator** — curates the shared movie catalogue, reviews theatre-owner applications, and holds read-only oversight across the whole platform.

![Figure 3.01](figures/3.01-use-case-diagram.png)

**Figure 3.01** — Use Case Diagram

### Detailed Use Case Descriptions

The following use cases were selected for detailed description because each one exercises a distinct, non-trivial requirement from Table 3.01 and Table 3.02 — concurrency safety, asynchronous payment confirmation, and scoped authorization, respectively — rather than being a routine CRUD operation.

**Table 3.04** — Use Case: Hold and Book Seats (UC-04/UC-05)

| Field                        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor                        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Preconditions                | User is authenticated; the target show exists and has not started; at least one requested seat is not already held or booked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Main Flow                    | 1. User requests a hold on a set of seat IDs for a show. 2. The API attempts an atomic Redis `SETNX`-with-TTL lock for every requested seat in a single pass. 3. If all locks succeed, a pending `Booking` record is created and the held seat IDs and hold-expiry timestamp are returned to the client. 4. The client requests a Stripe PaymentIntent for the held booking. 5. The client confirms payment via Stripe Elements. 6. Stripe sends a signed webhook event to the API. 7. The API verifies the signature, marks the `Payment` and `Booking` as confirmed, and releases nothing (the seats remain permanently assigned to this booking). |
| Alternate Flow (conflict)    | At step 2, if any single seat's lock acquisition fails, the entire hold attempt is rejected as a unit (no partial holds) and the user receives a 409-style conflict response naming the unavailable seats.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Alternate Flow (abandonment) | If the user never completes payment, the Redis key's TTL expires automatically, releasing the seats back to the pool without requiring a background cleanup job.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Postconditions               | Either the booking is confirmed and the seats are permanently unavailable to all other users, or the hold expires and the seats return to the available pool.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

**Table 3.05** — Use Case: Request and Approve Theatre Ownership (UC-08/UC-13)

| Field                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor(s)                                  | User (requester), Administrator (approver)                                                                                                                                                                                                                                                                                                                                                                     |
| Preconditions                             | Requester has an active User-role account; no pending request already exists for that user.                                                                                                                                                                                                                                                                                                                    |
| Main Flow                                 | 1. User submits a theatre-owner request (with theatre details). 2. Request is stored in a pending state, visible only to administrators. 3. Administrator reviews the pending request queue. 4. Administrator approves the request. 5. The user's role is promoted to `theatre_owner`, a `Theatre` record is provisioned from the request's details, and the user's `tokenVersion` is incremented server-side. |
| Alternate Flow (rejection)                | At step 4, the administrator instead rejects the request; the requester's role is left unchanged and no theatre is provisioned.                                                                                                                                                                                                                                                                                |
| Alternate Flow (forced re-authentication) | Because JWTs are stateless, the promoted user's _existing_ access token still carries the old role until it expires (at most 15 minutes) or until they next refresh, at which point the refresh handler detects the `tokenVersion` bump and issues new tokens carrying the updated role — this is the mechanism, not a bug, by which a mid-session role promotion is safely propagated without a full logout.  |
| Postconditions                            | Approved requester can now create/manage their own theatres, screens, and shows; rejected requester remains a User.                                                                                                                                                                                                                                                                                            |

**Table 3.06** — Use Case: Scoped Theatre Management (UC-09/UC-10)

| Field                            | Description                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor                            | Theatre Owner                                                                                                                                                                                                                                                                             |
| Preconditions                    | Actor holds the `theatre_owner` role and owns at least one `Theatre` record.                                                                                                                                                                                                              |
| Main Flow                        | 1. Owner requests their own theatre list. 2. The API filters the query by the authenticated user's ID as the theatre's owner field — never by a client-supplied theatre ID alone. 3. Owner creates a screen (seat layout) or a show against one of their own theatres.                    |
| Alternate Flow (scope violation) | If the owner attempts to modify a theatre, screen, or show whose owner field does not match their own user ID, the request is rejected with a 403 regardless of whether the target resource exists, preventing both unauthorized writes and existence-leakage of other owners' resources. |
| Postconditions                   | Owner's own inventory is updated; no other owner's data is visible or modifiable.                                                                                                                                                                                                         |

### Feature Set

The table below maps each implemented feature to its concrete HTTP surface in `apps/api`, confirming that every use case above has a corresponding, tested backend endpoint rather than existing only as a UI mock.

**Table 3.03** — Feature Set to API Mapping

| Feature Area              | Endpoint(s)                                                                                                                      | Access                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Authentication            | `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`                                    | Public / cookie-authenticated |
| Theatre-owner onboarding  | `POST /theatre-owner-requests`, `POST /theatre-owner-requests/:id/review`, `GET /admin/theatre-owner-requests`                   | User / Admin                  |
| Movie catalogue           | `GET /movies`, `GET /movies/:id`, `POST /PATCH /DELETE /movies(/:id)`                                                            | Public read / Admin write     |
| Theatres & screens        | `GET /theatres/mine`, `GET /theatres/:id`, `PATCH /theatres/:id`, `GET/POST /theatres/:theatreId/screens`, `DELETE /screens/:id` | Owner-scoped                  |
| Showtimes                 | `GET /shows`, `GET /theatres/:theatreId/shows`, `GET /shows/:id`, `POST/PATCH/DELETE /shows(/:id)`                               | Public read / Owner write     |
| Seat availability & holds | `GET /shows/:showId/seats`, `POST /bookings/hold`                                                                                | Authenticated                 |
| Bookings                  | `POST /bookings`, `GET /bookings/mine`, `GET /bookings/:id`, `GET /admin/bookings`                                               | Authenticated / Admin         |
| Payments                  | `POST /payments/intent`, `POST /payments/webhook`                                                                                | Authenticated / Stripe-signed |
| Admin oversight           | `GET /admin/users`, `GET /admin/theatres`, `GET /admin/bookings`                                                                 | Admin                         |
