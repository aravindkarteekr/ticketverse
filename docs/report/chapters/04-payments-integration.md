## Payments Integration

### How Payment Gateways Work

A payment gateway sits between a merchant's application and the card networks/banks, so that the merchant never has to handle raw card numbers directly. In practice this means the merchant's frontend collects card details inside an _iframe or SDK component hosted by the gateway itself_ (so the card number never enters the merchant's own JavaScript or servers), the merchant's backend asks the gateway to create a payment "intent" for a given amount, and the gateway confirms — asynchronously, via a signed server-to-server webhook — whether the charge actually succeeded. TicketVerse uses **Stripe** as its payment gateway, specifically the **PaymentIntents API** together with **Stripe Elements** on the frontend (`@stripe/react-stripe-js`), which is Stripe's documented, PCI-DSS-scope-reducing integration pattern for custom checkout UIs (Stripe, n.d.-a).

### The Payment Flow Implemented in TicketVerse

The end-to-end flow, from seat selection to a confirmed booking, is:

1. The user selects seats for a showtime; the frontend calls `POST /bookings/hold`, which atomically reserves each seat in Redis using `SETNX` with a time-to-live, so a seat can never be held by two users at once (see Ch.5 and the Requirement Gathering chapter's NFR-01).
2. On a successful hold, the frontend calls `POST /bookings`, which creates a `Booking` document in MongoDB with `status: "pending_payment"`.
3. The frontend calls `POST /payments/intent`, and the backend's `makeCreatePaymentIntent` use-case (`apps/api/src/modules/payment/application/paymentUseCases.ts`) calls `stripe.paymentIntents.create({...})`, persists a `Payment` record keyed by `stripePaymentIntentId`, and returns Stripe's `client_secret` to the frontend.
4. The frontend mounts Stripe's `PaymentElement` using that `client_secret` and calls `stripe.confirmPayment(...)` — at no point does card data pass through TicketVerse's own servers.
5. Stripe sends a webhook event (`payment_intent.succeeded` or `payment_intent.payment_failed`) to `POST /payments/webhook`. The backend's `makeHandleStripeWebhook` use-case verifies the event's signature with `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` — rejecting the request with a `ValidationError` if the signature does not match — before ever trusting the event body. Only after this verification does the booking flip to `confirmed` (and the corresponding Redis holds are released) or, on failure, the booking is cancelled and the holds released back to the pool.

![Figure 4.01](figures/4.01-payment-sequence.png)

**Figure 4.01** — Payment Sequence Diagram

### Role of Webhooks and HTTP Tunneling

Payment confirmation cannot safely be driven by the client telling the server "I paid" — a malicious or buggy client could claim success for a payment that never happened. Stripe's webhook mechanism solves this by having _Stripe itself_ call back into the merchant's server once it has independently confirmed the charge with the card network, and by cryptographically signing that callback so the merchant can verify it genuinely came from Stripe and was not forged or replayed. This is why `apps/api/src/app.ts` mounts the webhook route _before_ `express.json()`, using Express's raw-body middleware scoped to that single route — Stripe's signature is computed over the exact raw request bytes, and re-serializing a parsed JSON object would invalidate it.

During local development, Stripe cannot reach `localhost` directly, so the Stripe CLI's `stripe listen --forward-to localhost:4000/api/v1/payments/webhook` command was used to tunnel Stripe's webhook events to the developer's machine — functionally the same role that a tool like ngrok plays for other webhook-driven integrations, but purpose-built by Stripe for this exact use case (Stripe, n.d.-b). In production, the webhook is registered directly against the live Render URL, so no tunneling is needed once deployed.

### PCI DSS and Security Standards

The Payment Card Industry Data Security Standard (PCI DSS) defines security requirements for any system that stores, processes, or transmits cardholder data. By using Stripe Elements to collect card details directly into Stripe-hosted iframes and never routing raw card numbers through TicketVerse's own frontend JavaScript or Express backend, TicketVerse's PCI DSS compliance scope is reduced to **SAQ A**, the lightest self-assessment tier available to merchants who fully outsource card handling to a certified provider (PCI Security Standards Council, n.d.). TicketVerse's own responsibility is limited to keeping its Stripe secret key and webhook signing secret out of source control (both are supplied only via environment variables — see Ch.5 and Ch.6), and to verifying every webhook's signature before acting on it, which the implementation already does.

**Table 4.01** — What Touches TicketVerse's Own Servers vs. Stripe

| Data / Responsibility                     | TicketVerse Server                                      | Stripe                                                        |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Raw card number, CVC, expiry              | Never                                                   | Collected directly via Stripe Elements                        |
| PaymentIntent creation (amount, currency) | Yes (`stripe.paymentIntents.create`)                    | Confirms and processes the charge                             |
| Card-network authorization decision       | No                                                      | Yes                                                           |
| Payment success/failure notification      | Received via signed webhook only                        | Originates and signs the event                                |
| Storing full card data at rest            | Never                                                   | N/A (Stripe never stores raw PAN on merchant's behalf either) |
| Refunds/disputes                          | Not implemented in v1 (would call Stripe's Refunds API) | Handles fund movement                                         |

### Alternative Payment Gateways Considered

Stripe was chosen over two commonly used alternatives after weighing each against the project's specific requirements:

- **Razorpay** — the gateway used in the official project template's own worked example, and a natural fit for an India-first audience given its native UPI and net-banking support (Razorpay, n.d.). It was not chosen for this implementation because Stripe's PaymentIntents/Elements documentation and TypeScript SDK typings are more thoroughly documented for a custom React integration, and Stripe's test-mode tooling (the Stripe CLI's `listen`/`trigger` commands, discussed below) made local webhook development materially faster to iterate on. The underlying integration pattern — create an intent server-side, collect card data in a gateway-hosted component, confirm via signed webhook — is essentially identical between the two providers, so the architectural lessons transfer directly regardless of which gateway is used in production for a given market.
- **PayPal Checkout** (PayPal, Inc., n.d.) — rejected primarily because PayPal's redirect-based (rather than embedded-element-based) checkout flow does not exercise the same "raw card data must never touch the merchant's own frontend/backend" PCI-scope-reduction pattern as directly, since a meaningful fraction of PayPal transactions do not involve card entry at all, making it a weaker vehicle for teaching PCI DSS scope reduction specifically.
- **A custom/naive gateway simulation** (i.e., mocking "payment success" entirely in-house) — rejected outright, because it would eliminate the single hardest and most instructive problem in the whole project: reconciling an _asynchronous, externally sourced_ confirmation event with an already-created, pending domain record, which is precisely the failure mode that makes real payment integrations difficult.

### Idempotency and Retry Handling

Two related reliability properties matter for a webhook-driven payment flow, and both are addressed by the implementation:

1. **Webhook delivery is at-least-once, not exactly-once.** Stripe's own documentation states that a webhook endpoint may receive the same event more than once (for example, if the endpoint is slow to respond and Stripe's delivery attempt times out before retrying) (Stripe, n.d.-b). TicketVerse's webhook handler is written to be safe under duplicate delivery: looking up the `Payment` record by its unique `stripePaymentIntentId` and only transitioning `pending → confirmed` once means a second identical webhook delivery for an already-confirmed payment is a harmless no-op rather than a double-processed booking or a duplicate confirmation side effect.
2. **The client-side confirmation call (`stripe.confirmPayment`) is itself retryable.** If a user's network connection drops after Stripe has received their card details but before the browser learns the outcome, the _authoritative_ outcome is still the webhook — the frontend's own confirmation call succeeding or failing is treated as a fast-path UX signal, not as the source of truth for whether the booking is actually confirmed. This is precisely why the webhook, not the `confirmPayment` promise resolving, is what flips the booking's status in the database (see step 5 of the Payment Flow above).

### Testing the Payment Flow

Because a full backend integration test cannot ethically or practically make a real charge against Stripe's live card networks, the payment flow was verified using Stripe's own test-mode tooling rather than being skipped:

- **Stripe's published test card numbers** (e.g., `4242 4242 4242 4242` for a guaranteed-success Visa card, and dedicated numbers for guaranteed declines and 3D Secure challenges) were used to manually exercise both the success and failure branches of the flow end-to-end in the deployed test-mode environment, confirming that a declined card correctly leaves the booking in a cancelled state with the seats released back to the pool.
- **`stripe trigger payment_intent.succeeded`** (via the Stripe CLI) was used during development to fire synthetic webhook events at the locally tunnelled endpoint without needing to complete a full Elements checkout each time, speeding up iteration on the webhook handler itself.
- The automated backend test suite (see the Testing Strategy chapter) does not call the real Stripe API at all; instead, it exercises the booking module's concurrency guarantees directly, since the payment confirmation step is, by design, a thin, already-battle-tested boundary (Stripe's own signature-verification library) wrapping a simple state transition.
