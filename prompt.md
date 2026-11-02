# Claude Code — MoMo Manager Build Prompt

Read the following files in order before doing anything:
1. `master_prompt.md` — Your tech stack rules, Prisma v7 patterns, and coding standards. Follow EXACTLY.
2. `design-style-guide.md` — The visual design system for MoMo Manager. Apply to every component you build.
3. `jb-components.md` — The JB component reference. Use these components before writing from scratch.
4. `project-description.md` — What we are building. Every decision must align with this.
5. `project-phases.md` — The build plan. Work through phases in order.

---

## Project Summary

**MoMo Manager** is a multi-branch mobile money business management system for East Africa. It supports 9 mobile lines across Uganda, Tanzania, Kenya, and Congo DRC. Three user roles: **Admin** (full access), **Manager** (branch-scoped, no bank float), **Cashier** (shift-scoped transaction recording). Dark glassmorphism UI with pink-orange gradient brand.

---

## Critical Rules

### Role-Based Access
- **Admin** routes live under `/app/(admin)/` with their own layout
- **Manager** routes live under `/app/(manager)/` with their own layout
- **Cashier** routes live under `/app/(cashier)/` with their own layout
- `middleware.ts` enforces role-based redirects at the edge — ADMIN → `/dashboard`, MANAGER → `/manager/dashboard`, CASHIER → `/cashier/dashboard`
- Manager can NEVER see `BankAccount` data — guard this at both API and UI level
- Cashier can NEVER record transactions without an open shift

### Data & Caching
- Use React Query for ALL client data fetching — never `useEffect` for data
- Use `getCachedOrFetch` + `invalidateTag` from `lib/cache.ts` on every Route Handler
- Float balance must update immediately on transaction POST — invalidate float cache tags
- Fee calculation is a stateless API call (`/api/fee-calculator`) — debounce 300ms in the form

### Mobile Lines
The 9 supported lines with their enum values:
```
Uganda:   MTN_UG, AIRTEL_UG
Tanzania: VODACOM_TZ, TIGO_TZ
Kenya:    SAFARICOM_KE, AIRTEL_KE
Congo DRC: ORANGE_CD, VODACOM_CD, AIRTEL_CD
```
The transaction form's mobile line selector must group lines by country using `<optgroup>` or a grouped dropdown component.

### Transaction Rules
- `amount` and `fee` stored as `Decimal` in Prisma (never Float for money)
- Fee = auto-calculated from `FeeRate` table (rateType PERCENTAGE or FLAT, with minFee/maxFee clamping)
- Once a transaction is saved it is immutable — no edit endpoint
- Shift must be OPEN for a cashier to post a transaction

### Design System
- Default color scheme: **dark** (background `#0D0D12`)
- Gradient cards for float/balance: `linear-gradient(135deg, #E040A0 0%, #FF6B35 100%)`
- Glass cards: `bg-white/4 border border-white/8 rounded-[16px]`
- Primary button: gradient pill `rounded-full bg-gradient-to-r from-[#E040A0] to-[#FF6B35]`
- Use Tabler outline icons (`ti-*` classes) — never filled variants
- Currency formatting: UGX (0 decimals), TZS (0 decimals), KES (2 decimals), CDF (2 decimals)
- Every data-fetching section wrapped in `<Suspense>` + `<ErrorBoundary>`

### Forms
- React Hook Form + Zod for every form
- Zod schemas live in `lib/validations/[feature].ts`
- Use the JB Form component (installed in Phase 1) — import from `@/components/ui/form`

### Email
- Welcome email fires on `POST /api/users` (admin creates user)
- Low float alert fires in `POST /api/transactions` handler when float drops below threshold
- Daily report via Vercel Cron at `/api/cron/daily-report` (20:00 UTC = 23:00 EAT)
- Protect cron route with `CRON_SECRET` header check

### PDF & Excel Export
- Use `@react-pdf/renderer` for PDF — never jsPDF
- Use `xlsx` for Excel export
- Export endpoints: `GET /api/reports/export?format=xlsx` and `GET /api/reports/export?format=pdf`
- Both accept query params: `branchId`, `mobileLineId`, `cashierId`, `type`, `startDate`, `endDate`

---

## Tech Stack (from master_prompt.md)
- Next.js 16 + TypeScript
- Prisma v7 + Neon PostgreSQL
- Upstash Redis (via `lib/cache.ts`)
- Better Auth (email/password only, admin creates accounts)
- React Query (TanStack Query v5)
- Zod + React Hook Form
- Framer Motion (animations)
- Resend + React Email
- Tailwind v4 CSS-first (`@theme` directive in globals.css)
- shadcn/ui components
- @react-pdf/renderer + xlsx

---

## Start

Begin with **Phase 1 — Foundation** from `project-phases.md`. Read all phase tasks carefully and execute them in order.

After completing each phase, **stop and confirm with me** before proceeding to the next phase. Show me what was built and what to verify before moving on.

Ask me if you are unsure about anything — especially around the fee calculation logic, float update behaviour, or role-based data scoping.
