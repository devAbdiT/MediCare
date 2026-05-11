// app/dashboard/admin/departments/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DepartmentManagement from "@/components/admin/DepartmentManagement";

export default async function AdminDepartmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardLayout role="admin">
      <DepartmentManagement />
    </DashboardLayout>
  );
}
