import { NextResponse } from "next/server";
import { getDoctorAvailability } from "@/lib/availability";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const availabilities = await getDoctorAvailability(id);
    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Fetch Doctor Availability Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
