# Productization Remediation Directive

This document describes the required upgrades to transform the project into a production-grade platform. Each instruction is framed as a direct order to the implementation agent; treat every item as mandatory.

## 1. Consolidate the Backend
1. Select one stack (Express/Prisma or FastAPI/SQLAlchemy) as canonical. Remove the redundant implementation entirely after porting any missing features.
2. For the chosen stack:
   - Refactor configuration to be `.env` driven (CORS origins, JWT secrets, database URLs, logging level).
   - Replace all `console.log`/`print` statements with the shared logger; propagate request IDs across middleware/routers.
   - Implement structured error handling so every 4xx/5xx response includes a machine-readable error code.
   - Build analytics queries that compute real metrics (age buckets, governorate distribution) directly in the database layer.
3. Ship automated tests (unit + integration) that exercise the full auth flow, analytics endpoints, and error boundaries. Wire them into CI.

## 2. Harden Authentication
1. Store refresh tokens in httpOnly cookies; keep access tokens in memory and rotate them on every refresh.
2. Align frontend expectations with backend responses. Standardize token payload shape (`{ accessToken, refreshToken, expiresIn }`) and update all clients accordingly.
3. Add a backend endpoint for token introspection/refresh that enforces rotating refresh tokens and revokes on suspicious activity.
4. Document the entire auth lifecycle (login, refresh, logout, token invalidation) in API docs.

## 3. Frontend Architecture Upgrades
1. Centralize route configuration by defining a single role-to-routes map. Use it to render both navigation and `<Route>` definitions so new routes require only one addition.
2. Introduce a dedicated Axios (or Fetch) wrapper with:
   - Response interceptor that retries once on 401 via refresh token.
   - Unified error normalization that surfaces consistent toast/alert payloads.
3. Implement React Error Boundaries paired with Suspense fallbacks on every lazy-loaded page. Provide a retry button that re-invokes data loaders.
4. Replace duplicated toast logic in hooks with a shared notification utility.
5. Add skeleton loaders for key dashboard panels to maintain perceived performance during fetches.

## 4. Security and Observability
1. Lock down CORS to an environment-driven allowlist. Reject requests from unknown origins by default.
2. Add CSRF mitigation (csrf tokens or SameSite=strict cookies) and security headers middleware (Helmet for Express, `SecurityMiddleware` for FastAPI).
3. Emit structured logs (JSON) and connect them to monitoring/alerting tooling. Include metrics for authentication failures, data access errors, and slow queries.
4. Implement rate limiting on sensitive endpoints (auth, admin analytics) and ensure the limits are configurable via environment variables.

## 5. Delivery Pipeline
1. Create reproducible environment templates (`.env.example`, seed scripts, migration commands) for both development and production.
2. Configure lint/test workflows for the chosen backend stack and the React frontend (ESLint, TypeScript checks, unit tests).
3. Add end-to-end smoke tests that drive the React Query hooks against the API to prevent contract regressions.
4. Provide deployment documentation covering build steps, environment variables, and rollback procedures.

## 6. Execution Order
1. Decide on the canonical backend and eliminate the duplicate implementation.
2. Apply the authentication hardening across backend/frontend in tandem.
3. Refactor frontend architecture and shared client utilities.
4. Layer in security/observability enhancements.
5. Finish with CI/CD pipeline automation and documentation updates.

Failure to complete any item blocks production readiness. Execute sequentially unless a task explicitly depends on another.
