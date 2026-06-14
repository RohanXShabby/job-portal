# Job Portal SaaS Architecture

## 1. Overview
This repository is a Bun + Turborepo monorepo for a Job Portal SaaS platform with separate frontend, backend, shared packages, and a roadmap for admin and enterprise capabilities.

### Existing applications
- `apps/web` - candidate / recruiter public UI implemented with Next.js 16 App Router, React 19, TypeScript, Tailwind, Zustand, and Better Auth.
- `apps/server` - backend API using Bun runtime, Hono architecture, Mongoose/MongoDB, Better Auth, Redis caching, BullMQ queues, Elasticsearch/Meilisearch search.

### Planned applications
- `apps/admin` - separate admin panel for user, company, job, application, subscription, coupon, audit, and support management.

### Shared packages
- `packages/auth` - auth orchestration and Stripe helpers.
- `packages/db` - MongoDB models and connection logic.
- `packages/redis` - Redis cache helpers, rate limiting, distributed locking.
- `packages/env` - shared environment validation.
- `packages/config` - shared TypeScript configuration.

## 2. Backend architecture

### Framework & runtime
- **Hono** as the main backend web framework for API routing, middleware, and modular application mounting.
- **Bun** runtime for fast cold starts and efficient server execution.
- **Better Auth** for authentication, session handling, refresh token rotation, and OAuth/provider support.
- **Mongoose** as ODM for MongoDB.

### Clean architecture
The backend is organized by feature modules in `apps/server/src/modules`.
Each feature contains:
- `routes.ts`
- `controllers`
- `services`
- `repositories`
- `dto`
- `types`

This preserves separation of concerns and enables future extraction into microservices as usage grows.

### Current server behavior
- `apps/server/src/index.ts` starts the HTTP server.
- `apps/server/src/app.ts` will expose the Hono application and API routes.
- `apps/server/src/lib` contains shared helpers for response envelopes, search, queueing, emails, and metrics.

## 3. Database design

### Collections
- `users` - Better Auth main user document with candidate/recruiter/admin/super_admin roles.
- `companies` - employer profiles, verification status, recruiters, and company metadata.
- `jobs` - job postings with denormalized company metadata and search-ready fields.
- `applications` - candidate applications with workflow statuses and timeline events.
- `resumes` - resume metadata, S3 key, parsed text, and candidate association.
- `subscriptions` - Stripe subscriptions and billing state.
- `payments` - payment history and auditability.
- `notifications` - in-app notifications and delivery metadata.
- `blogs`, `coupons`, `auditlogs`, `supporttickets` - CMS, discount, audit, and support ticket tracking.

### Indexing strategy
- Job collection indexes on `companyId`, `status`, `createdAt`, `skillsRequired`, and `slug`.
- Company indexes on `slug`, `recruiters`, and `isVerified`.
- Application indexes on `jobId`, `candidateId`, `status`, and a unique compound key for duplicate prevention.
- Subscription indexes on `stripeSubscriptionId`, `userId`, and `companyId`.
- Notification index on `userId` and `isRead`.

### Data model tradeoffs
- Denormalized job/company data speeds reads for search and listing pages, reducing N+1 lookup pressure.
- Soft deletes are used across key collections, enabling compliance and safe recovery.
- User profile arrays for skills, experience, and education are bounded and designed for fast document lookups rather than unbounded growth.

## 4. Search architecture

### Search engine
- Primary: **Elasticsearch / OpenSearch** for production-grade full-text search and filtering.
- Fallback: **Meilisearch** for local development and rapid prototyping.

### Capabilities
- Full text search across job title, description, company name, and skills.
- Skill, location, experience, salary, and company filters.
- Fuzzy matching and relevance boosting.
- Search indexing performed asynchronously through BullMQ.

### Production considerations
- Use a dedicated search cluster with hot/cold nodes and replicas.
- Refresh strategy should move from `wait_for` on low-volume writes to background refresh for scale.
- Search-specific indexes should be monitored and reindexed when schema changes.

## 5. Redis strategy

### Uses
- Session cache and Better Auth session persistence.
- Job cache and cache-aside read optimization.
- Search and analytics caching.
- Rate limiting and distributed lock coordination.
- BullMQ message broker.

### Cache-aside pattern
`packages/redis/src/index.ts` provides `getOrSet()` and `invalidate()` helpers.
These are used by repositories to cache reads and invalidate stale records on writes.

### TTL and invalidation
- Object cache TTLs default to 1 hour for job pages and hot lookups.
- Invalidation is explicit after updates/deletes.
- Pattern invalidation helpers support broader cache eviction when needed.

