# MoMo Manager — Build Phases

## Phase 1 — Foundation
**Goal:** Project scaffolded, design system applied, env files created, database connected, Redis cache configured, auth working, role-based routing in place.

### Tasks
- [ ] Initialize Next.js 16 + shadcn/ui in ONE step: `pnpm dlx shadcn@latest init --preset b0 --template next`. **Do NOT use `--src-dir`** — flat root layout required (`app/`, `components/`, `lib/` at project root, no `src/` wrapper). Fallback: `pnpm create next-app --no-src-dir`.
- [ ] Confirm `tsconfig.json` has `"paths": { "@/*": ["./*"] }` (NOT `["./src/*"]`).
- [ ] Install Form shadcn fallback: `pnpm dlx shadcn@latest add https://vibekit.desishub.com/r/form.json`
- [ ] Create `.env.example` (committed) and `.env.local` (gitignored) with ALL required env vars:
  ```
  DATABASE_URL=                  # Neon PostgreSQL connection string
  UPSTASH_REDIS_URL=             # Upstash Redis REST URL
  UPSTASH_REDIS_TOKEN=           # Upstash Redis REST token
  BETTER_AUTH_SECRET=            # Random 32+ char secret
  BETTER_AUTH_URL=               # e.g. http://localhost:3000
  RESEND_API_KEY=                # Resend API key for emails
  NEXT_PUBLIC_APP_URL=           # Public app URL
  ```
- [ ] Add `.env.local` to `.gitignore`
- [ ] Set up Prisma v7 with Neon PostgreSQL — schema file, prisma client in `lib/db.ts`
- [ ] Set up Upstash Redis cache client in `lib/cache.ts` with `getCachedOrFetch()` and `invalidateTag()` wrappers. Add `@upstash/redis` to dependencies.
- [ ] Apply `design-style-guide.md` tokens to `app/globals.css` using Tailwind v4 CSS-first config — `@theme` directive, no `tailwind.config.ts`. Dark background `#0D0D12`, pink-orange gradient, glassmorphism card surfaces.
- [ ] Create root layout with Inter font (weights 400, 700, 800), QueryClientProvider, ThemeProvider + next-themes (dark mode enabled, default: dark).
- [ ] Build three distinct sidebar layouts (each role gets its own layout shell):
  - `/app/(admin)/layout.tsx` — Admin sidebar with all admin nav items
  - `/app/(manager)/layout.tsx` — Manager sidebar with branch-scoped nav
  - `/app/(cashier)/layout.tsx` — Cashier minimal sidebar with shift + record nav
  - Each sidebar: collapsible, nav items with Tabler icons, user section, dark mode toggle
