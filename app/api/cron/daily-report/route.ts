import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import DailyReportEmail from "@/emails/daily-report";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify the Vercel Cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Yesterday's date range
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const dateLabel = yesterday.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Get all active branches with managers
  const branches = await db.branch.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { role: "MANAGER" },
        select: { id: true, name: true, email: true },
      },
    },
  });

  const results: { branch: string; sent: number }[] = [];

  for (const branch of branches) {
    if (branch.users.length === 0) continue;

    // Aggregate yesterday's transactions for this branch
    const txStats = await db.transaction.groupBy({
      by: ["type"],
      where: {
        branchId: branch.id,
        createdAt: { gte: yesterday, lte: endOfYesterday },
      },
      _count: { _all: true },
      _sum: { amount: true, fee: true },
    });

    const shiftsOpened = await db.shift.count({
      where: {
        branchId: branch.id,
        openedAt: { gte: yesterday, lte: endOfYesterday },
      },
    });

    const summary = { count: 0, totalAmount: 0, totalFees: 0, deposits: 0, withdrawals: 0, transfers: 0 };
    for (const g of txStats) {
      summary.count       += g._count._all;
      summary.totalAmount += Number(g._sum.amount ?? 0);
      summary.totalFees   += Number(g._sum.fee ?? 0);
      if (g.type === "DEPOSIT")    summary.deposits    = g._count._all;
      if (g.type === "WITHDRAWAL") summary.withdrawals = g._count._all;
      if (g.type === "TRANSFER")   summary.transfers   = g._count._all;
    }

    if (summary.count === 0 && shiftsOpened === 0) continue; // No activity — skip

    for (const manager of branch.users) {
      sendEmail({
        to: manager.email,
        subject: `Daily Report — ${branch.name} · ${dateLabel}`,
        react: React.createElement(DailyReportEmail, {
          managerName: manager.name,
          branchName:  branch.name,
          currency:    branch.currency,
          date:        dateLabel,
          txCount:     summary.count,
          totalAmount: summary.totalAmount,
          totalFees:   summary.totalFees,
          deposits:    summary.deposits,
          withdrawals: summary.withdrawals,
          transfers:   summary.transfers,
          shiftsOpened,
          appUrl,
        }),
      });
    }

    results.push({ branch: branch.name, sent: branch.users.length });
  }

  return NextResponse.json({ ok: true, date: dateLabel, results });
}
