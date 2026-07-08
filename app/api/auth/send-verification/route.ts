// app/api/auth/send-verification/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";

const TOKEN_TTL_HOURS = 24;

export async function POST(req: Request) {
  try {
    // Accept email from body (for resend from /verify-email before session exists)
    // or fall back to the current session user's email.
    const body = await req.json().catch(() => ({}));
    let email: string | undefined = body?.email;

    if (!email) {
      const session = await auth.api.getSession({ headers: await headers() });
      email = session?.user?.email;
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Look up the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the address exists
      return NextResponse.json({ message: "If that address is registered, a link has been sent." });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    // Store (or replace) the verification token using the Verification model
    // Better Auth uses identifier = email, value = token
    await prisma.verification.deleteMany({ where: { identifier: email } });
    await prisma.verification.create({
      data: {
        identifier: email,
        value: token,
        expiresAt,
      },
    });

    // Build the verification URL
    const origin = req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const verifyUrl = `${origin}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // ── Send email ────────────────────────────────────────────────────────────
    const emailSent = await trySendEmail(email, user.name, verifyUrl);

    if (!emailSent) {
      // If email is not configured, log the link for dev convenience
      console.log(
        "\n[MediCare] Email verification link (no mailer configured):\n" +
        `  User:  ${user.name} <${email}>\n` +
        `  Link:  ${verifyUrl}\n`
      );
    }

    return NextResponse.json({ message: "Verification email sent." });
  } catch (err) {
    console.error("send-verification error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * Attempts to send the verification email via nodemailer if SMTP env vars are set.
 * Returns true if the email was dispatched, false if no mailer is configured.
 */
async function trySendEmail(
  to: string,
  name: string,
  verifyUrl: string
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"MediCare" <no-reply@medicare.local>`;

  if (!host || !user || !pass) return false;

  try {
    // Dynamic import so nodemailer is only loaded when SMTP is configured
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: "Verify your MediCare email address",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#1E4A8A;font-size:28px;margin:0">MediCare</h1>
            <p style="color:#5A6E8A;font-size:14px;margin:4px 0 0">Patient Management System</p>
          </div>
          <h2 style="color:#1A2A4A;font-size:22px">Hi ${name},</h2>
          <p style="color:#5A6E8A;line-height:1.6">
            Please verify your email address to activate your MediCare account and access your dashboard.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}"
               style="display:inline-block;padding:14px 32px;background:#1E4A8A;color:#fff;
                      font-weight:700;border-radius:12px;text-decoration:none;font-size:15px">
              Verify Email Address
            </a>
          </div>
          <p style="color:#8A9CBA;font-size:13px">
            This link expires in 24 hours. If you didn't create a MediCare account, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
          <p style="color:#8A9CBA;font-size:12px;text-align:center">MediCare · Secure Patient Management</p>
        </div>
      `,
    });

    return true;
  } catch (err) {
    console.error("[MediCare] Failed to send verification email:", err);
    return false;
  }
}
