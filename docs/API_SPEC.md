# Job Portal API Specification

## Base URL
- `http://localhost:3001`

## Standard Response

Success
```json
{
  "success": true,
  "message": "",
  "data": {},
  "meta": {}
}
```

Error
```json
{
  "success": false,
  "error": {
    "code": "",
    "message": ""
  }
}
```

## Authentication
- Auth routes are handled by Better Auth at `/api/auth/*`.
- Supported providers: email/password, Google, GitHub.
- Session and access validation occur via `auth.api.getSession()`.

## Health

### GET /health
- Response: `200`
- Body: `{ "status": "ok" }`

### GET /metrics
- Response: Prometheus metrics payload.

## Jobs

### GET /api/jobs
- Query params: `query`, `location`, `type`, `experienceLevel`, `companyId`, `skills`, `minSalary`, `maxSalary`, `page`, `limit`
- Returns paginated search results.

### GET /api/jobs/:id
- Returns a single job by ID.

### POST /api/jobs
- Protected: recruiter, admin, super_admin
- Body:
  - `title`
  - `description`
  - `companyId`
  - `location`
  - `type`
  - `salaryMin`
  - `salaryMax`
  - `currency`
  - `experienceLevel`
  - `skillsRequired`
- Creates a job listing.

### PUT /api/jobs/:id
- Protected: recruiter, admin, super_admin
- Body: partial job update fields.
- Updates an existing job.

### DELETE /api/jobs/:id
- Protected: recruiter, admin, super_admin
- Soft deletes a job.

## Companies

### GET /api/companies
- Returns public company listings.

### GET /api/companies/slug/:slug
- Returns a company by slug.

### GET /api/companies/:id
- Returns a company by ID.

### POST /api/companies
- Protected: recruiter, admin, super_admin
- Create a new company profile.

### PUT /api/companies/:id
- Protected: recruiter, admin, super_admin
- Update a company profile.

### DELETE /api/companies/:id
- Protected: admin, super_admin
- Deletes a company.

## Users

### GET /api/users/me
- Protected: authenticated
- Returns current user profile.

### PUT /api/users/me
- Protected: authenticated
- Updates current user profile.

### POST /api/users/me/saved-jobs
- Protected: authenticated
- Save a job to user profile.

### DELETE /api/users/me/saved-jobs/:jobId
- Protected: authenticated
- Remove a saved job.

### GET /api/users
- Protected: admin, super_admin
- List all users.

### DELETE /api/users/:id
- Protected: admin, super_admin
- Delete a user.

## Applications

### POST /api/applications
- Protected: candidate
- Apply to a job.

### GET /api/applications/me
- Protected: candidate
- Get current user's applications.

### GET /api/applications
- Protected: recruiter, admin, super_admin
- List applications for employer jobs.

### GET /api/applications/:id
- Protected: authenticated
- Get a single application.

### PATCH /api/applications/:id/status
- Protected: recruiter, admin, super_admin
- Update application status.

## Payments

### POST /api/payments/webhook
- Stripe webhook endpoint.
- Verifies `stripe-signature`.

### POST /api/payments/checkout
- Protected: authenticated
- Create one-time Stripe checkout.

### POST /api/payments/subscribe
- Protected: authenticated
- Create subscription checkout.

### GET /api/payments/subscription
- Protected: authenticated
- Get current user's subscription.

### GET /api/payments/history
- Protected: authenticated
- Get payment history with pagination.

## Error codes
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `DB_ERROR`
- `SEARCH_ERROR`
- `STRIPE_ERROR`
- `WEBHOOK_ERROR`
- `INTERNAL_ERROR`

## Notes
- All protected endpoints require a valid Better Auth session.
- Use `Authorization` header or cookie as configured by Better Auth for browser sessions.
- API should be proxied through a load balancer in production.