- [ ] Build shared page header component: breadcrumb + title + action slot (`components/ui/page-header.tsx`)
- [ ] Install JB Better Auth UI: `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- [ ] Configure Better Auth with email/password only (no OAuth). Admin creates users manually — disable public signup via Better Auth config.
- [ ] Set up Better Auth env vars (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- [ ] Create protected route middleware (`middleware.ts`) — edge-level auth check + role-based redirect:
  - Unauthenticated → `/login`
  - ADMIN → `/dashboard`
  - MANAGER → `/manager/dashboard`
  - CASHIER → `/cashier/dashboard`
- [ ] Build custom `not-found.tsx`, `error.tsx`, and `loading.tsx` pages styled with design system
- [ ] Build `components/ui/gradient-card.tsx` — reusable glassmorphism card with pink-orange gradient header variant (used for balance/float display)
- [ ] Verify: login works, role-based routing works, layout renders correctly per role

### Dependencies
- Neon database created, `DATABASE_URL` set in `.env.local`
- Upstash Redis database created, `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` set
- Resend account created, `RESEND_API_KEY` set

---

## Phase 2 — Core Data Model & Seed
**Goal:** Full Prisma schema defined, migrated, and seeded with realistic data.

### Tasks
- [ ] Define complete Prisma schema in `prisma/schema.prisma`:
  ```
  Models: Branch, User, MobileLine, FeeRate, LineFloat,
  BankAccount, Shift, ShiftLineSnapshot, Transaction, Notification
  Enums: Role, TransactionType, ShiftStatus, NotificationType,
         MobileOperator, RateType
  ```
- [ ] Run migration: `pnpm db:push && pnpm db:generate`
- [ ] Create `prisma/seed.ts` with realistic data:
  - 4 branches (Kampala Main, Nairobi CBD, Dar es Salaam, Kinshasa)
  - 1 super admin user
  - 2 managers per branch
  - 3 cashiers per branch
  - All 9 mobile lines created and assigned to each branch
  - FeeRate entries for each line × each branch × each transaction type
  - LineFloat entries for each line × each branch (realistic starting balances)
  - BankAccount for each branch
  - 5 closed shifts per cashier with 20+ transactions each
  - Notification records
  - 200+ total transactions with varied types, amounts, dates (edge cases: zero-fee lines, min/max fee capping, same-day many transactions)
- [ ] Add `"db:seed": "tsx prisma/seed.ts"` to `package.json` scripts
- [ ] Run: `pnpm db:seed`
- [ ] Verify seed data in Prisma Studio: `pnpm prisma studio`

### Dependencies
- Phase 1 complete

---

## Phase 3 — API Routes with Caching
**Goal:** All Route Handlers built with Redis caching and role-based access guards.

### Tasks
- [ ] Create `lib/auth-guard.ts` — server-side role check helper for Route Handlers
- [ ] Build API routes (all with `getCachedOrFetch` + `invalidateTag`):
  - `GET/POST /api/branches` — list branches, create branch (Admin only)
  - `GET/PATCH /api/branches/[id]` — branch detail, update
  - `GET/POST /api/users` — list users, create user (Admin only)
  - `PATCH /api/users/[id]` — update/deactivate user
  - `GET /api/mobile-lines` — list all mobile lines
  - `GET/PUT /api/fee-rates` — get and update fee rates per line per branch (Admin only)
  - `GET /api/float` — line floats for branch (Admin sees all, Manager sees own branch)
  - `GET /api/bank-account` — bank account balance (Admin only)
  - `GET/POST /api/shifts` — list shifts, open shift (Cashier)
  - `PATCH /api/shifts/[id]/close` — close shift (Cashier own shift only)
  - `GET /api/shifts/[id]` — shift detail with summary
  - `GET/POST /api/transactions` — list transactions (role-scoped), create transaction
  - `GET /api/transactions/[id]` — transaction detail
  - `GET /api/reports/summary` — summary stats with date range + branch + line filters
  - `GET /api/reports/export` — Excel export (uses xlsx)
  - `GET /api/reports/pdf` — PDF export (uses @react-pdf/renderer)
  - `POST /api/fee-calculator` — stateless endpoint: given mobileLineId + branchId + type + amount → returns calculated fee
- [ ] Server-side pagination on all list endpoints (`page`, `limit`, `search` query params)
- [ ] Float auto-update logic: on transaction POST, update `LineFloat.balance` and invalidate float cache
- [ ] Verify: every GET route caches via Redis, every mutation invalidates relevant cache tags

### Dependencies
- Phase 2 complete (schema + seed data)

---

## Phase 4 — Admin Dashboard & Features
**Goal:** All admin screens built, connected to real data, with full CRUD.

### Tasks
- [ ] Install JB Data Table: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- [ ] Build `/dashboard` — Admin overview page:
  - Gradient stat cards: Total Transactions Today, Total Fees Today, Active Shifts, Low Float Alerts
  - Float health table: per branch × per line with status indicators (green/amber/red)
  - Recent transactions mini-table (last 10)
  - All wrapped in Suspense + ErrorBoundary
- [ ] Build `/dashboard/branches` — branches data table (search, filter by country, pagination)
- [ ] Build `/dashboard/branches/new` — create branch form (React Hook Form + Zod)
- [ ] Build `/dashboard/branches/[id]` — branch detail: line floats, cashier list, recent transactions
- [ ] Build `/dashboard/users` — users data table with role + branch filters, create/deactivate actions
- [ ] Build `/dashboard/users/new` — create user form (name, email, role, branch selector)
- [ ] Build `/dashboard/mobile-lines` — mobile lines list with fee rate configuration table
- [ ] Build `/dashboard/mobile-lines/[id]` — fee rate editor: inline table editable rows for deposit/withdrawal/transfer rates per branch
- [ ] Build `/dashboard/transactions` — full transactions table with: date range picker, branch filter, line filter, type filter, cashier filter, search by reference/customer name, Excel export, PDF export
- [ ] Build `/dashboard/transactions/[id]` — transaction detail view card
- [ ] Build `/dashboard/shifts` — shifts table with status badges, branch/cashier filters
- [ ] Build `/dashboard/shifts/[id]` — shift detail: opening/closing float per line, transaction list, summary totals
- [ ] Build `/dashboard/float` — float dashboard:
  - Main bank account balance card (gradient hero, Admin only)
  - Per-branch accordion with per-line float cards
  - Low float threshold indicators
- [ ] Build `/dashboard/reports` — report builder: date range, branch, line, type selectors → summary stats + export buttons
- [ ] Build `/dashboard/settings` — low float threshold config per line, notification preferences
- [ ] Add empty states + loading skeletons for all admin pages
- [ ] Verify: all CRUD works, float updates on transaction create, role guard blocks non-admins

### Dependencies
- Phase 3 complete (API routes working)

---

## Phase 5 — Manager Dashboard & Features
**Goal:** Manager-scoped screens built and correctly data-gated.

### Tasks
- [ ] Build `/manager/dashboard` — branch KPI cards: transactions today, total fees, active cashiers, line float status grid
- [ ] Build `/manager/transactions` — transactions for their branch only (same data table component, branch-locked)
- [ ] Build `/manager/transactions/[id]` — transaction detail (read-only)
- [ ] Build `/manager/shifts` — shifts in their branch with cashier filter
- [ ] Build `/manager/shifts/[id]` — shift detail view
- [ ] Build `/manager/float` — line floats for their branch only (NO bank account card — middleware enforces this)
- [ ] Build `/manager/reports` — branch-scoped report builder with Excel + PDF export
- [ ] Verify: manager cannot access `/dashboard/*`, cannot see bank account balance, data scoped to their branch

### Dependencies
- Phase 4 complete (shared components built)

---

## Phase 6 — Cashier Dashboard & Transaction Recording
**Goal:** Cashier workflow fully functional — open shift, record transactions, close shift.

### Tasks
- [ ] Build `/cashier/dashboard` — shift status card (open/closed), today's totals, quick "Record Transaction" button
- [ ] Build `/cashier/shift` — shift management page:
  - If no open shift: "Open Shift" button with per-line opening float entry form
  - If shift open: shift summary (elapsed time, transaction count, totals per type, per-line balance movement), "Close Shift" button with confirmation
- [ ] Build `/cashier/transactions/new` — transaction recording form:
  - Mobile line selector (dropdown with country grouping: Uganda, Tanzania, Kenya, Congo)
  - Transaction type selector (Deposit / Withdrawal / Transfer)
  - Amount input — triggers live fee calculation via `/api/fee-calculator` (debounced, 300ms)
  - Fee display (read-only, auto-populated)
  - Customer name + phone fields
  - Reference/receipt number field
  - Confirm button with summary before submit
  - Success state with option to record another
- [ ] Build `/cashier/transactions` — today's transactions list (current shift only), read-only
- [ ] Guard: cashier cannot record transactions without an open shift (redirect to shift page)
- [ ] Add loading skeletons and empty states for cashier pages
- [ ] Verify: full cashier workflow — open shift → record transactions (float updates) → close shift (summary generated)

### Dependencies
- Phase 3 complete (API routes including fee-calculator and shifts)

---

## Phase 7 — Email Notifications
**Goal:** System communicates with users via Resend.

### Tasks
- [ ] Install and configure Resend + React Email: `pnpm add resend @react-email/components`
- [ ] Build email templates in `emails/`:
  - `welcome.tsx` — new user welcome with login credentials
  - `daily-report.tsx` — admin daily summary: total transactions, fees, branch breakdown, float status table
  - `low-float-alert.tsx` — alert with branch name, mobile line, current balance, threshold
- [ ] Wire welcome email: triggered when Admin creates a new user (`POST /api/users`)
- [ ] Wire daily report: scheduled via Vercel Cron (`/api/cron/daily-report`) — runs at 11 PM EAT (20:00 UTC)
- [ ] Wire low float alert: triggered in transaction POST handler when float drops below threshold after deduction
- [ ] Add `CRON_SECRET` env var for cron route protection
- [ ] Verify: welcome email sends on user create, low float alert fires correctly

### Dependencies
- Phase 3 complete (API routes), Phase 4 complete (settings/threshold config)

---

## Phase 8 — Polish & Deploy
**Goal:** Production-ready, live on Vercel with custom domain.

### Tasks
- [ ] Test all CRUD operations end-to-end for each role
- [ ] Test shift open → transaction → float update → shift close flow
- [ ] Test fee calculation accuracy for all 9 mobile lines
- [ ] Test role-based access (admin, manager, cashier — cross-role access blocked)
- [ ] Test email delivery: welcome, daily report, low float alert
- [ ] Verify responsive design on mobile (cashier transaction form especially)
- [ ] **Run pre-deploy code review:** paste prompt from `pre-deploy-review.md` into Claude Code. Address every Critical issue. Save report to `pre-deploy-review-report.md`.
- [ ] Set all environment variables in Vercel dashboard
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Configure Cloudflare DNS + custom domain
- [ ] Verify Resend sending domain (add SPF/DKIM records)
- [ ] Apply database migrations to production: `pnpm db:push`
- [ ] Run production checklist

### Production Checklist
- [ ] All env vars set in Vercel (DATABASE_URL, UPSTASH_*, BETTER_AUTH_*, RESEND_API_KEY, CRON_SECRET, NEXT_PUBLIC_APP_URL)
- [ ] Database migrations applied to production Neon DB
- [ ] Auth flows work on production URL
- [ ] Custom domain live with SSL
- [ ] Emails land in inbox (not spam) — check SPF/DKIM
- [ ] 404 and error pages styled
- [ ] Cron job verified in Vercel dashboard
- [ ] Float update tested on production with a real transaction
