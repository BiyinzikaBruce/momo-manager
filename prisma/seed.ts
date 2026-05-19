import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../lib/generated/prisma/client";
import type { MobileOperator, TransactionType } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync } from "crypto";
import { randomUUID } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

// === PASSWORD HASHING — matches @better-auth/utils/password format ===
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

// === RANDOM HELPERS ===
const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[rnd(0, arr.length - 1)];
const round2 = (n: number) => Math.round(n * 100) / 100;

// === CUSTOMER DATA ===
const CUSTOMER_NAMES = [
  "Mukasa David", "Namukasa Sarah", "Kizito Emmanuel", "Nalwanga Grace",
  "Ssemakula John", "Nabukenya Fatima", "Ochieng Peter", "Auma Mary",
  "Otieno Joseph", "Wanjiku Ann", "Kamau James", "Njeri Carol",
  "Juma Hassan", "Amina Omar", "Rashid Ali", "Mutumbo Jean",
  "Kabila Marie", "Lukusa Paul", "Mgeni Salim", "Mkande Rose",
  "Chuma Felix", "Nkosi Thomas", "Zimba Agnes", "Banda Michael",
  "Mwenda Faith", "Kiprotich Daniel", "Achieng Beatrice", "Odongo Samuel",
];

const PHONE_PREFIXES: Record<string, string[]> = {
  Uganda:      ["0701", "0702", "0703", "0751", "0752"],
  Kenya:       ["0700", "0710", "0720", "0730", "0740"],
  Tanzania:    ["0711", "0712", "0713", "0762", "0769"],
  "Congo DRC": ["0810", "0815", "0820", "0825", "0850"],
};

function randomPhone(country: string): string {
  const prefix = pick(PHONE_PREFIXES[country] ?? ["0700"]);
  return `${prefix}${rnd(100000, 999999)}`;
}

// === FEE CONFIG ===
const OPERATOR_RATES: Record<MobileOperator, { wRate: number; tRate: number }> = {
  MTN_UG:      { wRate: 1.5, tRate: 1.0 },
  AIRTEL_UG:   { wRate: 1.3, tRate: 0.9 },
  VODACOM_TZ:  { wRate: 1.4, tRate: 0.9 },
  TIGO_TZ:     { wRate: 1.2, tRate: 0.8 },
  SAFARICOM_KE:{ wRate: 1.5, tRate: 1.0 },
  AIRTEL_KE:   { wRate: 1.3, tRate: 0.8 },
  ORANGE_CD:   { wRate: 2.0, tRate: 1.5 },
  VODACOM_CD:  { wRate: 1.8, tRate: 1.2 },
  AIRTEL_CD:   { wRate: 1.5, tRate: 1.0 },
};

const CURRENCY_FEE_LIMITS: Record<
  string,
  { wMin: number; wMax: number; tMin: number; tMax: number }
> = {
  UGX: { wMin: 500,  wMax: 50000, tMin: 300,  tMax: 30000 },
  KES: { wMin: 10,   wMax: 3000,  tMin: 10,   tMax: 2000  },
  TZS: { wMin: 100,  wMax: 20000, tMin: 100,  tMax: 15000 },
  CDF: { wMin: 200,  wMax: 50000, tMin: 200,  tMax: 40000 },
};

function calcFee(
  rate: number,
  amount: number,
  minFee: number,
  maxFee: number
): number {
  let fee = (rate / 100) * amount;
  if (fee < minFee) fee = minFee;
  if (fee > maxFee) fee = maxFee;
  return fee;
}

