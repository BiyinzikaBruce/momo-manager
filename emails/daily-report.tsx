import {
  Html, Head, Body, Container, Preview,
  Section, Text, Hr, Button,
} from "@react-email/components";
import React from "react";

interface DailyReportProps {
  managerName: string;
  branchName: string;
  currency: string;
  date: string;
  txCount: number;
  totalAmount: number;
  totalFees: number;
  deposits: number;
  withdrawals: number;
  transfers: number;
  shiftsOpened: number;
  appUrl: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function DailyReportEmail({
  managerName, branchName, currency, date,
  txCount, totalAmount, totalFees, deposits, withdrawals, transfers, shiftsOpened,
  appUrl,
}: DailyReportProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Daily Report — {branchName} · {date}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

          <Section style={{ background: "linear-gradient(135deg, #E040A0, #FF6B35)", padding: "28px 40px" }}>
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Daily Summary</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: 0 }}>
              {branchName} · {date}
            </Text>
          </Section>

          <Section style={{ padding: "28px 40px 0" }}>
            <Text style={{ fontSize: 15, color: "#333", margin: "0 0 24px" }}>
              Hi {managerName}, here&apos;s your branch summary for today.
            </Text>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Total Transactions", value: String(txCount),                          bg: "#fafafa" },
                  { label: "Total Amount",        value: `${currency} ${fmt(totalAmount)}`,        bg: "#ffffff" },
                  { label: "Fees Collected",      value: `${currency} ${fmt(totalFees)}`,          bg: "#fafafa", accent: true },
                  { label: "Deposits",            value: String(deposits),                          bg: "#ffffff" },
                  { label: "Withdrawals",         value: String(withdrawals),                       bg: "#fafafa" },
                  { label: "Transfers",           value: String(transfers),                         bg: "#ffffff" },
                  { label: "Shifts Opened",       value: String(shiftsOpened),                      bg: "#fafafa" },
                ].map(({ label, value, bg, accent }) => (
                  <tr key={label} style={{ backgroundColor: bg }}>
                    <td style={{ fontSize: 13, color: "#666", padding: "10px 12px" }}>{label}</td>
                    <td style={{ fontSize: 14, fontWeight: accent ? 700 : 600, color: accent ? "#E040A0" : "#111", textAlign: "right", padding: "10px 12px" }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={{ padding: "24px 40px 32px" }}>
            <Button
              href={`${appUrl}/manager/reports`}
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
              View Full Report →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#eee", margin: "0 40px" }} />
          <Section style={{ padding: "20px 40px" }}>
            <Text style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
              This is an automated daily summary from MoMo Manager, sent at midnight.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
