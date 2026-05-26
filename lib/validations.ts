import { z } from "zod";
import { formatPhoneNumber, validatePhoneNumber } from "./phone-format";

// Common user schema
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().superRefine((val, ctx) => {
    const cleaned = val.replace(/[\s\-\(\)]/g, "");
    if (!validatePhoneNumber(cleaned)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Enter a valid Ethiopian phone number (e.g. +251912345678, +251712345678, 0912345678, or 0712345678)",
      });
    }
  }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&#^_-]/, "Password must contain at least one special character (@$!%*?&#^_-)"),
});

// Patient schema
export const patientSchema = userSchema.extend({
  dateOfBirth: z.string().optional(),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" ? undefined : Number(val)))
    .refine((val) => val === undefined || (val >= 0 && val <= 120), {
      message: "Age must be between 0 and 120",
    }),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"])
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "Male", "Female", "Other"]).optional(),
}).superRefine((data, ctx) => {
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    if (dob > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of birth cannot be in the future",
        path: ["dateOfBirth"],
      });
    }
  }
});

// Patient schema with confirm password
export const registerPatientSchema = patientSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Doctor schema
export const doctorSchema = userSchema.extend({
  specialization: z.string().min(1, "Specialization is required"),
  departmentId: z.string().optional(), // Adding this in case it's used
  gender: z.enum(["MALE", "FEMALE", "OTHER", "Male", "Female", "Other"]).optional(),
});

// Receptionist schema
export const receptionistSchema = userSchema.extend({
  gender: z.enum(["MALE", "FEMALE", "OTHER", "Male", "Female", "Other"]).optional(),
});
