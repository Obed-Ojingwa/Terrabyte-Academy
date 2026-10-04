# Terrabyte Academy Production-Readiness Audit

**Audit date:** 2026-10-03  
**Verdict:** **Not production-ready. Do not launch with real user data or payments until all P0 and P1 items below are closed and re-tested.**

## Executive Summary

The repository contains a broad LMS feature set and the existing backend suite passes, but several launch-blocking security and deployment risks remain. Most urgent: the tracked backend environment example contains credential-shaped database connection data and hard-coded signing keys; the seed routine provisions a fixed-password super-admin; refresh tokens are not excluded from normal API authentication; payment verification does not bind a verified transaction to the requesting account or validate the expected amount; and the documented Compose production path is configured like development.

Frontend compilation succeeds, but the lint gate is broken and the dependency audit reports **14 vulnerabilities: 1 critical, 12 high, 1 moderate**. The current frontend container expects a standalone Next.js artifact that the Next config does not enable. Several visible account/support workflows also have no backend implementation.

This is a source/configuration audit, not a penetration test or a validation of a live deployment. Findings are based on the checked-in code and commands listed below.

## Launch Blockers

### P0: Revoke exposed credentials and remove secrets from tracked examples

[`backend/.env.example`](backend/.env.example#L2) contains a database URL with a credential-shaped password, fixed signing key values, and `DEBUG=True`. Docker Compose loads this file directly into the backend and worker containers ([`docker-compose.yml`](docker-compose.yml#L36)). Treat the database credential as exposed: rotate/revoke it immediately, invalidate any potentially exposed signing keys, and review repository history/access. Replace all example values with inert placeholders; production secrets must come from a secret manager or deployment secret store. Do not copy the values from the example into production.

### P0: Remove fixed super-admin bootstrap credentials

[`backend/app/seed.py`](backend/app/seed.py) creates a privileged super-admin using a hard-coded password when that account is missing. Anyone who knows or discovers this credential can gain root access on a newly initialized deployment. Replace this with a one-time, operator-controlled bootstrap that requires a unique secret, forces password rotation, and is disabled after setup. Add a regression test proving fresh production startup cannot create a known-password admin.

### P0: Correct payment verification ownership and amount checks

[`backend/app/services/payment_service.py`](backend/app/services/payment_service.py#L71) verifies a gateway reference but does not establish that an existing payment belongs to the authenticated user, does not validate the verified Paystack metadata's student against that user, and does not compare the verified amount/currency with the expected payment. It then activates enrollment for the current caller. A valid reference must not let another account claim an enrollment or settle an underpaid transaction. Bind reference, user, course, amount, and currency; verify the gateway response against the original pending record; make settlement/enrollment atomic and idempotent; and cover cross-account, amount mismatch, duplicate webhook, and replay cases with integration tests. The webhook currently updates payment status without performing the same enrollment reconciliation, so webhook and return verification also need one consistent settlement path.

### P1: Enforce access-token type and make revocation durable

Access and refresh tokens have separate `type` claims in [`backend/app/core/security.py`](backend/app/core/security.py#L28), but [`backend/app/api/deps.py`](backend/app/api/deps.py#L21) accepts any successfully decoded token for normal API authentication. Require `type == "access"` there. Revocations are held in process-local sets ([`backend/app/core/security.py`](backend/app/core/security.py#L7)); revocation therefore does not reliably survive restarts or synchronize across workers. Use shared durable token/session state or short-lived access tokens with a deliberate refresh-token family/reuse strategy, and test across multiple workers/restarts. Require stable production JWT secrets at startup rather than silently generating new defaults.

### P1: Fix production container configuration before publishing images

[`frontend/Dockerfile`](frontend/Dockerfile#L13) copies `.next/standalone`, but [`frontend/next.config.mjs`](frontend/next.config.mjs) does not set `output: "standalone"`. The expected artifact is therefore not configured. Enable standalone output or change the container to a verified supported deployment mode, then build the actual image in CI. Docker image build could not be exercised here because the Docker daemon was unavailable.

The Compose frontend sets `NEXT_PUBLIC_API_URL` to `http://backend:8000/api/v1` ([`docker-compose.yml`](docker-compose.yml#L74)); that hostname is internal to the Compose network and is not a browser-reachable API origin. Route browser API calls through a public same-origin proxy or configure a browser-reachable HTTPS API URL at build/deployment time. Verify the built client bundle and a browser smoke test, not just server-side container networking.

The documented production path is not production-shaped: backend starts with `--reload`, bind-mounts source, consumes `.env.example`, and database/Redis/backend ports are published to the host ([`docker-compose.yml`](docker-compose.yml)). Remove development mounts/reload and public internal-service ports; use production secrets, resource limits, restart policies, private networks, persistent storage policy, and managed TLS. Nginx references certificate files that are not present in this workspace and hard-codes hostnames ([`nginx/nginx.conf`](nginx/nginx.conf)); define and validate the real certificate/renewal and domain deployment process.

### P1: Patch vulnerable frontend dependencies and restore a working lint gate

`npm audit` reported **14 vulnerabilities (1 critical, 12 high, 1 moderate)**, including advisories affecting the installed Next.js and Axios versions and vulnerable transitive packages. Resolve the advisories using versions compatible with the chosen Next/React major versions; do not apply `npm audit fix --force` blindly because npm indicates that can move the app to breaking Next.js/Tailwind majors. Commit a clean audit result and add dependency scanning to CI. A backend dependency vulnerability scan was not available/run in this audit.

`npm run lint` fails with ESLint invalid-option errors. The package uses Next 14 with ESLint 10 and `next lint`; the setup prompt installed `eslint-config-next` 16.3.8, which is also out of step with the app's Next 14 major. Align the Next ESLint config and ESLint versions with the framework, replace the deprecated runner if appropriate, and make lint a required passing CI check. The audit setup prompt generated `frontend/.eslintrc.json` and changed `frontend/package.json` plus `frontend/package-lock.json`; review those audit-time changes before merging.

## High-Priority Readiness Work

### Authentication, account safety, and session handling

- Access and refresh tokens are stored in JavaScript-readable cookies and auth state is persisted client-side ([`frontend/src/store/authStore.ts`](frontend/src/store/authStore.ts), [`frontend/src/lib/api.ts`](frontend/src/lib/api.ts)). Move credentials to Secure, HttpOnly cookies managed server-side (or a well-reviewed BFF/session design), assess CSRF protections, and avoid persisting access tokens in browser storage.
- The forgot-password page calls `/auth/forgot-password`, but no matching backend route was found; the flow cannot complete ([`frontend/src/app/auth/forgot-password/page.tsx`](frontend/src/app/auth/forgot-password/page.tsx)). Implement expiring, single-use reset tokens, non-enumerating responses, rate limits, delivery, and tests, or remove/disable the advertised route until ready.
- Email tasks are stubs with `pass` bodies ([`backend/app/tasks/email_tasks.py`](backend/app/tasks/email_tasks.py)); there is no working registration/payment/certificate email delivery path. Configure a provider, retry/dead-letter behavior, delivery observability, and failure handling.
- Registration does not appear to require email verification before normal account use. Decide and enforce the verification policy, including abuse/rate limiting and account recovery controls.

### Runtime, database, and deployment reliability

- `app.main` invokes database seeding at import time and suppresses all exceptions ([`backend/app/main.py`](backend/app/main.py#L17)). Seeding calls `Base.metadata.create_all()` ([`backend/app/seed.py`](backend/app/seed.py)), while deployment start commands do not run Alembic migrations ([`render.yaml`](render.yaml), [`backend/render.yaml`](backend/render.yaml)). Move initialization to an explicit, observable deployment step; run versioned migrations before serving traffic; fail deployment on migration/seed errors; test upgrades from a production-like prior schema.
- Render config points Redis at `localhost` and does not declare a managed Redis service ([`render.yaml`](render.yaml)). Celery requires a reachable broker; configure managed Redis and worker/beat services with health checks, persistence/availability decisions, and alerts.
- The `/health` handler always returns `ok` without checking critical dependencies ([`backend/app/main.py`](backend/app/main.py#L42)). Add separate liveness and readiness checks for database and required dependencies; wire platform health checks to readiness.
- The in-process rate limiter is not shared between workers/instances and retains per-IP state in memory ([`backend/app/core/middleware.py`](backend/app/core/middleware.py)). Use a shared store/proxy limit with explicit trusted-proxy handling, and test limits across replicas. Ensure API docs are disabled or access-controlled in production: `/api/docs` is currently configured unconditionally despite the README describing it as development-only ([`backend/app/main.py`](backend/app/main.py#L17)).
- Validate production settings on startup: database URL, Redis, signing keys, allowed origins/hosts, storage, payment, mail, and public URLs. Fail closed instead of silently creating local storage or returning HTTP-200 pending-reference responses when payment credentials are missing.
- Define database backup/restore, retention, disaster-recovery objectives, migration rollback strategy, monitoring/error tracking, structured security/audit logs, alerting, incident response, and secret rotation procedures. None can be certified from this repository alone.

### Uploads, payments, and authorization hardening

- Uploads are read fully into memory and use the client-provided filename without size/type validation ([`backend/app/api/v1/storage.py`](backend/app/api/v1/storage.py#L18)). Enforce request and file size limits, content inspection/allowlists, generated storage keys, safe path handling, malware scanning where appropriate, and private-by-default object permissions. Test malicious filenames and oversized files.
- Review every object-level authorization path for cross-student/course access (assignments, exams, materials, certificates, forums, analytics, and admin APIs). Existing tests cover some roles/schemas but do not provide systematic API-level IDOR coverage.
- Verify Paystack webhook signature against raw bytes and add tests for malformed/duplicate events, unknown references, event ordering, and payment/enrollment reconciliation. Ensure payment initialization rejects unpublished/free/invalid course/mode cases according to business rules.

### Examination workflow: implemented, production validation remains

The exam workflow now has tutor authoring, student attempt-taking, server-enforced windows/deadlines, retakes, and manual essay review. Phase 1–5 implementation is complete, including a versioned database migration and Supabase SQL. Browser E2E against a live Supabase environment remains unverified.

Verified gaps and risks:

- **Phase 1 complete:** `GET /exams` and `GET /exams/{id}` now unique joined collection results; authenticated HTTP tests cover both reads and serialization.
- **Phase 1 complete:** Student exam responses omit answer keys and results. Staff access to answer keys and course-wide results uses `GET /exams/{id}/management`, restricted to admins or the owning tutor. `GET /exams/{id}/results` filters students to their own results; tests cover owner authorization and student result filtering.
- **Phase 2/3 complete:** Tutors/admins can create, update, delete, and reorder questions through `POST /exams/{id}/questions`, `PUT /exams/{id}/questions/{question_id}`, `DELETE /exams/{id}/questions/{question_id}`, and `PUT /exams/{id}/questions/reorder`. Every mutation verifies course ownership. The reorder request must include each question exactly once; insert, delete, and reorder lock the parent exam and update positions in one transaction.
- Supported question types are `single_choice`, `multiple_choice`, `true_false`, `short_answer`, and `essay`. Choice questions require unique option IDs and valid correct IDs; multiple-choice correct IDs are stored as a sorted compact JSON array in the existing `correct` text column. Points must be 1–1000; pass score must be 0–100; duration must be 1–1440 minutes. Student eligibility consistently requires an active or completed enrollment; pending enrollment is rejected.
- **Phase 4/5 complete:** The tutor Exam Studio creates and edits exams/questions, supports schedule and attempt settings, choice/true-false/short-answer/essay question authoring, and reordering. Question/scoring edits lock after the first attempt so historic results remain reproducible. Students now start/resume attempts in one shared Exams page with controls for each question type; Learning Dashboard links to that workflow instead of submitting an incompatible answer object.
- Attempts default to one, with a tutor-configured maximum of ten. Availability is open-ended when dates are omitted; timestamps must include a timezone. Server-recorded `started_at` and `expires_at` control deadlines, and the deadline is clamped to the exam closing time. Repeated starts resume the current attempt; each new attempt is a separate result row protected by a unique `(exam_id, student_id, attempt_number)` constraint. Expired attempts consume an attempt. Late submissions are rejected and persisted as expired.
- Objective questions use all-or-nothing scoring; there is no partial credit. Essays enter `pending_review`; their automatic score remains private, and a tutor must grade every essay question within its points range before a final score/pass state is released. Student result reads exclude grading internals; staff review remains owner-restricted.
- The schema migration backfills existing results as graded attempt records and is available as [`backend/alembic/versions/b7f4c2d91a60_add_exam_attempt_policy.py`](backend/alembic/versions/b7f4c2d91a60_add_exam_attempt_policy.py). The equivalent one-time Supabase SQL is [`supabase_migration_sql/20261004_exam_attempt_policy.sql`](supabase_migration_sql/20261004_exam_attempt_policy.sql). Back up the database and apply exactly one path (Alembic or the SQL script), not both, before deploying the new backend code.
- Remaining verification: no browser E2E or live Supabase migration/transaction test was run in this environment. The current frontend lint command still emits the repository's known ESLint invalid-option warning during a successful build.

Implementation steps to make the workflow usable and safe:

1. **Complete:** Fix list/detail query consumption for joined collection loads and add authenticated API tests covering both routes, safe response fields, and serialization.
2. **Complete:** Split student exam delivery from staff management/result views. Student reads omit answer keys/results; students can read only their own results; answer keys and course-wide results are restricted to the owning tutor/admin.
3. **Complete:** Define and validate question types, options, correct-answer representation, positive points, ordering, pass-score bounds, and enrollment eligibility. Add owner-checked tutor/admin question CRUD endpoints and transactional position maintenance/reordering.
4. **Complete:** Build tutor exam authoring/editing and replace the Learning Dashboard free-form submission with the shared student attempt workflow.
5. **Complete:** Define scheduling, attempts, retakes, and manual grading; enforce these on the server with transactional attempt records and a unique attempt constraint.
6. **Complete:** Implement type-aware objective grading, essay review, and protected student result/review fields.
7. **Partial:** Backend/API tests cover authoring, enrollment, answer validation, grading, deadlines, retakes, and result privacy. Add browser E2E coverage against staging and exercise a real Supabase migration before production.

Until these steps are complete, treat examinations as an incomplete prototype; do not rely on them for assessed or timed exams.

### Frontend product and quality gates

- Contact submission currently waits and displays success without sending data ([`frontend/src/app/contact/page.tsx`](frontend/src/app/contact/page.tsx)); implement and test a real backend/provider workflow or remove the success claim.
- Privacy, terms, and cookie-policy links are placeholders (`href="#"`) in the public site and registration UI ([`frontend/src/app/page.tsx`](frontend/src/app/page.tsx), [`frontend/src/app/auth/register/page.tsx`](frontend/src/app/auth/register/page.tsx)). Publish reviewed policies and make consent/cookie behavior match them before collecting personal data.
- There is no frontend unit, component, or end-to-end test script in [`frontend/package.json`](frontend/package.json). Add tests for login/register/reset, role routing, session expiry/refresh, payments, core student learning flows, and accessibility-critical controls. Use browser tests against a staging-like API.
- Add accessibility checks (keyboard flow, labels, contrast, errors), responsive browser coverage, and performance budgets. A production build alone does not prove these user-facing requirements.

## Verification Results

| Check | Result |
|---|---|
| `python -m pytest -q` from `backend/` | **Pass:** 51 passed, including 31 exam-specific tests; 2 Pydantic deprecation warnings. Coverage includes attempt lifecycle, deadlines, retakes, grading, privacy, and authoring. |
| `npm run lint` from `frontend/` | **Fail:** ESLint reports unsupported/removed options (`useEslintrc`, `extensions`, and others). |
| `npm run build` from `frontend/` | **Build completes:** Next.js compiles, type-checks, and generates 38 pages, but reports the known ESLint invalid-options warning during its lint stage. |
| `python -m alembic upgrade head --sql` from `backend/` | **Pass:** complete revision chain generates offline SQL with a PostgreSQL dialect URL; live Supabase execution was not run. |
| `npm audit` from `frontend/` | **Fail:** 14 vulnerabilities: 1 critical, 12 high, 1 moderate. |
| `docker compose config --quiet` | **Pass with warning:** config parses; Compose warns the `version` attribute is obsolete. This does not validate production runtime behavior. |
| Frontend Docker image build | **Not verified:** Docker daemon unavailable in this environment. |
| Backend dependency audit, live integrations, browser E2E, production DB migration/restore, load/security testing | **Not run:** requires additional tooling or deployment credentials/environment. |

## Recommended Release Gate

1. Rotate the exposed database credential and signing keys; remove credential-shaped values from tracked files and review repository history.
2. Remove fixed admin bootstrap; correct JWT type/revocation handling; fix and test payment ownership/amount settlement.
3. Align and patch frontend dependencies; make lint and `npm audit` required gates; complete backend dependency scanning.
4. Replace development Compose/Render settings, implement migrations and dependency-backed readiness, and prove the real frontend/backend containers build and start with secrets supplied externally.
5. Complete password reset/email/contact, upload controls, and policy links; add auth/payment/authorization API tests and browser E2E coverage.
6. Run staging tests with real provider sandbox integrations, backup restore rehearsal, monitoring/alert checks, and a security review before production traffic.
