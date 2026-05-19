import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

// Strip BOM (U+FEFF) and whitespace — Vercel env var piping can prepend a BOM
function cleanUrl(raw: string | undefined, fallback: string): string {
  return (raw ?? fallback).replace(/^﻿/, "").trim();
}

export const auth = betterAuth({
  baseURL: cleanUrl(process.env.BETTER_AUTH_URL, "http://localhost:3000"),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignup: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "CASHIER" },
      branchId: { type: "string", required: false },
      isActive: { type: "boolean", required: true, defaultValue: true },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
