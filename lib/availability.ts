import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function getDoctorAvailability(doctorId: string) {
  let availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId },
  });

  // Auto-initialize if empty
  if (availabilities.length === 0) {
    const defaultAvailabilities = [];
    for (let i = 0; i < 7; i++) {
      defaultAvailabilities.push({
        doctorId,
        dayOfWeek: i,
        startTime: "08:00",
        endTime: "17:00",
        isActive: i >= 1 && i <= 5, // Monday to Friday active
      });
    }

    await prisma.doctorAvailability.createMany({
      data: defaultAvailabilities,
    });

    availabilities = await prisma.doctorAvailability.findMany({
      where: { doctorId },
    });
  }

  return availabilities;
}

export async function validateDoctorAvailability(doctorId: string, dateTime: Date) {
  const availabilities = await getDoctorAvailability(doctorId);
  
  const dayOfWeek = dateTime.getDay();
  const timeString = format(dateTime, "HH:mm"); // e.g. "09:30"

  const dayAvailability = availabilities.find(a => a.dayOfWeek === dayOfWeek);

  if (!dayAvailability || !dayAvailability.isActive) {
    return { valid: false, message: "Doctor is not available on this day." };
  }

  if (timeString < dayAvailability.startTime || timeString >= dayAvailability.endTime) {
    return { valid: false, message: `Doctor is not available at this time. Working hours are ${dayAvailability.startTime} - ${dayAvailability.endTime}.` };
  }

  return { valid: true };
}
