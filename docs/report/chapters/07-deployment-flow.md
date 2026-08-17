## Deployment Flow

### Source Control

TicketVerse's entire history — from the initial monorepo bootstrap commit through every backend module, frontend feature, security fix, and deployment configuration change — is kept in a single Git repository on GitHub (`aravindkarteekr/ticketverse`, `main` branch), following the Conventional Commits format (`type(scope): description`) so the commit log itself is a readable, chronological record of the build process referenced throughout this report.

### Live Deployment Topology

The application is deployed across four managed, free-tier cloud services rather than described only hypothetically:

- **Backend API** — deployed on **Render** as a web service, live at `https://ticketverse-api.onrender.com`, built and started via a `render.yaml` Blueprint at the repo root (Render, n.d.). Render only picks up `render.yaml` when a service is created through its **Blueprint** flow specifically — creating a plain "Web Service" ignores the file entirely, which was confirmed directly during this project's own deployment.
- **Frontend** — deployed on **Netlify** as a static single-page application, live at `https://ticketverse-web.netlify.app`, built via `netlify.toml` at the repo root with a client-side routing rewrite (`/* -> /index.html`, status 200) so React Router's deep links resolve correctly on refresh (Netlify, n.d.).
- **Database** — **MongoDB Atlas** free-tier (M0) cluster, connected via `mongodb+srv://` SRV-record connection string.
- **Cache / lock store** — **Upstash Redis** free-tier instance, connected via a `rediss://` (TLS) URL that `ioredis` auto-detects and upgrades to a TLS connection with no code changes.
- **Payment gateway** — **Stripe**, in test mode, with a live webhook endpoint registered against the deployed Render URL (`https://ticketverse-api.onrender.com/api/v1/payments/webhook`).

![Figure 6.01](figures/6.01-deployment-architecture.png)

**Figure 6.01** — Deployment Architecture

### Build Configuration Gotcha: `NODE_ENV=production` and devDependencies

Both Render and Netlify set `NODE_ENV=production` automatically as a build-time environment variable. By default, `npm install` under `NODE_ENV=production` skips `devDependencies` entirely — which broke the very first deploy attempt, because this monorepo's build tools (`tsup`, `typescript`, `vite`) are all declared as devDependencies, not production dependencies. The fix, applied identically in both `render.yaml` and `netlify.toml`, was to change the build command to explicitly request dev dependencies:

```
npm install --include=dev && npx turbo run build --filter=@ticketverse/api
```

This is a generalizable lesson for any Node.js monorepo deployed to a platform that sets `NODE_ENV=production` at build time: the _build_ step still needs devDependencies (compilers, bundlers), even though the _runtime_ step correctly should not.

### CORS and Cross-Site Cookies

Because the frontend (`ticketverse-web.netlify.app`) and backend (`ticketverse-api.onrender.com`) are served from different origins, two changes were required beyond a purely same-origin local setup:

1. **CORS** — Express's `cors` middleware is configured with an explicit single allowed origin (`CLIENT_ORIGIN`, set to the live Netlify URL) and `credentials: true`, so the browser permits the frontend's `axios` client (configured with `withCredentials: true`) to send and receive TicketVerse's authentication cookies cross-site.
2. **Cookie attributes** — in production, TicketVerse's cookie-setting code flips to `Secure: true; SameSite: "None"`, which modern browsers require for any cookie sent on a cross-site request; on `localhost`, cookies instead use `SameSite: "Lax"` without `Secure`, since local HTTP traffic isn't HTTPS. This is driven entirely by an environment flag (`COOKIE_SECURE`) rather than hard-coded, so no source change was needed between local and production environments.

### Environment Variables and Secret Management

