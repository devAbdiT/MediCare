import prisma from "@/lib/prisma";

export interface Settings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  appointmentDurationMins: number;
  currency: string;
}

export const defaultSettings: Settings = {
  clinicName: "Jimma University Medical Center",
  clinicAddress: "Jimma, Ethiopia",
  clinicPhone: "",
  clinicEmail: "",
  workingHoursStart: "08:00",
  workingHoursEnd: "17:00",
  workingDays: [1, 2, 3, 4, 5],
  appointmentDurationMins: 30,
  currency: "ETB",
};

export async function getSystemSettings(): Promise<Settings> {
  try {
    const record = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!record) {
      return defaultSettings;
    }

    return record.data as unknown as Settings;
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return defaultSettings;
  }
}
