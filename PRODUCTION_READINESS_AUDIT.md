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

### Examination workflow: not functional end to end

The database tables and basic exam/result routes exist, and the student Exams page can submit answers if an exam already has questions. However, the repository has no exam-question create/update/delete API or tutor authoring UI, so a tutor cannot build an exam through the product. There are no exam-specific backend tests. The backend suite passed 20 tests on 2026-10-03, but does not establish that this workflow works.

Verified gaps and risks:

- `GET /exams` eager-loads the `questions` collection but consumes the SQLAlchemy result without `.unique()`. `GET /exams/{id}` does the same for both `questions` and `results`. SQLAlchemy requires result uniquing for joined eager-loaded collections; add route-level tests and fix these result consumers before relying on either read route.
- Student responses use `ExamQuestionResponse`, which includes `correct`, and `ExamResponse` includes `results` (including students' IDs and submitted answers). Do not return answer keys or other students' results from student-facing endpoints. Use role-appropriate response schemas and explicit eager loading of only the fields each endpoint needs.
- The Learning Dashboard submits `{ answers: { answer: ... } }`, but grading looks up answers by question UUID. That page's submitted value can never match a question. The dedicated Exams page uses question IDs, but renders every question as free text even though question `type` and `options` are stored.
- `duration_min` and the Exams page's “upcoming” label are display-only: there is no start/end schedule, attempt start record, server-enforced timer, or deadline. Submitting again overwrites the student's previous result without an attempt policy.
- Grading compares strings case-insensitively for every question type. It does not grade option values by type, support manual grading for open responses, validate submitted question IDs, or apply a partial-credit policy. `pass_score` is applied against total question points.
- Submission authorization also admits pending enrollments. Decide the intended eligibility policy and enforce it consistently for listing, viewing, starting, and submitting an exam.

Implementation steps to make the workflow usable and safe:

1. Fix list/detail query consumption for joined collection loads and add authenticated API tests that exercise both routes with exams containing multiple questions and results. Confirm response serialization works with the async ORM.
2. Split student exam delivery from staff management/result views. Redact correct answers and results from student exam responses; provide students access only to their own results, and restrict answer keys and course-wide results to the owning tutor/admin.
3. Define and validate question types, options, correct-answer representation, positive points, ordering, pass-score bounds, and enrollment eligibility. Add tutor/admin question CRUD endpoints with course ownership checks and a transaction-safe way to save/reorder exam questions.
4. Build tutor exam authoring and editing UI, including question management. Replace the Learning Dashboard's free-form exam submission with a link or shared component that uses the question-ID answer contract and supports each declared question type.
5. Decide scheduling, duration, attempts, retakes, and manual-grading rules. Persist attempt start/submission state and enforce availability and time limits on the server; do not rely on a browser timer for enforcement. Make result/attempt persistence atomic and add a uniqueness constraint or explicit attempt records matching the chosen policy.
6. Implement grading per question type, including manual-review state for non-automatic questions, and expose a clear student result/review flow that never reveals protected answer keys prematurely.
7. Add API integration tests for authoring permissions, enrollment access, malformed/unknown answers, each grading type, no answer-key/result leakage, timing and attempt limits, resubmissions/concurrent submissions, and student result isolation. Add a browser E2E test for tutor authoring through student submission and result review.

Until these steps are complete, treat examinations as an incomplete prototype; do not rely on them for assessed or timed exams.

### Frontend product and quality gates

- Contact submission currently waits and displays success without sending data ([`frontend/src/app/contact/page.tsx`](frontend/src/app/contact/page.tsx)); implement and test a real backend/provider workflow or remove the success claim.
- Privacy, terms, and cookie-policy links are placeholders (`href="#"`) in the public site and registration UI ([`frontend/src/app/page.tsx`](frontend/src/app/page.tsx), [`frontend/src/app/auth/register/page.tsx`](frontend/src/app/auth/register/page.tsx)). Publish reviewed policies and make consent/cookie behavior match them before collecting personal data.
- There is no frontend unit, component, or end-to-end test script in [`frontend/package.json`](frontend/package.json). Add tests for login/register/reset, role routing, session expiry/refresh, payments, core student learning flows, and accessibility-critical controls. Use browser tests against a staging-like API.
- Add accessibility checks (keyboard flow, labels, contrast, errors), responsive browser coverage, and performance budgets. A production build alone does not prove these user-facing requirements.

## Verification Results

| Check | Result |
|---|---|
| `python -m pytest -q` from `backend/` | **Pass:** 20 passed; 2 Pydantic deprecation warnings. Tests are mostly schema/unit checks and do not validate the critical auth/payment paths above. |
| `npm run lint` from `frontend/` | **Fail:** ESLint reports unsupported/removed options (`useEslintrc`, `extensions`, and others). |
| `npm run build` from `frontend/` | **Build completes:** Next.js compiles, type-checks, and generates 37 pages, but reports the ESLint options error during its lint stage. |
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
