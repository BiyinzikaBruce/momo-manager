import {
  Html, Head, Body, Container, Preview,
  Section, Text, Hr, Button,
} from "@react-email/components";
import React from "react";

interface ShiftSummaryProps {
  cashierName: string;
  branchName: string;
  currency: string;
  openedAt: string;
  closedAt: string;
  txCount: number;
  totalAmount: number;
  totalFees: number;
  deposits: number;
  withdrawals: number;
  transfers: number;
  shiftId: string;
  appUrl: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function ShiftSummaryEmail({
  cashierName, branchName, currency, openedAt, closedAt,
  txCount, totalAmount, totalFees, deposits, withdrawals, transfers,
  shiftId, appUrl,
}: ShiftSummaryProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Shift closed — ${cashierName} · ${txCount} transactions`}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

          {/* Header */}
          <Section style={{ background: "linear-gradient(135deg, #E040A0, #FF6B35)", padding: "28px 40px" }}>
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Shift Closed</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: 0 }}>
              {cashierName} · {branchName}
            </Text>
          </Section>

          {/* Timing */}
          <Section style={{ padding: "24px 40px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ fontSize: 12, color: "#888", paddingBottom: 4 }}>Opened</td>
                  <td style={{ fontSize: 13, color: "#333", textAlign: "right" }}>{openedAt}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: 12, color: "#888" }}>Closed</td>
                  <td style={{ fontSize: 13, color: "#333", textAlign: "right" }}>{closedAt}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: "#f0f0f0", margin: "20px 40px" }} />

          {/* Stats */}
          <Section style={{ padding: "0 40px 24px" }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 16px", textTransform: "uppercase" as const, letterSpacing: 1 }}>
              Summary
            </Text>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Transactions",  value: String(txCount) },
                  { label: "Total Amount",  value: `${currency} ${fmt(totalAmount)}` },
                  { label: "Total Fees",    value: `${currency} ${fmt(totalFees)}`, accent: true },
                  { label: "Deposits",      value: String(deposits) },
                  { label: "Withdrawals",   value: String(withdrawals) },
                  { label: "Transfers",     value: String(transfers) },
                ].map(({ label, value, accent }) => (
                  <tr key={label}>
                    <td style={{ fontSize: 13, color: "#666", paddingBottom: 10 }}>{label}</td>
                    <td style={{ fontSize: 14, fontWeight: accent ? 700 : 600, color: accent ? "#E040A0" : "#111", textAlign: "right", paddingBottom: 10 }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={{ padding: "0 40px 32px" }}>
            <Button
              href={`${appUrl}/manager/shifts/${shiftId}`}
              style={{
                background: "linear-gradient(135deg, #E040A0, #FF6B35)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 28px",
                borderRadius: 8,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              View Full Shift →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#eee", margin: "0 40px" }} />
          <Section style={{ padding: "20px 40px" }}>
            <Text style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
              This summary was sent automatically when the shift was closed.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
