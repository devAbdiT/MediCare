// lib/pricing.ts
import { AppointmentType } from "@prisma/client";

export function getAppointmentBookingAmount(appointmentType: AppointmentType): number {
  switch (appointmentType) {
    case "NEW_VISIT":
      return 200;
    case "CONSULTATION":
      return 200;
    case "FOLLOW_UP":
      return 100;
    case "EMERGENCY":
      return 300;
    default:
      return 200;
  }
}