// === FLOAT & AMOUNT CONFIG ===
const STARTING_FLOATS: Record<string, Partial<Record<MobileOperator, number>>> = {
  UGX: {
    MTN_UG: 12000000, AIRTEL_UG: 9500000, VODACOM_TZ: 5000000,
    TIGO_TZ: 4500000, SAFARICOM_KE: 6000000, AIRTEL_KE: 5500000,
    ORANGE_CD: 4800000, VODACOM_CD: 4200000, AIRTEL_CD: 4000000,
  },
  KES: {
    MTN_UG: 60000, AIRTEL_UG: 55000, VODACOM_TZ: 50000,
    TIGO_TZ: 48000, SAFARICOM_KE: 120000, AIRTEL_KE: 95000,
    ORANGE_CD: 45000, VODACOM_CD: 42000, AIRTEL_CD: 40000,
  },
  TZS: {
    MTN_UG: 2500000, AIRTEL_UG: 2200000, VODACOM_TZ: 3500000,
    TIGO_TZ: 3000000, SAFARICOM_KE: 2800000, AIRTEL_KE: 2600000,
    ORANGE_CD: 2000000, VODACOM_CD: 1800000, AIRTEL_CD: 1700000,
  },
  CDF: {
    MTN_UG: 500000, AIRTEL_UG: 480000, VODACOM_TZ: 490000,
    TIGO_TZ: 470000, SAFARICOM_KE: 510000, AIRTEL_KE: 495000,
    ORANGE_CD: 1200000, VODACOM_CD: 1050000, AIRTEL_CD: 980000,
  },
};

const LOW_THRESHOLDS: Record<string, number> = {
  UGX: 500000, KES: 5000, TZS: 100000, CDF: 50000,
};

const TX_AMOUNT_CONFIG: Record<
  string,
  { min: number; max: number; decimals: number }
> = {
  UGX: { min: 10000,  max: 2000000, decimals: 0 },
  KES: { min: 200,    max: 30000,   decimals: 2 },
  TZS: { min: 1000,   max: 200000,  decimals: 0 },
  CDF: { min: 500,    max: 100000,  decimals: 2 },
};

const ALL_OPERATORS: MobileOperator[] = [
  "MTN_UG", "AIRTEL_UG", "VODACOM_TZ", "TIGO_TZ",
  "SAFARICOM_KE", "AIRTEL_KE", "ORANGE_CD", "VODACOM_CD", "AIRTEL_CD",
];

const TX_TYPES: TransactionType[] = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"];

