# MoMo Manager — Project Description

## What This App Does
MoMo Manager is a multi-branch mobile money business management system built for East African mobile money operators. It enables admins, managers, and cashiers to record transactions, track float balances per mobile line, manage shifts, and generate detailed financial reports — all with role-based access control.

## Target Users
- **Primary user (Cashier):** On-the-ground staff who record mobile money transactions (deposits, withdrawals, transfers) during their shift and need to see their own daily transaction history.
- **Secondary users:** Branch Managers who oversee transaction activity per mobile line without seeing the main bank float; and a Super Admin who has full visibility over all branches, floats, reports, fee configurations, and user accounts.

## Core Value Proposition
A purpose-built back-office for East African mobile money businesses — replacing spreadsheets with real-time float tracking, auto-calculated commissions, shift-based reporting, and role-gated dashboards across multiple branches and 9 telecom lines.

## User Roles & Permissions

- **Super Admin:** Full access — manages all branches, creates all user accounts, configures fee rates per mobile line, views main bank float + all line floats, sees all reports across all branches, receives daily email reports and low-float alerts.
- **Manager:** Branch-scoped — views all transactions per mobile line within their branch, sees per-line float balances, sees branch-level reports. Cannot see the main bank account balance.
- **Cashier:** Shift-scoped — opens and closes their shift, records transactions (customer name, phone, type, amount, reference), sees auto-calculated fee, views their own transactions for the current day/shift only.

## Features — Complete List

1. **Multi-branch management** — Admin creates and manages multiple branches, each with its own cashiers, mobile lines, float balances, and reports.
2. **9 Mobile Line Support** — Uganda (MTN Uganda, Airtel Money Uganda), Tanzania (Vodacom Tanzania, Tigo Tanzania), Kenya (Safaricom M-Pesa, Airtel Money Kenya), Congo DRC (Orange Congo, Vodacom Congo, Airtel Money Congo).
3. **Shift management** — Cashier opens a shift (records opening float per line), performs transactions, closes shift with an auto-generated summary (total deposits, withdrawals, transfers, gross fees, net float movement).
4. **Transaction recording** — Cashier captures: customer name, customer phone number, transaction type (deposit / withdrawal / transfer), amount, mobile line used, reference/receipt number. Fee is auto-calculated.
5. **Auto-calculated fees** — Each mobile line has configurable fee rate tables (percentage or flat) per transaction type, set by admin. Fee is displayed to cashier before confirming.
6. **Per-line float tracking** — Each mobile line per branch has a live float balance. Deposits increase float, withdrawals decrease float. Balance updates in real time on transaction confirmation.
7. **Main bank account balance** — A master capital account visible only to the Super Admin. Tracks total business capital separately from line floats.
8. **Role-based dashboards** — Admin sees all-branch KPIs, float health, revenue. Manager sees branch-level line activity. Cashier sees shift summary and today's transactions.
9. **Transaction reports** — Filter by branch, mobile line, cashier, transaction type, date range. Exportable to Excel and PDF.
10. **Shift reports** — Per-shift summary with opening/closing float, transaction count, total amount, total fees collected.
11. **Float alerts** — Email notification to admin when any line's float drops below a configurable threshold.
12. **Daily email reports** — Automated daily summary emailed to admin with total transactions, revenue, and float status per branch.
13. **User management** — Admin creates cashier and manager accounts manually (name, email, role, branch assignment). No self-signup. Credentials emailed to new user.
14. **Fee rate configuration** — Admin sets fee rates per mobile line per transaction type (deposit %, withdrawal %, transfer %).
15. **Transaction detail view** — Full record of any transaction including timestamp, cashier, shift, line, reference number, amount, fee, and customer details.
16. **Audit trail** — All transactions are immutable once recorded; edits not permitted, cancellation logged separately.

## Data Model

