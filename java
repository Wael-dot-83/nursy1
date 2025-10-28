Java Three-Tier Delivery Playbook for the Nursery System
=======================================================

Purpose and Audience
--------------------
This playbook equips Java engineers with everything needed to implement, integrate, and operate the Nursery System on a Java technology stack. It preserves feature parity with the existing platform, enforces three-tier separation of concerns, and provides detailed workflows so every capability can be rebuilt or extended with confidence.

Architecture Goals
------------------
- Deliver maintainable software through clear tier boundaries, Hexagonal Architecture, and domain-driven design practices.
- Support multi-tenant nurseries with strict data isolation, auditability, and compliance with childcare regulations.
- Enable predictable releases via automated testing, continuous delivery pipelines, and robust observability.
- Provide a foundation that scales horizontally, handles bursty workloads (attendance scans, reporting), and stays operable under incident conditions.

Three-Tier Overview
-------------------
1. **Presentation tier**  
   - Channels: Browser (React + TypeScript) and optional React Native mobile apps.  
   - Responsibilities: User experience, state management, accessibility, offline hints, localization.  
   - Communication: HTTPS REST calls to the application tier, JSON payloads, token-based authentication.
2. **Application tier**  
   - Technology: Java 21, Spring Boot 3.x, modularized per bounded context.  
   - Responsibilities: Expose REST APIs, enforce business policies, orchestrate workflows, integrate with third parties, publish domain events.
3. **Data tier**  
   - Components: PostgreSQL 15 (primary data store), Redis (cache and session store), S3-compatible object storage (documents), optional RabbitMQ or Kafka (async processing).  
   - Responsibilities: Reliable storage, transactional integrity, caching, archival, and disaster recovery.

Technology Stack Summary
------------------------
- **Build tooling**: Gradle with Kotlin DSL (preferred) or Maven. Wrapper (`gradlew`/`mvnw`) committed for reproducibility.  
- **Frameworks**: Spring Boot, Spring Web, Spring Security, Spring Data JPA, Spring Validation, Spring Batch, Spring Cloud OpenFeign, MapStruct, Jackson.  
- **Testing**: JUnit 5, AssertJ, Mockito, Testcontainers, WireMock, Pact, Gatling or k6.  
- **Frontend**: React 18, Vite, TypeScript, React Query, Zustand or Redux Toolkit, React Router, Tailwind or MUI, Cypress.  
- **Static analysis**: Spotless, Checkstyle or ErrorProne, SonarQube/SonarLint, OWASP Dependency-Check, Trivy.  
- **DevOps**: Docker, Docker Compose, Helm, Kustomize, Argo CD or Flux, GitHub Actions or GitLab CI, Terraform for infrastructure.

Development Environment Setup
-----------------------------
1. **Prerequisites**:  
   - JDK 21 (Temurin).  
   - Node.js 18 LTS with pnpm (preferred) or npm.  
   - Docker Desktop, Docker Compose V2.  
   - PostgreSQL client (`psql`), Redis CLI, AWS CLI or MinIO client.  
   - Make or Taskfile (optional) for scripted workflows.
2. **Repository layout**:  
   - Place Java implementation under `nursery-system/java` next to the existing Python backend for reference.  
   - Maintain mono-repo to share infrastructure definitions, front-end code, contracts, and documentation.
3. **Initialize build**:  
   ```
   cd nursery-system/java
   ./gradlew wrapper
   ./gradlew build -x test
   ```
4. **Configuration files**:  
   - `presentation/.env.local`: `VITE_API_BASE_URL`, OAuth client identifiers, feature flags.  
   - `application/.env.local`: `SPRING_DATASOURCE_URL`, `JWT_ISSUER_URI`, storage credentials, feature toggles.  
   - `infra/.env`: shared credentials for Docker Compose services.  
   Store production secrets in Vault or a cloud secret manager; never commit them.
5. **Local infrastructure**:  
   ```
   docker compose -f infra/local/docker-compose.yml up -d postgres redis minio mailhog
   ```
6. **Smoke test**:  
   - Launch application: `./gradlew :application:bootRun --args='--spring.profiles.active=local'`.  
   - Verify health: `curl http://localhost:8080/actuator/health`.  
   - Run front-end dev server: `pnpm dev` from `frontend/`.