// ===== MAIN =====
async function main() {
  console.log("🌱 Seeding MoMo Manager...\n");

  // --- Clean in dependency order ---
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.shiftLineSnapshot.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.lineFloat.deleteMany();
  await prisma.feeRate.deleteMany();
  await prisma.mobileLine.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  console.log("  ✓ Cleared existing data");

  // --- 1. BRANCHES ---
  const branches = await Promise.all([
    prisma.branch.create({ data: { name: "Kampala Main",    country: "Uganda",     city: "Kampala",      address: "Kampala Road, CBD",          currency: "UGX" } }),
    prisma.branch.create({ data: { name: "Nairobi CBD",     country: "Kenya",      city: "Nairobi",      address: "Kenyatta Avenue, Central",   currency: "KES" } }),
    prisma.branch.create({ data: { name: "Dar es Salaam",   country: "Tanzania",   city: "Dar es Salaam",address: "Samora Avenue, City Centre",  currency: "TZS" } }),
    prisma.branch.create({ data: { name: "Kinshasa Central",country: "Congo DRC",  city: "Kinshasa",     address: "Boulevard du 30 Juin, Gombe", currency: "CDF" } }),
  ]);
  console.log(`  ✓ ${branches.length} branches`);

  // --- 2. USERS ---
  const adminPwd    = hashPassword("Admin@1234");
  const managerPwd  = hashPassword("Manager@1234");
  const cashierPwd  = hashPassword("Cashier@1234");

  async function createUser(opts: {
    name: string; email: string; role: string;
    branchId?: string; hashedPassword: string;
  }) {
    const userId = randomUUID();
    const now = new Date();
    const u = await prisma.user.create({
      data: {
        id: userId, name: opts.name, email: opts.email,
        emailVerified: true, createdAt: now, updatedAt: now,
        role: opts.role, branchId: opts.branchId ?? null, isActive: true,
      },
    });
    await prisma.account.create({
      data: {
        id: randomUUID(), userId, accountId: opts.email,
        providerId: "credential", password: opts.hashedPassword,
        createdAt: now, updatedAt: now,
      },
    });
    return u;
  }

  const admin = await createUser({ name: "Super Admin", email: "admin@momomgr.com", role: "ADMIN", hashedPassword: adminPwd });

  const managers: Awaited<ReturnType<typeof createUser>>[] = [];
  for (const branch of branches) {
    const tag = branch.country.toLowerCase().replace(/\s+/g, "").slice(0, 2);
    for (let i = 1; i <= 2; i++) {
      managers.push(await createUser({
        name: `Manager ${i} (${branch.city})`,
        email: `manager${i}.${tag}@momomgr.com`,
        role: "MANAGER", branchId: branch.id, hashedPassword: managerPwd,
      }));
    }
  }

  const cashiers: Awaited<ReturnType<typeof createUser>>[] = [];
  for (const branch of branches) {
    const tag = branch.country.toLowerCase().replace(/\s+/g, "").slice(0, 2);
    for (let i = 1; i <= 3; i++) {
      cashiers.push(await createUser({
        name: `Cashier ${i} (${branch.city})`,
        email: `cashier${i}.${tag}@momomgr.com`,
        role: "CASHIER", branchId: branch.id, hashedPassword: cashierPwd,
      }));
    }
  }
  console.log(`  ✓ 1 admin, ${managers.length} managers, ${cashiers.length} cashiers`);

  // --- 3. MOBILE LINES (all 9 operators × 4 branches) ---
  const linesByBranch: Record<string, Array<{ id: string; operator: MobileOperator }>> = {};
  for (const branch of branches) {
    linesByBranch[branch.id] = [];
    for (const operator of ALL_OPERATORS) {
      const line = await prisma.mobileLine.create({ data: { operator, branchId: branch.id } });
      linesByBranch[branch.id].push({ id: line.id, operator });
    }
  }
  console.log(`  ✓ ${branches.length * ALL_OPERATORS.length} mobile lines`);

  // --- 4. FEE RATES (3 types × 36 lines = 108) ---
  for (const branch of branches) {
    const limits = CURRENCY_FEE_LIMITS[branch.currency];
    for (const line of linesByBranch[branch.id]) {
      const rates = OPERATOR_RATES[line.operator];
      await prisma.feeRate.createMany({
        data: [
          { mobileLineId: line.id, transactionType: "DEPOSIT",    rateType: "PERCENTAGE", rate: 0,           minFee: null,         maxFee: null },
          { mobileLineId: line.id, transactionType: "WITHDRAWAL", rateType: "PERCENTAGE", rate: rates.wRate, minFee: limits.wMin,  maxFee: limits.wMax },
          { mobileLineId: line.id, transactionType: "TRANSFER",   rateType: "PERCENTAGE", rate: rates.tRate, minFee: limits.tMin,  maxFee: limits.tMax },
        ],
      });
    }
  }
  console.log(`  ✓ ${branches.length * ALL_OPERATORS.length * 3} fee rates`);

  // --- 5. LINE FLOATS ---
  for (const branch of branches) {
    for (const line of linesByBranch[branch.id]) {
      await prisma.lineFloat.create({
        data: {
          mobileLineId: line.id,
          balance: STARTING_FLOATS[branch.currency]?.[line.operator] ?? 1000000,
          lowThreshold: LOW_THRESHOLDS[branch.currency],
        },
      });
    }
  }
  console.log(`  ✓ ${branches.length * ALL_OPERATORS.length} line floats`);

  // --- 6. BANK ACCOUNTS ---
  const BANK_NAMES  = ["Stanbic Bank Uganda", "Equity Bank Kenya", "CRDB Bank Tanzania", "Rawbank Congo"];
  const BANK_BALS: Record<string, number> = { UGX: 150000000, KES: 1500000, TZS: 45000000, CDF: 15000000 };
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    await prisma.bankAccount.create({
      data: {
        branchId: branch.id,
        bankName: BANK_NAMES[i],
        accountNumber: `10${rnd(10000000, 99999999)}`,
        balance: BANK_BALS[branch.currency],
        currency: branch.currency,
      },
    });
  }
  console.log(`  ✓ ${branches.length} bank accounts`);

  // --- 7. SHIFTS & TRANSACTIONS ---
  // 5 closed shifts per cashier, 10 transactions per shift = 600 total transactions
  const SHIFT_DAY_OFFSETS = [28, 21, 14, 7, 3]; // days ago for each shift

  let totalShifts = 0;
  let totalTransactions = 0;

  for (const branch of branches) {
    const branchCashiers = cashiers.filter((c) => c.branchId === branch.id);
    const branchLines    = linesByBranch[branch.id];
    const amtCfg         = TX_AMOUNT_CONFIG[branch.currency];
    const limits         = CURRENCY_FEE_LIMITS[branch.currency];

    for (const cashier of branchCashiers) {
      for (let s = 0; s < 5; s++) {
        const dayOffset = SHIFT_DAY_OFFSETS[s];
        const openedAt  = new Date(Date.now() - dayOffset * 86400000);
        openedAt.setHours(7 + rnd(0, 2), rnd(0, 59), 0, 0);
        const closedAt = new Date(openedAt.getTime() + (8 + rnd(0, 3)) * 3600000);

        const shift = await prisma.shift.create({
          data: { cashierId: cashier.id, branchId: branch.id, status: "CLOSED", openedAt, closedAt },
        });
        totalShifts++;

        // Snapshots for every line in branch
        for (const line of branchLines) {
          const openBal = STARTING_FLOATS[branch.currency]?.[line.operator] ?? 1000000;
          await prisma.shiftLineSnapshot.create({
            data: {
              shiftId: shift.id,
              mobileLineId: line.id,
              openingBalance: openBal,
              closingBalance: openBal + rnd(-200000, 200000),
            },
          });
        }

        // 10 transactions per shift
        for (let t = 0; t < 10; t++) {
          const line = pick(branchLines);
          const type = pick(TX_TYPES);

          const rawAmt =
            amtCfg.decimals === 0
              ? rnd(amtCfg.min, amtCfg.max)
              : round2(Math.random() * (amtCfg.max - amtCfg.min) + amtCfg.min);

          const opRates = OPERATOR_RATES[line.operator];
          let fee = 0;
          if (type === "WITHDRAWAL") {
            fee = calcFee(opRates.wRate, rawAmt, limits.wMin, limits.wMax);
          } else if (type === "TRANSFER") {
            fee = calcFee(opRates.tRate, rawAmt, limits.tMin, limits.tMax);
          }
          fee = amtCfg.decimals === 0 ? Math.round(fee) : round2(fee);

          // Spread transactions within the shift window
          const txTime = new Date(
            openedAt.getTime() + (t + 1) * rnd(20 * 60000, 40 * 60000)
          );

          await prisma.transaction.create({
            data: {
              shiftId: shift.id,
              mobileLineId: line.id,
              branchId: branch.id,
              cashierId: cashier.id,
              type,
              amount: rawAmt,
              fee,
              customerName: pick(CUSTOMER_NAMES),
              customerPhone: randomPhone(branch.country),
              reference: `REF${Date.now().toString(36).toUpperCase()}${rnd(100, 999)}`,
              createdAt: txTime,
            },
          });
          totalTransactions++;
        }
      }
    }
  }
  console.log(`  ✓ ${totalShifts} shifts, ${totalTransactions} transactions`);

  // --- 8. NOTIFICATIONS ---
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: "WELCOME",
        title: "Welcome to MoMo Manager",
        message: "Your admin account is ready. You can now manage all branches, users, and mobile money operations.",
      },
      ...branches.map((b: { id: string; name: string }) => ({
        branchId: b.id,
        type: "LOW_FLOAT" as const,
        title: "Float Health Check",
        message: `Seed data loaded for ${b.name}. Monitor float levels as transactions are recorded.`,
      })),
      {
        type: "SYSTEM" as const,
        title: "System Initialized",
        message: "MoMo Manager has been seeded with test data across all 4 branches.",
      },
    ],
  });
  console.log(`  ✓ ${branches.length + 2} notifications`);

  console.log(`
✅ Seed complete!

Login credentials:
  Admin:   admin@momomgr.com        / Admin@1234
  Manager: manager1.ug@momomgr.com  / Manager@1234
  Cashier: cashier1.ug@momomgr.com  / Cashier@1234
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
