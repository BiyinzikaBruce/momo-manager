import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";
import { sendEmail } from "@/lib/email";
import ShiftSummaryEmail from "@/emails/shift-summary";
import React from "react";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("CASHIER");
  if (error) return error;

  const user = session!.user as AuthUser;
  const { id } = await params;

  const shift = await db.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (shift.cashierId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (shift.status === "CLOSED") return NextResponse.json({ error: "Shift already closed" }, { status: 409 });

  // Capture current float balances as closing snapshot
  const snapshots = await db.shiftLineSnapshot.findMany({
    where: { shiftId: id },
    include: { mobileLine: { include: { float: true } } },
  });

  const now = new Date();

  await Promise.all([
    // Update closing balances on snapshots
    ...snapshots.map((s) =>
      db.shiftLineSnapshot.update({
        where: { id: s.id },
        data: { closingBalance: s.mobileLine.float?.balance ?? 0 },
      })
    ),
    // Close the shift
    db.shift.update({
      where: { id },
      data: { status: "CLOSED", closedAt: now },
    }),
  ]);

  const [closed, txCount, cashier] = await Promise.all([
    db.shift.findUnique({
      where: { id },
      include: {
        lineSnapshots: { include: { mobileLine: { select: { operator: true } } } },
        _count: { select: { transactions: true } },
      },
    }),
    db.transaction.count({ where: { shiftId: id } }),
    db.user.findUnique({ where: { id: user.id }, select: { name: true } }),
  ]);

  // Notify and email the branch manager that a shift was closed
  if (shift.branchId) {
    const [manager, branch, txStats] = await Promise.all([
      db.user.findFirst({
        where: { branchId: shift.branchId, role: "MANAGER" },
        select: { id: true, email: true },
      }),
      db.branch.findUnique({ where: { id: shift.branchId }, select: { name: true, currency: true } }),
      db.transaction.groupBy({
        by: ["type"],
        where: { shiftId: id },
        _count: { _all: true },
        _sum: { amount: true, fee: true },
      }),
    ]);

    if (manager) {
      const txSummary = { count: txCount, totalAmount: 0, totalFees: 0, deposits: 0, withdrawals: 0, transfers: 0 };
      for (const g of txStats) {
        txSummary.totalAmount += Number(g._sum.amount ?? 0);
        txSummary.totalFees   += Number(g._sum.fee ?? 0);
        if (g.type === "DEPOSIT")    txSummary.deposits    = g._count._all;
        if (g.type === "WITHDRAWAL") txSummary.withdrawals = g._count._all;
        if (g.type === "TRANSFER")   txSummary.transfers   = g._count._all;
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

      await db.notification.create({
        data: {
          userId: manager.id,
          branchId: shift.branchId,
          type: "SYSTEM",
          title: "Shift Closed",
          message: `${cashier?.name ?? "A cashier"} closed their shift with ${txCount} transaction${txCount !== 1 ? "s" : ""}.`,
        },
      }).catch(() => {});

      sendEmail({
        to: manager.email,
        subject: `Shift Closed — ${cashier?.name ?? "Cashier"} · ${txCount} transactions`,
        react: React.createElement(ShiftSummaryEmail, {
          cashierName:  cashier?.name ?? "Cashier",
          branchName:   branch?.name ?? "",
          currency:     branch?.currency ?? "",
          openedAt:     fmt(new Date(shift.openedAt)),
          closedAt:     fmt(now),
          txCount,
          totalAmount:  txSummary.totalAmount,
          totalFees:    txSummary.totalFees,
          deposits:     txSummary.deposits,
          withdrawals:  txSummary.withdrawals,
          transfers:    txSummary.transfers,
          shiftId:      id,
          appUrl,
        }),
      });
    }
  }

  await Promise.all([
    invalidateTag(tags.shifts),
    invalidateTag(tags.notifications),
  ]);
  return NextResponse.json(closed);
}
