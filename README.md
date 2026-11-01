<div align="center">

# 📱 MoMo Manager

**Mobile money, managed.**

Run a multi-branch mobile money business from one dashboard: float, shifts, transactions and staff, with a separate workspace for every role.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

</div>

---

## ✨ Why MoMo Manager

Mobile money agents and businesses often track float, cash and commissions in notebooks or spreadsheets. MoMo Manager replaces that with live records per branch, per line and per shift, so owners always know where the money is.

## 👥 Built for every role

| Role | What they can do |
|---|---|
| **Admin / Owner** | Manage branches, mobile lines and users · monitor float across all lines · set fee rates · view every transaction and shift · export reports |
| **Manager** | Oversee their branch · track float and shifts · review transactions · branch reports |
| **Cashier** | Open and close a shift · record deposits and withdrawals · see their own transaction history |

## 🚀 Features

- 🏢 **Multi-branch:** run several outlets from one account
- 📞 **Mobile lines:** track each MoMo/Airtel line and its float separately
- 💰 **Float management:** line float and bank accounts, with snapshots at every shift
- ⏱️ **Shifts:** open/close shifts with opening and closing balances per line
- 🧾 **Transactions:** record, search and review every transaction, with fees calculated from fee rates
- 📊 **Reports:** daily and branch reports, exportable to **Excel** and **PDF**
- 🔔 **Notifications** and **email** alerts (Resend)
- 🔐 **Role-based access** with Better Auth

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Auth | Better Auth |
| UI | Tailwind CSS 4, shadcn/ui, Radix, Lucide, Framer Motion |
| Data | TanStack Query, TanStack Table, React Hook Form, Zod |
| Services | Resend + React Email, Upstash Redis |
| Exports | xlsx, @react-pdf/renderer |

## ⚡ Getting Started

```bash
git clone https://github.com/BiyinzikaBruce/momo-manager.git
cd momo-manager
pnpm install

cp .env.example .env      # fill in your values
pnpm db:push              # create the database tables
pnpm db:seed              # optional: sample data
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](./.env.example). You'll need `DATABASE_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` and `CRON_SECRET`.

📘 Not sure where to get these? See my [Environment Variables Cheatsheet](https://biyinzikabruce.github.io/env-cheatsheet/).

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm db:push` | Sync the Prisma schema to the database |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:reset` | Reset the database and re-seed |
| `pnpm db:studio` | Open Prisma Studio |

## 📁 Project Structure

```
app/
  (admin)/dashboard/   # owner: branches, lines, float, shifts, users, reports
  (manager)/manager/   # branch manager workspace
  (cashier)/cashier/   # cashier: shift + transactions
  api/                 # route handlers
components/            # UI components
emails/                # React Email templates
lib/                   # auth, db, utils
prisma/                # schema + seed
```

---

<div align="center">

Built by **[Biyinzika Bruce](https://github.com/BiyinzikaBruce)** · Tech Power Africa

</div>
