import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return (
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold capitalize">
        {((session?.user as any)?.role || "USER").toLowerCase()} Dashboard
      </h1>
      <div>
        <p className="font-medium">{session?.user.name}</p>
      </div>
    </header>
  );
}
