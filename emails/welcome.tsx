import {
  Html, Head, Body, Container, Preview,
  Section, Text, Hr, Button,
} from "@react-email/components";
import React from "react";

interface WelcomeEmailProps {
  name: string;
  email: string;
  password: string;
  role: string;
  appUrl: string;
}

export default function WelcomeEmail({ name, email, password, role, appUrl }: WelcomeEmailProps) {
  const roleLabel = role === "ADMIN" ? "Administrator" : role === "MANAGER" ? "Branch Manager" : "Cashier";
  const dashboard =
    role === "ADMIN"   ? `${appUrl}/dashboard` :
    role === "MANAGER" ? `${appUrl}/manager/dashboard` :
    `${appUrl}/cashier/dashboard`;

  return (
    <Html lang="en">
      <Head />
      <Preview>Your MoMo Manager account is ready</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

          {/* Header */}
          <Section style={{ background: "linear-gradient(135deg, #E040A0, #FF6B35)", padding: "32px 40px" }}>
            <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: 800, margin: 0 }}>MoMo Manager</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "4px 0 0" }}>Mobile money, managed.</Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
              Welcome, {name}
            </Text>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 24px" }}>
              Your account has been created with the <strong>{roleLabel}</strong> role. Use the credentials below to sign in.
            </Text>

            <Section style={{ backgroundColor: "#f9f9fb", borderRadius: 8, padding: "20px 24px", margin: "0 0 24px" }}>
              <Text style={{ fontSize: 12, color: "#888", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Email</Text>
              <Text style={{ fontSize: 15, color: "#111", fontWeight: 600, margin: "0 0 16px" }}>{email}</Text>
              <Text style={{ fontSize: 12, color: "#888", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Temporary Password</Text>
              <Text style={{ fontSize: 15, color: "#111", fontWeight: 600, margin: 0, fontFamily: "monospace", letterSpacing: 2 }}>{password}</Text>
            </Section>

            <Button
              href={dashboard}
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
              Sign In to Dashboard →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#eee", margin: "0 40px" }} />

          <Section style={{ padding: "20px 40px" }}>
            <Text style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
              Please change your password after your first login. If you didn&apos;t expect this email, contact your administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