Repository and Module Layout
----------------------------
```
nursery-system/
|-- java/
|   |-- settings.gradle.kts
|   |-- build.gradle.kts
|   |-- modules/
|   |   |-- presentation-api/        (REST controllers, OpenAPI spec, exception handlers)
|   |   |-- application-service/     (use cases, transactional orchestrations)
|   |   |-- domain/                  (aggregates, entities, value objects, domain services)
|   |   |-- infrastructure/          (persistence adapters, messaging, integrations)
|   |   `-- shared-kernel/           (common utilities, base classes, cross-cutting concerns)
|   |-- docker/
|   |   `-- docker-compose.yml
|   `-- docs/
|       `-- architecture.adoc
`-- frontend/                         (existing React implementation)
```

Design Principles
-----------------
- Prefer interface-driven development; domain interfaces live in `domain`, implementations in `infrastructure`.  
- Keep application services orchestration-only: they coordinate repositories, domain services, and external adapters.  
- Use record DTOs for requests/responses, immutable value objects for domain invariants, and explicit mappers (MapStruct).  
- Enforce module boundaries in Gradle (`implementation` vs `api` configurations) and enable the `java-library` plugin for modularity.  
- Adopt feature toggles via Spring Cloud Feature Flags or `@Conditional` beans for staged rollouts.

Presentation Tier Blueprint
---------------------------
- **Authentication**: PKCE OAuth 2.0. Tokens stored in HTTP-only cookies; refresh flow triggered by `react-query` interceptors.  
- **State management**:  
  - Global auth state: React Context + Zustand store.  
  - Server state: React Query with stale-time tuned per endpoint.  
  - Form handling: React Hook Form + Zod for validation.  
- **Error and notification framework**: Centralized error boundary, toast controller, and i18n message catalog.  
- **Access control**: Route guards read decoded JWT claims; component-level guard HOCs restrict UI access.  
- **Testing**:  
  - Unit tests with Vitest.  
  - Integration tests using React Testing Library + MSW.  
  - E2E flows in Cypress (login, admin user management, attendance check-in/out, report export).  
- **Build artifacts**:  
  - `pnpm build` generates production bundle.  
  - Upload static assets to CDN or S3 + CloudFront.  
  - Use environment-specific `.env.production` with versioned API URLs.

Application Tier Blueprint
--------------------------
- **Project structure**: Multi-module Gradle project. `application-service` depends on `domain` and `shared-kernel`. `presentation-api` depends on `application-service`. `infrastructure` provides adapters injected via Spring configuration classes.  
- **Configuration**:  
  - `application.yml` with profiles: `local`, `test`, `staging`, `production`.  
  - Include `application-test.yml` for integration testing defaults.  
  - Use Spring Config Server or AWS Parameter Store for centralized management in higher environments.
- **Security**:  
  - Resource server configuration with JWT validation (JWK Set URI).  
  - Method-level authorization via `@PreAuthorize`.  
  - Data scoping using `TenantContextHolder` populated by a servlet filter reading `X-Tenant-Id`.  
  - Audit logging via Envers plus custom `AuditTrail` domain service for critical actions.
- **API practices**:  
  - Controllers output `ResponseEntity` with DTOs.  
  - Global exception handling using `@ControllerAdvice` returning RFC 7807 problem responses.  
  - Versioned endpoints (`/api/v1/...`); plan for `/api/v2` using content negotiation or header-based versioning.  
  - OpenAPI generated via springdoc. Publish spec artifacts to `docs/` and CI pipeline.  
  - HTTP caching (ETag/Last-Modified) for read-heavy endpoints where safe.
- **Workload orchestration**:  
  - Scheduled jobs (Spring Scheduler) for nightly attendance reconciliations, report generation, and cleanup.  
  - Async execution using `CompletableFuture` + `@Async` or message queues (RabbitMQ/Kafka).  
  - Transactional boundaries defined with `@Transactional` on application services; keep transactions short.
- **Integrations**:  
  - Notifications: interface `NotificationGateway`, initial adapter for SES/SNS or Twilio.  
  - File storage: `DocumentStorage` port; adapter for AWS S3 or MinIO with signed URL generation.  
  - Analytics: asynchronous event publisher to data warehouse (e.g., Snowflake) via Kafka.  
  - Payment provider integration (optional) via dedicated adapter module following PCI compliance guidelines.

Data Tier Blueprint
-------------------
- **Schema design**:  
  - Tables: `tenants`, `users`, `roles`, `user_roles`, `children`, `guardians`, `child_guardians`, `classrooms`, `enrollments`, `attendance_records`, `notifications`, `documents`, `reports`, `audit_events`.  
  - Keys: UUID PKs, composite unique constraints for tenant scoping.  
  - Soft deletes using `deleted_at` where regulatory retention requires archival.  
  - Use check constraints for enumerations (attendance status, notification channel).
- **Migrations**:  
  - Flyway SQL scripts stored under `application-service/src/main/resources/db/migration`.  
  - Naming: `V001_0__create_base_tables.sql`, `V001_1__seed_roles.sql`, etc.  
  - Repeatable migrations (`R__`) for reference data.  
  - Execute via `./gradlew :application-service:flywayMigrate` or automatically on boot in non-production.  
- **Persistence**:  
  - Spring Data JPA repositories with projections for read-heavy endpoints.  
  - Leverage QueryDSL or Spring Data Specifications for dynamic filters (date range, classroom).  
  - Read-only transactions flagged with `@Transactional(readOnly = true)` for performance.  
  - Redis caching for attendance summaries, report metadata, JWT blacklist.  
- **Backups and DR**:  
  - Automated daily snapshots (cloud provider).  
  - PITR configured via WAL archiving.  
  - Quarterly restore drills documented in runbooks.  
  - Object storage lifecycle rules to transition archives to Glacier/Deep Archive after retention period.

Cross-Cutting Capabilities
--------------------------
- **Configuration management**: `.env` for local, Vault or Parameter Store for cloud. Integrate with Spring Cloud Config when centralization needed.  
- **Observability**:  
  - Logging: JSON format via Logback + Logstash encoder.  
  - Metrics: Micrometer to Prometheus, dashboards in Grafana covering request latency, error rates, cache hits, queue depths.  
  - Tracing: OpenTelemetry instrumentation exporting to Jaeger, AWS X-Ray, or Tempo.  
  - Alerting: SLO-based alerts (availability, latency) plus error-rate anomalies, queue congestion, backup failures.  
- **Feature flags**: Integrate LaunchDarkly or Unleash. Ensure default-safe behaviour when flag service unavailable.  
- **Internationalization**: Locale stored per tenant and per user. Resource bundles for server-generated content, `react-i18next` for clients. Support right-to-left languages if required.

Core Workflow Blueprints
------------------------
1. **Authentication and authorization**  
   - Presentation: Initiate OAuth login, handle redirect, store tokens, hydrate user context.  
   - Application: Validate JWT, load user roles and tenant context, enforce RBAC with `@PreAuthorize`.  
   - Data: Query read-model `user_roles` view, cache permissions in Redis with TTL.
2. **Admin user management**  
   - Presentation: Admin dashboard lists users, invites, role assignments via React Query.  
   - Application: `AdminService` orchestrates user creation, role assignment, and invitation emails.  
   - Data: Persist to `users`, `user_roles`, write audit event, enqueue notification.  
   - Integration: SES sends invitation email with activation link.
3. **Child enrollment**  
   - Presentation: Multi-step wizard collects child data, guardians, documents.  
   - Application: Use case validates nursery capacity, associates guardians, uploads documents, notifies staff.  
   - Data: Save to `children`, `enrollments`, `child_guardians`, store documents in S3, metadata in `documents`.  
   - Post-processing: Trigger asynchronous welcome notification to guardians.
4. **Attendance tracking**  
   - Presentation: Teacher dashboard with real-time roster, offline buffering for mobile devices.  
   - Application: `AttendanceService` records check-in/out, calculates metrics, publishes attendance events.  
   - Data: Insert into `attendance_records`, update aggregates, cache summaries.  
   - Reporting: Nightly job reconciles anomalies, sends digest to admin.
5. **Document management**  
   - Presentation: File upload components with drag-and-drop and progress indicators.  
   - Application: Generate pre-signed URLs, scan for malware (via lambda or ClamAV), limit file types, update metadata.  
   - Data: Store metadata, version documents if re-uploaded, enforce retention policies.  
   - Security: Signed URLs expire quickly; server validates download authorization.
6. **Reporting**  
   - Presentation: Report builder selects filters, requests generation, polls status.  
   - Application: Use case enqueues report job, generates PDF or CSV via JasperReports, stores result, notifies user.  
   - Data: Store report definitions, job status, output location.  
   - Integration: Optionally export to BI tools or S3 for analytics.
7. **Notifications**  
   - Presentation: Notification center shows delivery status and audit trail.  
   - Application: `NotificationService` abstracts channels (email, SMS, push). Implements retry with exponential backoff.  
   - Data: Persist to `notifications` with status, error details, tenant scope.  
   - Observability: Emit metrics per channel, integrate with PagerDuty for failure spikes.

Testing and Quality Gates
-------------------------
- **Unit**:  
  - Domain layer: Validate invariants, factories, value objects.  
  - Application layer: Use Mockito/AssertJ to verify orchestration logic.  
  - Minimum coverage target 80 percent on critical packages (`domain`, `application-service`).
- **Integration**:  
  - Spring Boot tests with Testcontainers for PostgreSQL, Redis, MinIO, Mailhog.  
  - REST layer tests using WebTestClient or RestAssured.  
  - Database migration tests verifying Flyway scripts idempotency.  
- **Contract testing**:  
  - Publish OpenAPI spec in CI.  
  - Use Pact to validate front-end expectations vs application tier responses.  
  - Enforce backwards compatibility gates pre-deployment.
- **End-to-end**:  
  - Cypress or Playwright suites covering mission-critical paths.  
  - Optionally run against disposable review environments created via Terraform + Helm.  
- **Performance**:  
  - Gatling scenarios targeting attendance spikes, reporting batch, mass notifications.  
  - Define SLA (P95 < 200 ms for standard endpoints, < 2 s for report generation API acknowledging async job).  
- **Security scanning**:  
  - Static: SpotBugs/FindSecBugs, Dependency-Check, Trivy.  
  - Dynamic: OWASP ZAP baseline scan in CI, penetration testing quarterly.  
  - Secrets: gitleaks or detect-secrets pre-commit hooks.

Security and Compliance
-----------------------
- Enforce TLS 1.2+ for all external connections, HSTS headers, CSP, X-Frame-Options.  
- Rate-limit sensitive endpoints (`/auth`, `/files`, `/admin`).  
- Enable JWT revocation via Redis blacklist on logout or compromise.  
- Encrypt sensitive columns (PII) using JPA converters with cloud KMS keys.  
- Maintain audit trails for user and child data changes; export to SIEM.  
- Align with GDPR/CCPA: data subject access requests, right to be forgotten (soft delete + anonymization).  
- Conduct third-party risk assessments for integrations (SMS, email).  
- Periodic security reviews and tabletop exercises for incident response.

Observability and Operations
----------------------------
- **Dashboards**: Health (API latency, error rates), Business (daily attendance, active users), Infrastructure (DB connections, JVM metrics).  
- **Logging strategy**: Correlate requests with `X-Request-Id` header propagated through tiers.  
- **Tracing**: Instrument key workflows (login, attendance record creation, report generation) to visualize latency contributions.  
- **Incident response**:  
  - Define severity matrix and escalation policy.  
  - Run incident retros within 48 hours; track actions in Jira.  
  - Maintain runbooks for common issues (DB failover, redis eviction, message backlog).  
- **Disaster recovery**: Document RPO/RTO targets (e.g., RPO 15 minutes, RTO 1 hour). Test failover procedures twice yearly.

Scalability and Performance
---------------------------
- Keep application tier stateless; leverage Redis for session data and distributed locks when needed.  
- Implement connection pooling via HikariCP with tuned max pool size per instance.  
- Employ asynchronous processing for long-running tasks (reports, notifications).  
- Partition large tables (attendance records) by tenant and by month/year when volume dictates.  
- Introduce read replicas and database load balancer for scale-out reads.  
- Enable HTTP/2, gzip or brotli compression for API responses, and CDN caching for static assets.

Delivery Pipeline
-----------------
1. **Branching**: Trunk-based development with short-lived feature branches. Require PR approvals and status checks.  
2. **CI steps**:  
   - Lint (`pnpm lint`, `./gradlew spotlessCheck`).  
   - Unit tests (`./gradlew test`, `pnpm test -- --runInBand`).  
   - Integration tests with Testcontainers (`./gradlew integrationTest`).  
   - Contract tests (`./gradlew pactVerify`).  
   - Build artifacts (`./gradlew bootJar`, `pnpm build`).  
   - Security scans (Dependency-Check, Trivy).  
   - Publish Docker images via `bootBuildImage` to container registry.  
3. **CD**:  
   - Staging deployments auto-triggered after successful CI.  
   - Production deployments via GitOps (Argo CD) with manual approval gate.  
   - Use progressive delivery (blue/green or canary) with traffic shaping through ingress controller or service mesh.  
   - Rollback strategy: Use Helm release history, keep last stable image.  
4. **IaC**:  
   - Terraform modules provision VPC, RDS, ElastiCache, S3, EKS or ECS, secrets manager.  
   - Separate state per environment; enforce review for infrastructure changes.

Operational Runbook
-------------------
- **Startup**:  
  - `docker compose -f infra/local/docker-compose.yml up -d`  
  - `./gradlew :application:bootRun --args='--spring.profiles.active=local'`  
  - `pnpm dev`
- **Database migration**: `./gradlew :application-service:flywayMigrate --stacktrace`  
- **Generate API client**: `pnpm generate:api` (OpenAPI generator configured under `frontend/`).  
- **Run full test suite**: `./gradlew clean check integrationTest pactVerify && pnpm test && pnpm lint`  
- **Build Docker images**: `./gradlew :presentation-api:bootBuildImage :application-service:bootBuildImage`  
- **Smoke tests**:  
  - API: `curl -H "Authorization: Bearer <token>" https://staging.nursery.example/api/v1/health`  
  - UI: Playwright smoke suite `pnpm test:e2e --project=smoke`.  
