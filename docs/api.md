# GHOR Backend API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
- `POST /auth/signup` — register new user
- `POST /auth/login` — login and receive JWT cookie + token
- `GET /auth/logout` — clear authentication cookie
- `POST /auth/forgot-password` — request password reset token
- `PATCH /auth/reset-password/:token` — reset password with token
- `PATCH /auth/update-password` — update password while authenticated
- `GET /auth/me` — current authenticated user

## Users
- `GET /users/profile` — current user profile
- `PATCH /users/profile` — update own profile
- `GET /users` — admin/super-admin only: list users
- `GET /users/:id` — admin/super-admin only: get specific user
- `PATCH /users/:id` — admin/super-admin only: update user fields
- `DELETE /users/:id` — admin/super-admin only: deactivate user

Pagination & export for admin listings:
- All admin list endpoints accept query params: `page`, `limit`, `q` (search), and resource-specific filters (e.g., `role`, `status`).
- To export full CSV: add `export=csv` to the query string, e.g. `GET /users?export=csv&role=member` (cookie auth required).

## Loans
- `POST /loans` — create new loan request
- `GET /loans` — list loans; members see own loans, admins see all
- `GET /loans/:id` — get loan details
- `PATCH /loans/:id` — admin/super-admin only: update loan status/details
- `DELETE /loans/:id` — admin/super-admin only: delete loan

Admin listing supports `page`, `limit`, `q`, `status` and `export=csv` for server-side CSV exports.

## Savings
- `POST /savings` — create a savings record
- `GET /savings` — list savings accounts
- `GET /savings/:id` — get saving details
- `PATCH /savings/:id` — admin/super-admin only: update saving
- `DELETE /savings/:id` — admin/super-admin only: delete saving

Admin listing supports `page`, `limit`, `q` and `export=csv`.

## Transactions
- `POST /transactions` — create transaction record
- `GET /transactions` — list transactions
- `GET /transactions/:id` — get transaction details
- `DELETE /transactions/:id` — admin/super-admin only: delete transaction

Admin listing supports `page`, `limit`, `q`, `type` and `export=csv`.

## KYC Uploads
- `POST /kyc` — upload KYC document (`document` file field plus `documentType`)
- `GET /kyc` — list own KYC submissions or all for admins
- `PATCH /kyc/:id` — admin/super-admin only: update KYC status
- `DELETE /kyc/:id` — admin/super-admin only: delete KYC record

Admin listing supports `page`, `limit`, `q`, `status` and `export=csv`.

## Notifications
- `GET /notifications` — list notifications for current user or all for admins
- `POST /notifications` — admin/super-admin only: create notification
- `PATCH /notifications/:id/read` — mark notification as read
- `DELETE /notifications/:id` — admin/super-admin only: delete notification

## Blog Posts
- `GET /blogs` — list published blog posts
- `GET /blogs/slug/:slug` — get a blog by slug
- `POST /blogs` — admin/super-admin only: create a blog post
- `PATCH /blogs/:id` — admin/super-admin only: update a blog post
- `DELETE /blogs/:id` — admin/super-admin only: delete a blog post

## Testimonials
- `GET /testimonials` — list testimonials
- `POST /testimonials` — admin/super-admin only: add testimonial
- `PATCH /testimonials/:id` — admin/super-admin only: update testimonial
- `DELETE /testimonials/:id` — admin/super-admin only: delete testimonial

## Repayments
- `POST /repayments` — create repayment schedule item (protected)
- `GET /repayments` — list repayments; members see own, admins see all
- `GET /repayments/:id` — get repayment details
- `PATCH /repayments/:id` — admin/super-admin only: update repayment
- `DELETE /repayments/:id` — admin/super-admin only: delete repayment

## Admin Users
- `POST /admin-users` — super-admin only: create admin user metadata
- `GET /admin-users` — super-admin only: list admin user metadata
- `GET /admin-users/:id` — super-admin only: get specific admin user metadata
- `PATCH /admin-users/:id` — super-admin only: update admin user metadata
- `DELETE /admin-users/:id` — super-admin only: delete admin user metadata

## Role Definitions
- `member` — normal platform user
- `admin` — staff user with management permissions
- `super-admin` — full backend access and user management

## Security
- JWT auth for protected routes
- Role-based `restrictTo` middleware
- Rate limiting on all `/api` requests
- HTTP headers via Helmet
- Data sanitization against NoSQL injection and XSS
- Global error handling with operational error responses
