import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignup: true, // Admin creates accounts only
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh if >1 day old
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