- **Rollback**: Redeploy previous Helm release `helm rollback nursery-api <revision>`.

Appendix
--------
- **Critical environment variables**:  
  - `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD`  
  - `SPRING_FLYWAY_LOCATIONS`  
  - `JWT_ISSUER_URI`, `JWT_AUDIENCE`  
  - `TENANT_HEADER_NAME` (default `X-Tenant-Id`)  
  - `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`  
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`  
  - `NOTIFICATIONS_EMAIL_FROM`, `NOTIFICATIONS_SMS_SENDER`  
  - `FEATURE_FLAGS_ENDPOINT`, `TELEMETRY_ENDPOINT`
- **Reference documentation**:  
  - Spring Boot: https://docs.spring.io/spring-boot/docs/current/reference/html/  
  - Spring Security: https://docs.spring.io/spring-security/reference/  
  - React: https://react.dev/  
  - Flyway: https://documentation.red-gate.com/fd  
  - Testcontainers: https://www.testcontainers.org/  
  - OpenTelemetry: https://opentelemetry.io/docs/  
  - Terraform: https://developer.hashicorp.com/terraform/docs

Glossary
--------
- **Hexagonal Architecture**: Ports and adapters approach enabling interchangeability of infrastructure.  
- **Tenant**: A nursery or childcare organization using the system; all tenant-scoped data must remain isolated.  
- **SLO**: Service Level Objective quantifying expectations (availability, latency).  
- **RPO / RTO**: Recovery Point Objective and Recovery Time Objective for disaster recovery planning.

By applying this playbook, Java teams can implement a fully featured, resilient, and scalable Nursery System, aligning closely with existing business workflows while adopting modern engineering best practices.

Next Actions
------------
- Circulate the document with the Java team for validation against organizational standards.
  1. Export the playbook to the shared documentation hub (Confluence, Notion, or internal wiki) using the agreed template.
  2. Post a summary and link in the `#platform-java` Slack channel tagging technical leads and architecture reviewers, asking for feedback by a defined date.
  3. Host a 30-minute walkthrough to capture questions, clarify decisions, and record action items in Jira.
  4. Apply feedback, update the version history, and mark the document as “Reviewed” once all stakeholders sign off.
- Align upcoming sprint tasks with the outlined modules (presentation, application, data) to phase the migration incrementally.
  1. Break the guidance into three epics (one per tier) with stories for setup, feature parity, and cross-cutting concerns.
  2. Prioritize stories with product and delivery managers, scheduling quick wins first (e.g., presentation layer integration) before deeper migrations.
  3. Add acceptance criteria that reference relevant playbook sections and include Definition of Done checks (tests, docs, telemetry).
  4. During sprint planning, assign owners, estimate effort, and surface dependencies such as infrastructure readiness or data migration prerequisites.
  5. Review tier progress during sprint reviews, demonstrate completed capabilities, and adjust backlog items based on stakeholder feedback.
