import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
} as never);

async function main() {
  // For each transaction that was recorded, reverse the float impact
  // and re-apply with the correct direction (deposit = +, withdrawal/transfer = -)
  const transactions = await prisma.transaction.findMany({
    include: { mobileLine: { include: { float: true } } },
  });

  console.log(`Re-applying ${transactions.length} transaction(s)...`);

  for (const tx of transactions) {
    const float = tx.mobileLine.float;
    if (!float) continue;

    const amount = Number(tx.amount);
    // Old logic: WITHDRAWAL = +, DEPOSIT/TRANSFER = -
    // New logic: DEPOSIT = +, WITHDRAWAL/TRANSFER = -
    const oldDelta = tx.type === "WITHDRAWAL" ? amount : -amount;
    const newDelta = tx.type === "DEPOSIT" ? amount : -amount;
    const correction = newDelta - oldDelta; // apply the diff

    const before = Number(float.balance);
    const after = before + correction;
    await prisma.lineFloat.update({
      where: { id: float.id },
      data: { balance: after },
    });
    console.log(`  ${tx.type} ${amount} → float ${before} → ${after} (correction: ${correction > 0 ? "+" : ""}${correction})`);
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
