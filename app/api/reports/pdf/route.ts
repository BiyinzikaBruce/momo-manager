import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const styles = StyleSheet.create({
  page:       { padding: 40, fontSize: 9, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header:     { marginBottom: 20 },
  title:      { fontSize: 18, fontWeight: "bold", color: "#E040A0", marginBottom: 4 },
  subtitle:   { fontSize: 10, color: "#666666" },
  table:      { marginTop: 12 },
  tableHead:  { flexDirection: "row", backgroundColor: "#f3f3f3", borderBottomWidth: 1, borderBottomColor: "#dddddd", paddingVertical: 5 },
  tableRow:   { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eeeeee", paddingVertical: 4 },
  cell:       { flex: 1, paddingHorizontal: 4 },
  cellRight:  { flex: 1, paddingHorizontal: 4, textAlign: "right" },
  headText:   { fontSize: 8, fontWeight: "bold", color: "#333333" },
  bodyText:   { fontSize: 8, color: "#444444" },
  summary:    { marginTop: 20, flexDirection: "row", gap: 12 },
  summaryBox: { flex: 1, padding: 10, backgroundColor: "#fdf0f8", borderRadius: 6 },
  summaryVal: { fontSize: 14, fontWeight: "bold", color: "#E040A0" },
  summaryLbl: { fontSize: 8, color: "#999999", marginTop: 2 },
  footer:     { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#bbbbbb" },
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get("branchId") ?? "";
  const type     = searchParams.get("type")     ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";

  const effectiveBranchId =
    user.role === "ADMIN" ? branchId : (user.branchId ?? "");

  const where: Record<string, unknown> = {
    ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    ...(type              ? { type }                       : {}),
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
      },
    } : {}),
  };

  const transactions = await db.transaction.findMany({
    where,
    include: {
      mobileLine: { select: { operator: true } },
      cashier:    { select: { name: true } },
      branch:     { select: { name: true, currency: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const totalAmount = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const totalFees   = transactions.reduce((s, t) => s + Number(t.fee),    0);
  const currency    = transactions[0]?.branch.currency ?? "";

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, "MoMo Manager — Transaction Report"),
        React.createElement(Text, { style: styles.subtitle },
          `Period: ${dateFrom || "All time"} → ${dateTo || "Today"} | Generated: ${new Date().toLocaleString()}`
        )
      ),
      // Summary boxes
      React.createElement(
        View,
        { style: styles.summary },
        ...[
          { val: String(transactions.length), lbl: "Transactions" },
          { val: `${currency} ${fmt(totalAmount)}`, lbl: "Total Amount" },
          { val: `${currency} ${fmt(totalFees)}`,   lbl: "Total Fees" },
        ].map((item, i) =>
          React.createElement(
            View,
            { key: i, style: styles.summaryBox },
            React.createElement(Text, { style: styles.summaryVal }, item.val),
            React.createElement(Text, { style: styles.summaryLbl }, item.lbl)
          )
        )
      ),
      // Table
      React.createElement(
        View,
        { style: styles.table },
        // Head
        React.createElement(
          View,
          { style: styles.tableHead },
          ...["Date", "Branch", "Operator", "Type", "Amount", "Fee", "Customer", "Cashier"].map((h) =>
            React.createElement(View, { key: h, style: styles.cell },
              React.createElement(Text, { style: styles.headText }, h)
            )
          )
        ),
        // Rows
        ...transactions.map((tx, i) =>
          React.createElement(
            View,
            { key: tx.id, style: [styles.tableRow, { backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }] as never },
            ...[
              new Date(tx.createdAt).toLocaleDateString(),
              tx.branch.name,
              tx.mobileLine.operator,
              tx.type,
              fmt(Number(tx.amount)),
              fmt(Number(tx.fee)),
              tx.customerName ?? "—",
              tx.cashier.name,
            ].map((v, j) =>
              React.createElement(View, { key: j, style: styles.cell },
                React.createElement(Text, { style: styles.bodyText }, v)
              )
            )
          )
        )
      ),
      // Footer
      React.createElement(Text, { style: styles.footer }, "MoMo Manager • Confidential")
    )
  );

  const buffer = await renderToBuffer(doc);
  const filename = `momo-report-${dateFrom || "all"}-${dateTo || "all"}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