- **Branch:** id, name, location, country, createdAt
- **User:** id, name, email, passwordHash, role (ADMIN | MANAGER | CASHIER), branchId, createdAt, isActive
- **MobileLine:** id, name, country, operator (enum: MTN_UG, AIRTEL_UG, VODACOM_TZ, TIGO_TZ, SAFARICOM_KE, AIRTEL_KE, ORANGE_CD, VODACOM_CD, AIRTEL_CD), isActive
- **FeeRate:** id, mobileLineId, branchId, transactionType (DEPOSIT | WITHDRAWAL | TRANSFER), rateType (PERCENTAGE | FLAT), rateValue (Decimal), minFee (Decimal), maxFee (Decimal)
- **LineFloat:** id, mobileLineId, branchId, balance (Decimal), currency (String), lastUpdated
- **BankAccount:** id, branchId, balance (Decimal), currency (String), lastUpdated
- **Shift:** id, cashierId, branchId, status (OPEN | CLOSED), openedAt, closedAt, notes
- **ShiftLineSnapshot:** id, shiftId, mobileLineId, openingFloat, closingFloat
- **Transaction:** id, customerId (null | ref), customerName (String), customerPhone (String), type (DEPOSIT | WITHDRAWAL | TRANSFER), amount (Decimal), fee (Decimal), referenceNo (String), mobileLineId, cashierId, branchId, shiftId, createdAt
- **Notification:** id, type (LOW_FLOAT | DAILY_REPORT | WELCOME | PASSWORD_RESET), recipientId, message, sentAt, isRead

**Relationships:**
- Branch has many Users, LineFloats, BankAccounts, Shifts, Transactions
- User (Cashier) has many Shifts and Transactions
- MobileLine has many FeeRates, LineFloats, Transactions
- Shift belongs to Cashier (User) and Branch; has many Transactions and ShiftLineSnapshots
- Transaction belongs to Shift, MobileLine, Cashier, Branch
- FeeRate belongs to MobileLine and Branch

## Pages / Screens

### Admin
1. `/` — Public landing/login redirect
2. `/login` — Email + password login (no OAuth)
3. `/dashboard` — Admin overview: total transactions today, total fees, float health across all branches, quick alerts
4. `/dashboard/branches` — List all branches with status, cashier count, line count
5. `/dashboard/branches/new` — Create new branch form
6. `/dashboard/branches/[id]` — Branch detail: lines, floats, cashiers, recent transactions
7. `/dashboard/users` — All users table with role filter, branch filter, create/deactivate
8. `/dashboard/users/new` — Create user form (name, email, role, branch)
9. `/dashboard/mobile-lines` — All mobile lines, fee rate configuration per line per branch
10. `/dashboard/mobile-lines/[id]` — Fee rate editor for this line across branches
11. `/dashboard/transactions` — All transactions across all branches with full filter/search/export
12. `/dashboard/transactions/[id]` — Transaction detail view
13. `/dashboard/shifts` — All shifts across branches with status, cashier, date filters
14. `/dashboard/shifts/[id]` — Shift detail with transaction list and summary
15. `/dashboard/float` — Float dashboard: per-branch, per-line float balances + main bank account
16. `/dashboard/reports` — Reports page: date-range selector, branch/line filters, Excel + PDF export
17. `/dashboard/settings` — Fee rate thresholds, low float alert config, notification settings

### Manager
18. `/manager/dashboard` — Branch KPIs: transactions today, fees collected, line float status
19. `/manager/transactions` — Transactions for their branch, filter by line, type, cashier, date
20. `/manager/transactions/[id]` — Transaction detail
21. `/manager/shifts` — Shifts in their branch
22. `/manager/shifts/[id]` — Shift detail
23. `/manager/float` — Float balances for all mobile lines in their branch (no bank account)
24. `/manager/reports` — Branch-level reports, Excel + PDF export

### Cashier
25. `/cashier/dashboard` — Shift status, today's transaction count, quick-record button
26. `/cashier/shift` — Open or close shift, view current shift summary
27. `/cashier/transactions/new` — Record new transaction form
28. `/cashier/transactions` — Today's transactions in current shift

## Integrations
- **Auth:** Better Auth + Email only (admin creates accounts, credentials emailed)
- **Email:** Resend (welcome email, daily reports, low float alerts)
- **Payments:** None
- **File uploads:** None
- **AI features:** None
- **Dark mode:** Yes

## JB Components to Install
- Better Auth UI: `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- Data Table: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- Form (shadcn fallback): `pnpm dlx shadcn@latest add https://vibekit.desishub.com/r/form.json`

## Out of Scope (v1)
- Customer-facing mobile app or USSD interface
- Direct telecom API integration (M-Pesa Daraja, MTN MoMo API) — transactions are manually recorded
- Automated float top-up or bank transfer initiation
- Loan, credit, or savings products
- Multi-currency conversion or FX rate tracking
- Payroll or staff expense management
- SMS notifications to customers
