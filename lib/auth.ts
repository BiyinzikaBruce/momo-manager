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
    disableSignUp: true, // staff accounts are created by an ADMIN in /api/users
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      // input: false = users can never set these themselves (sign-up or update-user).
      // Only an ADMIN, through /api/users, may change them.
      role: { type: "string", required: true, defaultValue: "CASHIER", input: false },
      branchId: { type: "string", required: false, input: false },
      isActive: { type: "boolean", required: true, defaultValue: true, input: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
