import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const lines = await prisma.mobileLine.findMany({
    where: { bankAccountId: { not: null } },
    include: { float: true, bankAccount: true },
  });

  console.log(`Found ${lines.length} linked line(s)`);

  for (const line of lines) {
    if (!line.bankAccountId || !line.float) continue;
    const openingBal = Number(line.float.balance);
    const bankBal = Number(line.bankAccount?.balance ?? 0);
    console.log(`  ${line.operator}: float=${openingBal}, bank before=${bankBal}`);
    await prisma.bankAccount.update({
      where: { id: line.bankAccountId },
      data: { balance: { decrement: openingBal } },
    });
    const upd = await prisma.bankAccount.findUnique({ where: { id: line.bankAccountId } });
    console.log(`  Bank balance after: ${Number(upd?.balance)}`);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
