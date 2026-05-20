import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync } from "crypto";
import { randomUUID } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

async function main() {
  console.log("Clearing all data...");
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
  console.log("All data cleared.");

  const userId = randomUUID();
  const now = new Date();
  await prisma.user.create({
    data: {
      id: userId, name: "Super Admin", email: "admin@momomgr.com",
      emailVerified: true, createdAt: now, updatedAt: now,
      role: "ADMIN", isActive: true,
    },
  });
  await prisma.account.create({
    data: {
      id: randomUUID(), userId, accountId: "admin@momomgr.com",
      providerId: "credential", password: hashPassword("Admin@1234"),
      createdAt: now, updatedAt: now,
    },
  });
  console.log("Done. Login: admin@momomgr.com / Admin@1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
