// components/layout/Header.tsx
import { auth } from "@/lib/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold capitalize">
        {session?.user.role.toLowerCase()} Dashboard
      </h1>
      <div>
        <p className="font-medium">{session?.user.name}</p>
      </div>
    </header>
  );
}