`render.yaml` marks every secret-bearing environment variable (`MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) as `sync: false`, which tells Render to prompt for the value once in its dashboard rather than reading it from the (public) repository — meaning no real secret was ever committed to Git or pasted into a shared document. `VITE_API_BASE_URL` and `VITE_STRIPE_PUBLISHABLE_KEY` are configured as Netlify build-time environment variables; because Vite bakes environment variables into the built JavaScript bundle at build time (not read at runtime), any change to these values requires a fresh Netlify build/deploy to take effect, which was itself the root cause of one deployment issue encountered (the initial `VITE_API_BASE_URL` value omitted the `/api/v1` path prefix, causing every API call from the deployed frontend to 404 until it was corrected and the site rebuilt).

### Deployment Verification

At the time of writing, both the live API health check (`GET /health` → `200 OK`) and the live frontend (`GET /` → `200 OK`) were confirmed reachable, and a request to the live signup endpoint correctly returned a `400` validation error for an empty payload rather than a `404`, confirming the API-base-URL and routing configuration are correctly wired end-to-end in production.

### CI/CD Approach

TicketVerse does not use a separate GitHub Actions workflow (there is no `.github/workflows/` directory in the repository); build and test verification, and deployment, are instead split across two distinct mechanisms:

1. **Local pre-push verification** — before any commit is pushed, the full monorepo check (`npx turbo run typecheck lint test build`) is run locally across every workspace, using Turborepo's task graph to build and test packages in dependency order and cache unchanged results between runs. This is the gate that catches type errors, lint violations, and failing tests _before_ they ever reach `main`.
2. **Platform-native continuous deployment** — both Render and Netlify are configured (via `render.yaml` and `netlify.toml` respectively) to watch the `main` branch directly and automatically trigger a fresh build and deploy on every push, without any intermediate GitHub Actions orchestration layer.

This is a deliberate trade-off rather than an oversight: for a single-contributor academic project, a dedicated GitHub Actions workflow would duplicate work that Turborepo's local task graph and the two hosting platforms' own native build pipelines already perform, at the cost of additional YAML to maintain and CI minutes to consume. The trade-off this defers is **pre-merge protection on pull requests** — since there are no feature branches merged via reviewed PRs in a solo project, a GitHub Actions workflow's main practical benefit (blocking a broken PR from merging) does not apply here. For a team project or a production system with multiple contributors, adding a GitHub Actions workflow that runs the same `turbo run typecheck lint test build` command on every pull request would be the natural next step, and is noted explicitly as a possible improvement in the Conclusion chapter.

### Monitoring and Health Checks

TicketVerse's operational visibility currently rests on three mechanisms, all already in place rather than hypothetical:

- **A dedicated `/health` endpoint** (deliberately kept outside the `/api/v1` versioned route prefix, and outside the `/api/v1/auth` rate limiter) that Render polls automatically to determine whether the deployed instance is healthy enough to keep serving traffic, and to gate zero-downtime redeploys — Render will not route traffic to a new deploy until its health check passes.
- **Platform log streams** — both Render and Netlify expose a live build-and-runtime log stream in their respective dashboards; the centralized Express error handler's `console.error(err)` calls for unhandled/programming errors land directly in Render's log stream, which was used during this project to diagnose the `express-rate-limit`/`trust proxy` misconfiguration (Ch.5) from a live production error rather than from a local reproduction.
- **Manual live-endpoint verification** — the `curl`-based checks described in Deployment Verification above were performed directly against the production URLs at the point of each deployment change, rather than assumed to be correct from the build succeeding alone; a successful build and a successfully _running_ application are not the same guarantee, particularly for configuration-only failures (missing environment variables, CORS misconfiguration) that only surface at runtime.

No dedicated uptime-monitoring or alerting service (e.g., a synthetic uptime check with paging) is configured, since both Render and Netlify's free tiers already provide basic platform-level restart-on-crash behaviour, and a single-operator academic project does not have an on-call rotation to page. This is named explicitly as a Limitation in the Conclusion chapter rather than left implicit.

### Rollback Strategy

Because both Render and Netlify redeploy directly from the `main` branch's latest commit, rolling back a bad deployment reduces to a Git operation rather than a bespoke deployment-tool procedure: both platforms retain a history of previous successful deploys in their dashboards and support re-promoting a prior deploy to production with a single click, independent of the current state of `main` — this was used as a safety net (though not actually needed) during the live-deployment phase of this project, since a broken deploy on either platform can be reverted to the last known-good build without needing to force-push or revert commits in Git first. For a Git-level rollback (as opposed to a platform-dashboard rollback), `git revert` of the offending commit followed by a normal push is the preferred mechanism, since it preserves history and triggers the same automatic redeploy pipeline as any other change, rather than `git reset --hard` plus a force-push, which would rewrite shared history unnecessarily for what is, functionally, just another forward-moving commit.
