// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Maps a role to its dashboard path segment.
 * LABTECH → lab, PHARMACIST → pharmacy, others → lowercase role.
 */
function roleToDashboardPath(role: string): string {
  switch (role.toUpperCase()) {
    case "LABTECH":    return "lab";
    case "PHARMACIST": return "pharmacy";
    default:           return role.toLowerCase();
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role as string;
  redirect(`/dashboard/${roleToDashboardPath(role)}`);
}

