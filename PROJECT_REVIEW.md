# Production Readiness Review

The following findings cover the React frontend, Express/Prisma and FastAPI services, plus cross-cutting delivery practices. Each item pairs an observed issue with targeted remediation guidance.

## Backend foundations
- **Choose a single API stack and retire the duplicate.** Both the Express server (`backend/src`) and the FastAPI project (`backend/app`) expose overlapping routers, which doubles maintenance and makes it unclear which contract the frontend should consume.【F:nursery-system/backend/src/app.ts†L1-L35】【F:nursery-system/backend/app/main.py†L1-L121】 Standardize on one implementation, port any unique features across, and delete the redundant stack so deployments have a single source of truth.
- **Tighten CORS and configuration management.** Express currently reflects any origin while enabling credentials, and FastAPI hard-codes a localhost URL, both of which are unsafe in production.【F:nursery-system/backend/src/app.ts†L11-L18】【F:nursery-system/backend/app/main.py†L54-L63】 Drive allowed origins, JWT secrets, and logging levels from environment variables shared across the chosen backend.
- **Replace ad-hoc logging and stub analytics.** The FastAPI admin analytics endpoint still returns placeholder buckets and logs failures via `print`, preventing meaningful monitoring.【F:nursery-system/backend/app/admin_router.py†L13-L84】 Move to structured logging, surface machine-readable error codes, and generate analytics through real SQL aggregations with guardrails for missing data.
- **Unify error handling and observability.** Express falls back to `console.error` for unexpected exceptions, and FastAPI mixes `print` statements with logger usage.【F:nursery-system/backend/src/middleware/errorHandler.ts†L1-L27】【F:nursery-system/backend/app/main.py†L48-L95】 Establish a shared logger, emit request IDs, and forward severe events to your monitoring stack. Add health checks and readiness probes aligned to your deployment environment.

## Security and authentication
- **Harden token lifecycle management.** The React provider persists both access and refresh tokens in `localStorage`, then blindly clears state on any 401 without attempting refresh.【F:nursery-system/frontend/src/contexts/AuthContext.jsx†L31-L133】【F:nursery-system/frontend/src/lib/apiClient.js†L19-L36】 Move refresh tokens to httpOnly cookies, keep access tokens in memory, and add a refresh flow that retries once before forcing logout.
- **Align payload contracts.** The frontend expects `{ access_token, refresh_token }` objects scattered across the auth hooks, while the Express controllers emit `{ tokens, user }` payloads. Normalize the response schema and document the contract so mobile/web clients can share one implementation.
- **Instrument account security features.** Add brute-force throttling, audit logging, and token revocation endpoints so compromised credentials can be isolated quickly.

## Frontend architecture
- **Generate routes from a single role-aware map.** `App.jsx` repeats nearly identical `<Route>` trees and suspense wrappers for every role, increasing the risk of drift whenever a layout or guard changes.【F:nursery-system/frontend/src/App.jsx†L59-L236】 Extract a route definition manifest (path, component, roles, loader) and use it to render both navigation and router elements.
- **Centralize error and loading UX.** Lazy-loaded views only use Suspense spinners and lack Error Boundaries, so render failures take down entire dashboards.【F:nursery-system/frontend/src/App.jsx†L45-L58】 Pair each lazy page with a boundary component and provide retry affordances and skeleton states that match the card layout used throughout the dashboards.
- **Standardize network side effects.** Every React Query mutation redefines `toast` handlers, leading to duplicated strings and inconsistent behavior.【F:nursery-system/frontend/src/hooks/useAPI.js†L13-L260】 Move toast logic into a shared helper (or leverage React Query’s `onError`/`onSuccess` defaults) and expose loading states so components can show contextual feedback.
- **Introduce a resilient API client.** The Axios wrapper clears tokens on 401 but never attempts refresh, and it mixes response normalization with localization concerns.【F:nursery-system/frontend/src/lib/apiClient.js†L19-L136】 Create layered utilities: a core HTTP client with retry/refresh logic, a thin data-access layer for each resource, and translation-aware UI helpers for messaging.

## Delivery and quality
- **Codify environment setup and automation.** Provide `.env.example` files for the surviving backend and the Vite client, document migration/seed steps, and add scripts that validate configuration at startup.
- **Extend automated coverage.** Backfill unit and integration tests across the chosen backend (auth, nursery management, analytics) and critical frontend flows (routing, auth context). Wire linting, tests, and type checks into CI so regressions surface before release.
- **Add runtime telemetry.** Expose metrics endpoints (request rate, latency, error counts) and forward structured logs to your APM/SIEM to support on-call response once the product goes live.

Implementing the above will retire redundant code paths, reinforce the security surface, and give operators the observability required for production support.
