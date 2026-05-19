import {
  Html, Head, Body, Container, Preview,
  Section, Text, Hr, Button,
} from "@react-email/components";
import React from "react";

interface LowFloatAlertProps {
  branchName: string;
  operator: string;
  currentBalance: number;
  threshold: number;
  currency: string;
  appUrl: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function LowFloatAlert({
  branchName, operator, currentBalance, threshold, currency, appUrl,
}: LowFloatAlertProps) {
  const pct = threshold > 0 ? Math.round((currentBalance / threshold) * 100) : 0;

  return (
    <Html lang="en">
      <Head />
      <Preview>⚠️ Low float alert — {operator} at {branchName}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

          {/* Alert header */}
          <Section style={{ backgroundColor: "#FEF2F2", borderBottom: "1px solid #FECACA", padding: "20px 40px" }}>
            <Text style={{ fontSize: 15, fontWeight: 700, color: "#DC2626", margin: 0 }}>
              ⚠️  Low Float Alert
            </Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>MoMo Manager — Automated Alert</Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
              {operator.replace("_", " ")} · {branchName}
            </Text>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 24px" }}>
              The float balance for this line has dropped below the configured threshold and requires attention.
            </Text>

            {/* Stats */}
            <Section style={{ backgroundColor: "#FEF2F2", borderRadius: 8, padding: "20px 24px", margin: "0 0 24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: 12, color: "#888", paddingBottom: 8 }}>Current Balance</td>
                    <td style={{ fontSize: 16, fontWeight: 700, color: "#DC2626", textAlign: "right" }}>
                      {currency} {fmt(currentBalance)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 12, color: "#888" }}>Minimum Threshold</td>
                    <td style={{ fontSize: 14, fontWeight: 600, color: "#555", textAlign: "right" }}>
                      {currency} {fmt(threshold)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ paddingTop: 12 }}>
                      <div style={{ width: "100%", height: 6, backgroundColor: "#FCA5A5", borderRadius: 3 }}>
                        <div style={{ width: `${Math.max(2, pct)}%`, height: 6, backgroundColor: "#DC2626", borderRadius: 3 }} />
                      </div>
                      <Text style={{ fontSize: 11, color: "#DC2626", margin: "6px 0 0", textAlign: "right" as const }}>
                        {pct}% of threshold
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Button
              href={`${appUrl}/manager/float`}
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
              View Float Dashboard →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#eee", margin: "0 40px" }} />
          <Section style={{ padding: "20px 40px" }}>
            <Text style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
              This is an automated alert from MoMo Manager. Adjust thresholds in Settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