### Locking and rate limits
- Distributed lock helper uses a simple Redis NX/PX pattern for critical sections.
- Rate limiting uses sliding-window sorted sets for burst-safe request control.

## 6. Queue architecture

### Queue system
- **BullMQ** on Redis provides reliability and retry semantics.

### Queues
- `email` for transactional email and notification delivery.
- `notification` for in-app and cross-channel notifications.
- `resume-processing` for resume parsing and enrichment.
- `search-indexing` for syncing jobs to search.
- `analytics` for event logging and aggregation.
- `dead-letter` for failed job persistence.

### Failures and retries
- Default exponential backoff with 3 attempts for critical queues.
- DLQ sink for jobs that exceed retry thresholds.
- Worker failure handler routes unrecoverable jobs to DLQ.

## 7. Authentication architecture

### Better Auth
- Email/password login and provider-based login through Better Auth.
- Sessions stored in MongoDB and validated through middleware.
- Role-based authorization in `requireRole()` middleware.

### Roles
- `super_admin`
- `admin`
- `recruiter`
- `candidate`

### Session management
- Session and account collections are already included in the Better Auth adapter model.
- Device tracking can be added via `ipAddress` and `userAgent` stored in session documents.

### Security
- Cookie attributes default to `sameSite: none`, `secure`, and `httpOnly`.
- All protected routes use explicit auth middleware.

## 8. API architecture

### Pattern
- RESTful API with response envelope:
  - Success: `{ success: true, message, data, meta }`
  - Error: `{ success: false, error: { code, message } }`

### Feature modules
- `/api/jobs`
- `/api/companies`
- `/api/users`
- `/api/applications`
- `/api/payments`
- `/api/auth` (Better Auth endpoint)

### OpenAPI / Swagger
- API specification is not yet implemented; `docs/API_SPEC.md` provides endpoint definitions and response contracts.
- Next step: generate OpenAPI YAML from route metadata or add `swagger-ui-express` / Redoc.

## 9. Frontend architecture

### Candidate and recruiter UI
- `apps/web` is the public UI.
- Uses Next.js App Router, React 19, Tailwind CSS, and Zustand.
- Auth client integration via `better-auth/react`.
- Supports Stripe client and file upload flows.

### Admin panel
- Not yet implemented in code.
- Should be a separate `apps/admin` application with shared UI components and RBAC.
- Admin panel must reuse `@job-portal/ui` components and use the same API backend.

## 10. Deployment architecture

### Production deployment
- Containerized backend and frontend services.
- Separate worker processes for BullMQ workers.
- MongoDB Atlas with replica sets.
- Redis Enterprise / MemoryDB for BullMQ and cache.
- Elasticsearch/OpenSearch cluster for search.
- AWS S3 for resumes, logos, and documents.
- Cloud CDN for frontend assets and static API responses.
- Load balancer in front of backend API.

### High-scale design
- API autoscaled horizontally behind load balancer.
- Read replicas for analytic & reporting reads.
- Dedicated search and cache layers.
- Worker fleet with concurrency tuning.
- Monitoring via Prometheus / Grafana and Sentry.

## 11. Security checklist
- [x] Input validation using Zod.
- [x] Role-based access control.
- [ ] CSRF protection for state-changing browser flows (needs frontend integration).
- [ ] Rate limiting on sensitive endpoints.
- [ ] Helmet or equivalent security headers.
- [ ] File validation for resume uploads.
- [ ] Stripe webhook signature verification.
- [ ] Audit logs for payment and support actions.
- [ ] OWASP Top 10 review.

## 12. Known gaps and next work
- `apps/admin` is not present and should be added as a separate panel.
- `apps/server/src/index.ts` currently uses Express for auth and does not fully route Hono feature modules.
- Environment validation is incomplete for Stripe, Redis, search, email, and S3.
- OpenAPI documentation is missing.
- Docker and GitHub Actions are not implemented yet.
- Sentry / OpenTelemetry instrumentation is not wired.

## 13. Recommended next implementation steps
1. Finalize `apps/server/src/app.ts` and `apps/server/src/index.ts` with Hono and auth routing.
2. Add `apps/admin` scaffold and admin-specific API guards.
3. Wire AWS S3 signed URL generation and file upload protections.
4. Add OpenAPI spec generation and Swagger UI.
5. Add Dockerfiles and GitHub Actions workflow.
6. Wire Sentry and OpenTelemetry for backend and frontend.
7. Add comprehensive unit and integration tests around repositories, controllers, and API flows.
