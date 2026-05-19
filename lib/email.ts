import { Resend } from "resend";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "MoMo Manager <noreply@momomanager.app>";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return; // dev without key — silently skip
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, react });
  } catch {
    // Non-critical — never let email failure break the primary operation
  }
}
