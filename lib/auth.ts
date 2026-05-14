// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import prisma from "./prisma";
import { hash, compare } from "bcrypt-ts";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: async (password) => await hash(password, 10),
      verify: async ({ hash, password }) => await compare(password, hash),
    },
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
  },
});
