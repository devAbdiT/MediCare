// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "PATIENT",
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },

  advanced: {
    cookies: {
      secure: process.env.NODE_ENV === "production",
    },
  },
});
